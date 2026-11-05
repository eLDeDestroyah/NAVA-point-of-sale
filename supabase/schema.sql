CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  membership boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aman' CHECK (status IN ('habis', 'aman', 'menipis')),
  image_path text,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  open timestamptz NOT NULL,
  close time NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_price bigint NOT NULL DEFAULT 0,
  paid bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'kasbon' CHECK (status IN ('kasbon', 'lunas'))
);

CREATE TABLE IF NOT EXISTS public.product_buyer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total bigint NOT NULL DEFAULT 0,
  price numeric(12,2) NOT NULL DEFAULT 0,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.history_product_buyer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paid numeric(12,2) NOT NULL DEFAULT 0,
  product_buyer_id uuid NOT NULL REFERENCES public.product_buyer(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'cash' CHECK (type IN ('cash', 'qris', 'kasbon')),
  buyer_id uuid NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id
  ON public.categories(user_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_user_id
  ON public.products(user_id);

CREATE INDEX IF NOT EXISTS idx_product_buyer_product_id
  ON public.product_buyer(product_id);

CREATE INDEX IF NOT EXISTS idx_product_buyer_buyer_id
  ON public.product_buyer(buyer_id);

CREATE INDEX IF NOT EXISTS idx_history_product_buyer_product_buyer_id
  ON public.history_product_buyer(product_buyer_id);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id
  ON public.transactions(buyer_id);
