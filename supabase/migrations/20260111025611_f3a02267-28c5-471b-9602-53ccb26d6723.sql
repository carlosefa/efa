-- Corrigir policies permissivas para coin_batches
DROP POLICY IF EXISTS "System can insert coin batches" ON public.coin_batches;
DROP POLICY IF EXISTS "System can update coin batches" ON public.coin_batches;

-- Apenas admins e funções do sistema podem inserir/atualizar lotes
CREATE POLICY "Admins can insert coin batches"
ON public.coin_batches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'global_admin', 'country_admin')
  )
);

CREATE POLICY "Admins can update coin batches"
ON public.coin_batches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'global_admin', 'country_admin')
  )
);