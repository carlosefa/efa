-- =====================================================
-- EFA Hardening Migration (Coins + RBAC scope fix)
-- - Fixes user_roles unique that breaks scoped roles
-- - Converts wallet + transaction amounts to INTEGER coins
-- - Makes coin core functions compatible with existing transactions schema
-- =====================================================

BEGIN;

-- =====================================================
-- 0) RBAC: remove constraint that breaks scoped roles
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_user_role_unique'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_role_unique;
  END IF;
END $$;

-- =====================================================
-- 1) Convert wallet fields to integer coins
--    (balance/lifetime_* were DECIMAL(12,2) from older migration)
-- =====================================================

-- Drop old check constraint if it exists (name is usually wallets_balance_check)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallets_balance_check'
      AND conrelid = 'public.wallets'::regclass
  ) THEN
    ALTER TABLE public.wallets DROP CONSTRAINT wallets_balance_check;
  END IF;
END $$;

-- Convert to BIGINT (safe) using ROUND to avoid decimals
ALTER TABLE public.wallets
  ALTER COLUMN balance TYPE BIGINT USING ROUND(balance)::BIGINT,
  ALTER COLUMN lifetime_earned TYPE BIGINT USING ROUND(lifetime_earned)::BIGINT,
  ALTER COLUMN lifetime_spent TYPE BIGINT USING ROUND(lifetime_spent)::BIGINT;

-- Re-add non-negative check
ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_balance_check CHECK (balance >= 0);

-- =====================================================
-- 2) Convert transactions amounts to integer coins
-- =====================================================

-- Convert amount + balance_after if they are DECIMAL
ALTER TABLE public.transactions
  ALTER COLUMN amount TYPE BIGINT USING ROUND(amount)::BIGINT,
  ALTER COLUMN balance_after TYPE BIGINT USING ROUND(balance_after)::BIGINT;

-- Ensure columns added by coin-core migration exist
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.coin_batches(id),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- 3) Replace coin functions to match existing schema:
--    - transactions requires: type, category, amount, balance_after, description
--    - keep type in ('credit','debit') only
--    - use category = 'admin_adjustment' | 'purchase' | 'expired'
-- =====================================================

-- Helper: map reference_type into category (optional)
CREATE OR REPLACE FUNCTION public._efa_tx_category(p_reference_type TEXT, p_is_credit BOOLEAN)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_is_credit THEN
    RETURN 'admin_adjustment'; -- grants/refunds/etc could evolve later
  END IF;

  IF p_reference_type IS NULL THEN
    RETURN 'purchase';
  END IF;

  -- You can extend these mappings later
  IF p_reference_type IN ('tournament_registration','subscription','shop_purchase') THEN
    RETURN 'purchase';
  ELSIF p_reference_type IN ('refund') THEN
    RETURN 'refund';
  ELSE
    RETURN 'purchase';
  END IF;
END;
$$;

-- 3.1) grant_coins
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
  v_expires_at TIMESTAMPTZ;
  v_new_balance BIGINT;
  v_amt BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be > 0';
  END IF;

  v_amt := p_amount::BIGINT;

  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'User wallet not found';
  END IF;

  v_expires_at := now() + (p_expires_in_days || ' days')::INTERVAL;

  -- Lock wallet row to avoid race conditions
  PERFORM 1 FROM public.wallets WHERE id = v_wallet_id FOR UPDATE;

  -- Create batch
  INSERT INTO public.coin_batches (wallet_id, original_amount, remaining_amount, source_type, expires_at)
  VALUES (v_wallet_id, p_amount, p_amount, 'manual', v_expires_at)
  RETURNING id INTO v_batch_id;

  -- Grant log
  INSERT INTO public.coin_grants (wallet_id, amount, reason, granted_by, batch_id, expires_in_days)
  VALUES (v_wallet_id, p_amount, p_reason, p_granted_by, v_batch_id, p_expires_in_days)
  RETURNING id INTO v_grant_id;

  -- Update wallet and compute new balance
  UPDATE public.wallets
  SET balance = balance + v_amt,
      lifetime_earned = lifetime_earned + v_amt,
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_new_balance;

  -- Insert transaction (full required fields)
  INSERT INTO public.transactions (
    wallet_id, type, category, amount, balance_after, description,
    reference_type, reference_id, created_by, batch_id, metadata
  )
  VALUES (
    v_wallet_id,
    'credit',
    'admin_adjustment',
    v_amt,
    v_new_balance,
    'Concessão: ' || p_reason,
    'coin_grant',
    v_grant_id,
    p_granted_by,
    v_batch_id,
    jsonb_build_object('grant_id', v_grant_id, 'granted_by', p_granted_by, 'expires_at', v_expires_at)
  );

  RETURN v_grant_id;
