-- =====================================================
-- ETAPA 1: ECONOMIA CORE (SEM STRIPE)
-- =====================================================

-- 1. Tabela de Pacotes de Coins (para futura compra ou concessão manual)
CREATE TABLE public.coin_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coins INTEGER NOT NULL CHECK (coins > 0),
  bonus_coins INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER, -- NULL = pacote só para concessão manual
  currency TEXT DEFAULT 'BRL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de Lotes de Coins (para expiração FIFO)
CREATE TABLE public.coin_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  original_amount INTEGER NOT NULL CHECK (original_amount > 0),
  remaining_amount INTEGER NOT NULL CHECK (remaining_amount >= 0),
  source_type TEXT NOT NULL, -- 'purchase', 'prize', 'bonus', 'manual', 'refund'
  source_reference TEXT, -- ID da transação original
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  consumed_at TIMESTAMP WITH TIME ZONE -- quando zerou
);

-- 3. Adicionar campos na tabela de transações para rastreio de lotes
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.coin_batches(id),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Tabela de concessões manuais de coins (admin)
CREATE TABLE public.coin_grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount != 0),
  reason TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  batch_id UUID REFERENCES public.coin_batches(id),
  expires_in_days INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Índices para performance
CREATE INDEX idx_coin_batches_wallet ON public.coin_batches(wallet_id);
CREATE INDEX idx_coin_batches_expires ON public.coin_batches(expires_at) WHERE remaining_amount > 0;
CREATE INDEX idx_coin_batches_remaining ON public.coin_batches(wallet_id, remaining_amount) WHERE remaining_amount > 0;
CREATE INDEX idx_coin_grants_wallet ON public.coin_grants(wallet_id);
CREATE INDEX idx_transactions_batch ON public.transactions(batch_id);

-- 6. Enable RLS
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_grants ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies - Coin Packages (público para leitura)
CREATE POLICY "Anyone can view active coin packages"
ON public.coin_packages FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage coin packages"
ON public.coin_packages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'global_admin')
  )
);

-- 8. RLS Policies - Coin Batches (usuário vê seus próprios)
CREATE POLICY "Users can view their own coin batches"
ON public.coin_batches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE id = coin_batches.wallet_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all coin batches"
ON public.coin_batches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'global_admin', 'country_admin')
  )
);

CREATE POLICY "System can insert coin batches"
ON public.coin_batches FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update coin batches"
ON public.coin_batches FOR UPDATE
USING (true);

-- 9. RLS Policies - Coin Grants
CREATE POLICY "Admins can manage coin grants"
ON public.coin_grants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'global_admin', 'country_admin')
  )
);

CREATE POLICY "Users can view their own grants"
ON public.coin_grants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE id = coin_grants.wallet_id 
    AND user_id = auth.uid()
  )
);

-- 10. Função para conceder coins com lote
CREATE OR REPLACE FUNCTION public.grant_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_granted_by UUID DEFAULT NULL,
  p_expires_in_days INTEGER DEFAULT 60
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_batch_id UUID;
  v_grant_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar wallet do usuário
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'User wallet not found';
  END IF;
  
  -- Calcular expiração
  v_expires_at := now() + (p_expires_in_days || ' days')::INTERVAL;
  
  -- Criar lote
  INSERT INTO coin_batches (wallet_id, original_amount, remaining_amount, source_type, expires_at)
  VALUES (v_wallet_id, p_amount, p_amount, 'manual', v_expires_at)
  RETURNING id INTO v_batch_id;
  
  -- Criar registro de concessão
  INSERT INTO coin_grants (wallet_id, amount, reason, granted_by, batch_id, expires_in_days)
  VALUES (v_wallet_id, p_amount, p_reason, p_granted_by, v_batch_id, p_expires_in_days)
  RETURNING id INTO v_grant_id;
  
  -- Criar transação
  INSERT INTO transactions (wallet_id, type, amount, description, batch_id, metadata)
  VALUES (v_wallet_id, 'credit', p_amount, 'Concessão: ' || p_reason, v_batch_id, 
          jsonb_build_object('grant_id', v_grant_id, 'granted_by', p_granted_by));
  
  -- Atualizar saldo da wallet
  UPDATE wallets 
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount,
      updated_at = now()
  WHERE id = v_wallet_id;
  
  RETURN v_grant_id;
