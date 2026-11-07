import { cookies } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabase";

export type ProductStatus = "aman" | "habis" | "menipis";

export type ProductRecord = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image_path: string | null;
  category_id: string;
  user_id: string;
  created_at: string;
  category?: string;
};

export type ProductInput = {
  name: string;
  price: number;
  stock: number;
  category: string;
  status?: ProductStatus;
};

const DEMO_PRODUCTS: Array<{
  name: string;
  price: number;
  stock: number;
  category: string;
  status: ProductStatus;
  image_path: string | null;
}> = [
  { name: "Indomie Goreng", price: 2730, stock: 3, category: "Makanan", status: "menipis", image_path: null },
  { name: "Aqua 600ml", price: 3120, stock: 18, category: "Minuman", status: "aman", image_path: null },
  { name: "Kopi Kapal Api", price: 1950, stock: 4, category: "Minuman", status: "menipis", image_path: null },
  { name: "Gula Pasir 1kg", price: 14430, stock: 0, category: "Sembako", status: "habis", image_path: null },
  { name: "Teh Pucuk 350ml", price: 3900, stock: 12, category: "Minuman", status: "aman", image_path: null },
  { name: "Roma Kelapa", price: 7410, stock: 9, category: "Makanan", status: "aman", image_path: null },
];

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("nava_session")?.value ?? null;
}

async function ensureCategoryExists(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  categoryName: string,
): Promise<string> {
  const normalizedName = categoryName.trim();

  const { data: existingCategory, error: lookupError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("category", normalizedName)
    .limit(1)
    .single();

  if (!lookupError && existingCategory?.id) {
    return existingCategory.id;
  }

  const { data: insertedCategory, error: insertError } = await supabase
    .from("categories")
    .insert({ category: normalizedName, user_id: userId })
    .select("id")
    .single();

  if (insertError || !insertedCategory?.id) {
    throw new Error(`Gagal membuat kategori ${normalizedName}.`);
  }

  return insertedCategory.id;
}

export async function seedDemoProductsForUser(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data: existingProducts, error: existingProductsError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existingProductsError) {
    throw new Error("Gagal memeriksa data produk pengguna.");
  }

  if ((existingProducts ?? []).length > 0) {
    return existingProducts;
  }

  const categoryIds = new Map<string, string>();

  for (const product of DEMO_PRODUCTS) {
    const categoryName = product.category.trim();

    if (!categoryIds.has(categoryName.toLowerCase())) {
      const categoryId = await ensureCategoryExists(supabase, userId, categoryName);
      categoryIds.set(categoryName.toLowerCase(), categoryId);
    }
  }

  const records = DEMO_PRODUCTS.map((product) => ({
    name: product.name,
    price: product.price,
    stock: product.stock,
    status: product.status,
    image_path: product.image_path,
    user_id: userId,
    category_id: categoryIds.get(product.category.trim().toLowerCase()) ?? "",
  }));

  const { data, error } = await supabase.from("products").insert(records).select("id");

  if (error) {
    throw new Error(error.message || "Seeder produk gagal dibuat.");
  }

  return data ?? [];
}

function resolveProductStatus(stock: number): ProductStatus {
  if (stock <= 0) return "habis";
  if (stock < 5) return "menipis";
  return "aman";
}

export async function createProductForCurrentUser(input: ProductInput): Promise<ProductRecord> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  const supabase = await getSupabaseServerClient();
  const safeName = input.name.trim();
  const safeCategory = input.category.trim();
  const safePrice = Number(input.price) || 0;
  const safeStock = Math.max(0, Number(input.stock) || 0);

  if (!safeName) {
    throw new Error("Nama produk wajib diisi.");
  }

  if (!safeCategory) {
    throw new Error("Kategori produk wajib diisi.");
  }

  const categoryId = await ensureCategoryExists(supabase, userId, safeCategory);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: safeName,
      price: safePrice,
      stock: safeStock,
      status: input.status ?? resolveProductStatus(safeStock),
      category_id: categoryId,
      user_id: userId,
      image_path: null,
    })
    .select("id, name, price, stock, status, image_path, category_id, user_id, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Produk gagal ditambahkan.");
  }

  return {
    ...data,
    category: safeCategory,
  };
}

