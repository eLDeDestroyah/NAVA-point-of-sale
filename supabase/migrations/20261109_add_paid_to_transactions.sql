-- Migration: Tambahkan kolom `paid` pada tabel `transactions`
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS paid bigint NOT NULL DEFAULT 0;

-- Optional update: Isi kolom paid untuk transaksi yang sudah ada dari tabel buyers
UPDATE public.transactions t
SET paid = b.paid
FROM public.buyers b
WHERE t.buyer_id = b.id AND t.paid = 0;