END;
$$;

-- 3.2) consume_coins (FIFO batches)
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
  v_wallet_balance BIGINT;
  v_remaining BIGINT;
  v_batch RECORD;
  v_consume BIGINT;
  v_new_balance BIGINT;
  v_amt BIGINT;
  v_category TEXT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be > 0';
  END IF;

  v_amt := p_amount::BIGINT;

  SELECT id, balance INTO v_wallet_id, v_wallet_balance
  FROM public.wallets
  WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'User wallet not found';
  END IF;

  -- lock wallet row
  PERFORM 1 FROM public.wallets WHERE id = v_wallet_id FOR UPDATE;

  IF v_wallet_balance < v_amt THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_remaining := v_amt;

  FOR v_batch IN
    SELECT id, remaining_amount
    FROM public.coin_batches
    WHERE wallet_id = v_wallet_id
      AND remaining_amount > 0
      AND expires_at > now()
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_consume := LEAST(v_remaining, v_batch.remaining_amount::BIGINT);

    UPDATE public.coin_batches
    SET remaining_amount = remaining_amount - v_consume::INTEGER,
        consumed_at = CASE WHEN remaining_amount - v_consume::INTEGER = 0 THEN now() ELSE consumed_at END
    WHERE id = v_batch.id;

    v_remaining := v_remaining - v_consume;
  END LOOP;

  IF v_remaining > 0 THEN
    -- Not enough non-expired batches (even though wallet balance says enough)
    RAISE EXCEPTION 'Insufficient non-expired coin batches';
  END IF;

  v_category := public._efa_tx_category(p_reference_type, false);

  UPDATE public.wallets
  SET balance = balance - v_amt,
      lifetime_spent = lifetime_spent + v_amt,
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.transactions (
    wallet_id, type, category, amount, balance_after, description,
    reference_type, reference_id, metadata
  )
  VALUES (
    v_wallet_id,
    'debit',
    v_category,
    v_amt,
    v_new_balance,
    p_description,
    p_reference_type,
    p_reference_id,
    jsonb_build_object('reference_type', p_reference_type, 'reference_id', p_reference_id)
  );

  RETURN TRUE;
END;
$$;

-- 3.3) expire_coin_batches (uses type=debit, category=expired)
CREATE OR REPLACE FUNCTION public.expire_coin_batches()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch RECORD;
  v_total_expired BIGINT := 0;
  v_new_balance BIGINT;
BEGIN
  FOR v_batch IN
    SELECT cb.id, cb.wallet_id, cb.remaining_amount
    FROM public.coin_batches cb
    WHERE cb.remaining_amount > 0
      AND cb.expires_at <= now()
  LOOP
    -- lock wallet
    PERFORM 1 FROM public.wallets WHERE id = v_batch.wallet_id FOR UPDATE;

    UPDATE public.wallets
    SET balance = balance - v_batch.remaining_amount::BIGINT,
        updated_at = now()
    WHERE id = v_batch.wallet_id
    RETURNING balance INTO v_new_balance;

    INSERT INTO public.transactions (
      wallet_id, type, category, amount, balance_after, description,
      batch_id, metadata
    )
    VALUES (
      v_batch.wallet_id,
      'debit',
      'expired',
      v_batch.remaining_amount::BIGINT,
      v_new_balance,
      'Coins expirados',
      v_batch.id,
      jsonb_build_object('expired_at', now())
    );

    UPDATE public.coin_batches
    SET remaining_amount = 0, consumed_at = now()
    WHERE id = v_batch.id;

    v_total_expired := v_total_expired + v_batch.remaining_amount::BIGINT;
  END LOOP;

  RETURN v_total_expired::INTEGER;
END;
$$;

COMMIT;