END;
$$;

-- 11. Função para consumir coins com FIFO
CREATE OR REPLACE FUNCTION public.consume_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_wallet_balance INTEGER;
  v_remaining INTEGER;
  v_batch RECORD;
  v_consume INTEGER;
BEGIN
  -- Buscar wallet e saldo
  SELECT id, balance INTO v_wallet_id, v_wallet_balance 
  FROM wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'User wallet not found';
  END IF;
  
  IF v_wallet_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  v_remaining := p_amount;
  
  -- Consumir lotes em ordem FIFO (mais antigos primeiro, não expirados)
  FOR v_batch IN 
    SELECT id, remaining_amount 
    FROM coin_batches 
    WHERE wallet_id = v_wallet_id 
      AND remaining_amount > 0 
      AND expires_at > now()
    ORDER BY created_at ASC
  LOOP
    IF v_remaining <= 0 THEN
      EXIT;
    END IF;
    
    v_consume := LEAST(v_remaining, v_batch.remaining_amount);
    
    UPDATE coin_batches 
    SET remaining_amount = remaining_amount - v_consume,
        consumed_at = CASE WHEN remaining_amount - v_consume = 0 THEN now() ELSE consumed_at END
    WHERE id = v_batch.id;
    
    v_remaining := v_remaining - v_consume;
  END LOOP;
  
  -- Criar transação de débito
  INSERT INTO transactions (wallet_id, type, amount, description, metadata)
  VALUES (v_wallet_id, 'debit', p_amount, p_description,
          jsonb_build_object('reference_type', p_reference_type, 'reference_id', p_reference_id));
  
  -- Atualizar saldo da wallet
  UPDATE wallets 
  SET balance = balance - p_amount,
      total_spent = total_spent + p_amount,
      updated_at = now()
  WHERE id = v_wallet_id;
  
  RETURN TRUE;
END;
$$;

-- 12. Função para limpar lotes expirados
CREATE OR REPLACE FUNCTION public.expire_coin_batches()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch RECORD;
  v_total_expired INTEGER := 0;
BEGIN
  FOR v_batch IN 
    SELECT cb.id, cb.wallet_id, cb.remaining_amount 
    FROM coin_batches cb
    WHERE cb.remaining_amount > 0 
      AND cb.expires_at <= now()
  LOOP
    -- Registrar expiração
    INSERT INTO transactions (wallet_id, type, amount, description, batch_id, metadata)
    VALUES (v_batch.wallet_id, 'expired', v_batch.remaining_amount, 'Coins expirados', v_batch.id,
            jsonb_build_object('expired_at', now()));
    
    -- Atualizar wallet
    UPDATE wallets 
    SET balance = balance - v_batch.remaining_amount,
        updated_at = now()
    WHERE id = v_batch.wallet_id;
    
    -- Zerar lote
    UPDATE coin_batches 
    SET remaining_amount = 0, consumed_at = now()
    WHERE id = v_batch.id;
    
    v_total_expired := v_total_expired + v_batch.remaining_amount;
  END LOOP;
  
  RETURN v_total_expired;
END;
$$;

-- 13. Triggers para updated_at
CREATE TRIGGER update_coin_packages_updated_at
BEFORE UPDATE ON public.coin_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Inserir pacotes padrão
INSERT INTO public.coin_packages (name, description, coins, bonus_coins, price_cents, sort_order) VALUES
('Starter', '100 EFA Coins para começar', 100, 0, 500, 1),
('Popular', '500 EFA Coins + 50 bônus', 500, 50, 2000, 2),
('Pro', '1000 EFA Coins + 150 bônus', 1000, 150, 3500, 3),
('Elite', '2500 EFA Coins + 500 bônus', 2500, 500, 7500, 4),
('Legend', '5000 EFA Coins + 1500 bônus', 5000, 1500, 12000, 5);