export type CashRecord = {
  id: string;
  date: string;
  description: string;
  category: string;
  method: "Tunai" | "QRIS" | "Transfer";
  nominal: number;
  status: "Masuk" | "Keluar";
};

export type BuyerDebt = {
  id: string;
  name: string;
  total_price: number;
  paid: number;
  remaining: number;
  status: "kasbon" | "lunas";
  progressPercentage: number;
};

export type FinanceSummary = {
  currentBalance: number;
  lastUpdated: string;
  totalIncome: number;
  totalExpense: number;
  totalQris: number;
  totalPiutangAktif: number;
  cashFlows: CashRecord[];
  debtors: BuyerDebt[];
};

export type AddMoneyInput = {
  type: "masuk" | "keluar";
  nominal: number;
  keterangan: string;
};

export type PayInstallmentInput = {
  buyerId: string;
  nominal: number;
};
