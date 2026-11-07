-- Seed produk demo per user login.
-- Jalankan query ini di Supabase SQL editor setelah tabel users, categories, dan products dibuat.

INSERT INTO public.categories (id, category, user_id, created_at)
VALUES
  (gen_random_uuid(), 'Makanan', '00000000-0000-0000-0000-000000000000', now()),
  (gen_random_uuid(), 'Minuman', '00000000-0000-0000-0000-000000000000', now()),
  (gen_random_uuid(), 'Sembako', '00000000-0000-0000-0000-000000000000', now())
ON CONFLICT DO NOTHING;

-- Ganti user_id di bawah dengan user yang aktif agar produk tampil pada akun tertentu.
-- Contoh:
-- INSERT INTO public.products (name, price, stock, status, category_id, user_id, image_path, created_at)
-- SELECT 'Indomie Goreng', 2730, 3, 'menipis', c.id, 'USER_ID_AKTIF', NULL, now()
-- FROM public.categories c
-- WHERE c.user_id = 'USER_ID_AKTIF' AND c.category = 'Makanan';
