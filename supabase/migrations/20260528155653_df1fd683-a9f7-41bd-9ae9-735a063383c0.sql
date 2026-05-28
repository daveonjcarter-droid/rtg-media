
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  price_id text NOT NULL,
  product_id text,
  amount_total integer,
  currency text,
  status text NOT NULL DEFAULT 'pending',
  environment text NOT NULL DEFAULT 'sandbox',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX idx_payment_orders_session_id ON public.payment_orders(stripe_session_id);

GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders"
  ON public.payment_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages orders"
  ON public.payment_orders FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
