-- Migration: Tambahkan kolom balance ke tabel shops
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS balance bigint NOT NULL DEFAULT 0;
