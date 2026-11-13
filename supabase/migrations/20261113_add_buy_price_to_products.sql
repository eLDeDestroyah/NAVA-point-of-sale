-- Migration: Tambahkan kolom buy_price (harga beli) pada tabel products
-- Jalankan di Supabase SQL Editor

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS buy_price numeric(12,2) NOT NULL DEFAULT 0;