export async function updateProductForCurrentUser(
  productId: string,
  input: Partial<ProductInput>,
): Promise<ProductRecord> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  const supabase = await getSupabaseServerClient();

  const { data: existingProduct, error: existingError } = await supabase
    .from("products")
    .select("id, category_id, stock")
    .eq("id", productId)
    .eq("user_id", userId)
    .single();

  if (existingError || !existingProduct) {
    throw new Error("Produk tidak ditemukan untuk akun ini.");
  }

  const nextName = input.name?.trim() || "";
  const nextCategory = input.category?.trim() || "";
  const nextPrice = Number(input.price ?? 0);
  const nextStock = Math.max(0, Number(input.stock ?? existingProduct.stock) || 0);

  if (!nextName) {
    throw new Error("Nama produk wajib diisi.");
  }

  if (!nextCategory) {
    throw new Error("Kategori produk wajib diisi.");
  }

  const categoryId = await ensureCategoryExists(supabase, userId, nextCategory);

  const { data, error } = await supabase
    .from("products")
    .update({
      name: nextName,
      price: nextPrice,
      stock: nextStock,
      status: input.status ?? resolveProductStatus(nextStock),
      category_id: categoryId,
    })
    .eq("id", productId)
    .eq("user_id", userId)
    .select("id, name, price, stock, status, image_path, category_id, user_id, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Produk gagal diperbarui.");
  }

  return {
    ...data,
    category: nextCategory,
  };
}

export async function deleteProductForCurrentUser(productId: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Produk gagal dihapus.");
  }
}

export async function getCategoriesForCurrentUser(): Promise<Array<{ id: string; category: string }>> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, category")
    .eq("user_id", userId)
    .order("category", { ascending: true });

  if (error) {
    throw new Error(error.message || "Gagal memuat kategori pengguna.");
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    category: item.category,
  }));
}

export async function getProductsForCurrentUser(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
}): Promise<{
  data: ProductRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
  }

  const page = Math.max(1, Number(options?.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(options?.pageSize ?? 10)));
  const search = (options?.search ?? "").trim();
  const category = (options?.category ?? "").trim();
  const status = (options?.status ?? "").trim();

  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("products")
    .select("id, name, price, stock, status, image_path, category_id, user_id, created_at", {
      count: "exact",
    })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (category) {
    const { data: matchingCategories, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("category", category);

    if (categoryError) {
      throw new Error(categoryError.message || "Gagal memfilter kategori produk.");
    }

    const categoryIds = (matchingCategories ?? []).map((item) => item.id);

    if (categoryIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    query = query.in("category_id", categoryIds);
  }

  const { data: products, error, count } = await query;

  if (error) {
    throw new Error(error.message || "Gagal memuat produk pengguna.");
  }

  const total = count ?? (products?.length ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages || 1);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize - 1;

  const filteredProducts = products ?? [];
  const pagedProducts = filteredProducts.slice(start, end + 1);

  if (pagedProducts.length === 0 && total > 0 && safePage > totalPages) {
    return {
      data: [],
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  const categoryIds = [...new Set((pagedProducts ?? []).map((product) => product.category_id))];
  const categoryMap = new Map<string, string>();

  if (categoryIds.length > 0) {
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, category")
      .in("id", categoryIds);

    if (!categoriesError) {
      for (const categoryItem of categories ?? []) {
        categoryMap.set(categoryItem.id, categoryItem.category);
      }
    }
  }

  return {
    data: (pagedProducts ?? []).map((product) => ({
      ...product,
      category: categoryMap.get(product.category_id) ?? "Umum",
    })),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}
