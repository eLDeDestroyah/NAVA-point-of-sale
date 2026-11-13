-- Migration: Tambahkan tabel `cash_records` untuk mencatat uang masuk/keluar manual
-- Jalankan query ini di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.cash_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('masuk', 'keluar')),
  nominal bigint NOT NULL DEFAULT 0,
  keterangan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_records_shop_id
  ON public.cash_records(shop_id);

CREATE INDEX IF NOT EXISTS idx_cash_records_created_at
  ON public.cash_records(created_at);
