export type TransactionType = "cash" | "qris" | "kasbon";
export type BuyerStatus = "kasbon" | "lunas";

export type BuyerRecord = {
  id: string;
  name: string;
  total_price: number;
  paid: number;
  status: BuyerStatus;
};

export type ProductBuyerRecord = {
  id: string;
  total: number;
  price: number;
  product_id: string;
  buyer_id: string;
  created_at?: string;
  product_name?: string;
};

export type HistoryProductBuyerRecord = {
  id: string;
  paid: number;
  product_buyer_id: string;
  created_at?: string;
};

export type TransactionRecord = {
  id: string;
  transaction_id: string;
  type: TransactionType;
  paid: number;
  buyer_id: string;
  created_at?: string;
};

export type CashierProductItem = {
  id: string;
  name: string;
  short: string;
  category: string;
  price: number;
  stock: number;
  accent: string;
  image_path?: string | null;
  status: "aman" | "habis" | "menipis";
};

export type CheckoutCartItem = {
  productId: string;
  qty: number;
};

export type CheckoutInput = {
  customerName?: string;
  paymentMethod: TransactionType;
  paidAmount?: number;
  items: CheckoutCartItem[];
};

export type CheckoutResult = {
  transaction: TransactionRecord;
  buyer: BuyerRecord;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    total: number;
    price: number;
    subtotal: number;
  }>;
  total_price: number;
  paid: number;
  change: number;
};
