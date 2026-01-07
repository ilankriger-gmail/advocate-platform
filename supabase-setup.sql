-- =====================================================
-- EXECUTE NO SUPABASE SQL EDITOR
-- Copie tudo de uma vez (Cmd+A, Cmd+C)
-- =====================================================

-- Limpar tabelas antigas
DROP TABLE IF EXISTS public.reward_claims CASCADE;
DROP TABLE IF EXISTS public.coin_transactions CASCADE;
DROP TABLE IF EXISTS public.user_coins CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;

-- Tabela de premios
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  coins_required INTEGER NOT NULL CHECK (coins_required > 0),
  quantity_available INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de saldo de moedas
CREATE TABLE public.user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de transacoes
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'spent')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de resgates
CREATE TABLE public.reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'cancelled')),
  coins_spent INTEGER NOT NULL CHECK (coins_spent > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rewards viewable by all" ON public.rewards FOR SELECT USING (is_active = true);
CREATE POLICY "Users view own coins" ON public.user_coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own claims" ON public.reward_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create claims" ON public.reward_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para criar saldo inicial
CREATE OR REPLACE FUNCTION public.handle_new_user_coins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, balance) VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_coins ON public.users;
CREATE TRIGGER on_user_created_coins AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_coins();

-- Premios de exemplo
INSERT INTO public.rewards (name, description, coins_required, quantity_available, is_active) VALUES
  ('Camiseta Exclusiva', 'Camiseta oficial da comunidade', 500, 50, true),
  ('Adesivos Pack', 'Pack com 5 adesivos exclusivos', 100, 100, true),
  ('Caneca Personalizada', 'Caneca com logo da comunidade', 300, 30, true),
  ('Acesso VIP', 'Acesso a conteudos exclusivos por 1 mes', 200, 999, true);

-- Saldo para usuarios existentes
INSERT INTO public.user_coins (user_id, balance)
SELECT id, 0 FROM public.users WHERE id NOT IN (SELECT user_id FROM public.user_coins);
