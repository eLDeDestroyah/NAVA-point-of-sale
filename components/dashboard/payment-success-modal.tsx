"use client";

import { useState } from "react";
import { Check, FileText, Printer, X, ArrowRight } from "lucide-react";
import { jsPDF } from "jspdf";

export type ReceiptItem = {
  id?: string;
  name: string;
  qty: number;
  price: number;
};

export type TransactionReceiptData = {
  transactionId: string;
  items: ReceiptItem[];
  subtotal: number;
  paymentMethod: "tunai" | "kasbon";
  customerName?: string;
  nominal?: number;
  change?: number;
  date: Date;
};

type PaymentSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: TransactionReceiptData | null;
  storeName?: string;
  storeAddress?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Icon WhatsApp SVG resmi
function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  data,
  storeName = "NAVA MART",
  storeAddress = "Jl. Melati No. 12, Bandung",
}: PaymentSuccessModalProps) {
  const [showWaInput, setShowWaInput] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWaSent, setIsWaSent] = useState(false);

  if (!isOpen || !data) {
    return null;
  }

  // Download PDF Otomatis menggunakan jsPDF
  const handleDownloadPDF = () => {
    try {
      setIsDownloading(true);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, Math.max(140, 110 + data.items.length * 8)],
      });

      doc.setFont("courier", "bold");
      doc.setFontSize(13);
      doc.text(storeName, 40, 12, { align: "center" });

      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.text(storeAddress, 40, 17, { align: "center" });
      doc.text(`Transaksi: ${data.transactionId}`, 40, 22, { align: "center" });
      doc.text(
        new Date(data.date).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        40,
        26,
        { align: "center" }
      );

      doc.text("----------------------------------------", 40, 31, {
        align: "center",
      });

      let y = 37;
      doc.setFontSize(8);
      data.items.forEach((item) => {
        const itemLine = `${item.name} x ${item.qty}`;
        const itemPrice = formatCurrency(item.price * item.qty);
        doc.text(itemLine, 6, y);
        doc.text(itemPrice, 74, y, { align: "right" });
        y += 6;
      });

      doc.text("----------------------------------------", 40, y, {
        align: "center",
      });
      y += 6;

      doc.setFont("courier", "bold");
      doc.setFontSize(9);
      doc.text("TOTAL", 6, y);
      doc.text(formatCurrency(data.subtotal), 74, y, { align: "right" });

      y += 6;
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.text(
        `Metode: ${data.paymentMethod === "tunai" ? "Tunai" : "Kasbon"}`,
        6,
        y
      );

      y += 10;
      doc.text("Terima kasih sudah berbelanja", 40, y, { align: "center" });

      const safeId = data.transactionId.replace(/[^a-zA-Z0-9_-]/g, "");
      doc.save(`Struk-${safeId || "TRX"}.pdf`);
    } catch (error) {
      console.error("Gagal men-download PDF:", error);
      alert("Gagal mengunduh PDF, silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Cetak Struk via browser print dialog
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = data.items
      .map(
        (item) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <span>${item.name} × ${item.qty}</span>
          <span style="font-weight: 600;">${formatCurrency(item.price * item.qty)}</span>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Pembayaran - ${data.transactionId}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #111;
              width: 270px;
              margin: 0 auto;
              padding: 16px 8px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .title { font-size: 15px; margin-bottom: 2px; }
            .subtitle { font-size: 10px; color: #555; }
            .divider { border-top: 1px dashed #777; margin: 8px 0; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 4px; }
            .footer { margin-top: 14px; font-size: 10px; text-align: center; color: #666; }
            @media print {
              body { width: 100%; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="center bold title">${storeName}</div>
          <div class="center subtitle">${storeAddress}</div>
          <div class="center subtitle" style="margin-top: 2px;">${data.transactionId} • ${new Date(data.date).toLocaleDateString("id-ID")}</div>
          <div class="divider"></div>
          <div>${itemsHtml}</div>
          <div class="divider"></div>
          <div class="total-row">
            <span>TOTAL</span>
            <span>${formatCurrency(data.subtotal)}</span>
          </div>
          <div class="footer">Terima kasih sudah berbelanja</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Kirim struk ke WhatsApp
  const handleSendWhatsApp = () => {
    let cleanNumber = waNumber.replace(/[^\d+]/g, "").trim();

    if (!cleanNumber) {
      alert("Silakan masukkan nomor WhatsApp terlebih dahulu.");
      return;
    }

    // Format ke format internasional +62
    if (cleanNumber.startsWith("+")) {
      cleanNumber = cleanNumber.slice(1);
    }
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.slice(1);
    } else if (!cleanNumber.startsWith("62")) {
      cleanNumber = "62" + cleanNumber;
    }

    if (cleanNumber.length < 9) {
      alert("Nomor WhatsApp tidak valid. Pastikan nomor sudah benar.");
      return;
    }

    const itemsText = data.items
      .map(
        (item) => `• ${item.name} × ${item.qty} = ${formatCurrency(item.price * item.qty)}`
      )
      .join("\n");

    const message = `*${storeName}*
${storeAddress}
----------------------------------------
*STRUK PEMBAYARAN*
No. Transaksi: ${data.transactionId}
Tanggal: ${new Date(data.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
Metode: ${data.paymentMethod === "tunai" ? "Tunai" : "Kasbon"}

*Rincian Belanja:*
${itemsText}
----------------------------------------
*TOTAL: ${formatCurrency(data.subtotal)}*
----------------------------------------
Terima kasih sudah berbelanja di *${storeName}*!`;

    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    setIsWaSent(true);
    setTimeout(() => {
      setShowWaInput(false);
      setIsWaSent(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[480px] rounded-[36px] bg-white p-6 sm:p-8 shadow-[0_25px_70px_rgba(15,23,42,0.18)]">
        {/* Tombol Tutup (X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal"
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Badge Checkmark Hijau */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1b7a4e] text-white shadow-lg shadow-emerald-900/20">
            <Check className="h-10 w-10 stroke-[3]" />
          </div>

          <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Transaksi berhasil
          </div>
          <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.03em] text-slate-800">
            Pembayaran diterima
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Transaksi <span className="font-medium text-slate-700">{data.transactionId}</span> telah tersimpan.
          </p>
        </div>

        {/* Kartu Struk Belanja */}
        <div className="mt-6 rounded-[26px] bg-[#f5f5f3] p-4 sm:p-5">
          <div className="relative rounded-2xl bg-white p-5 shadow-sm border border-slate-100/80 font-mono">
            {/* Header Struk */}
            <div className="text-center">
              <div className="text-[15px] font-bold tracking-wider text-slate-900">
                {storeName}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                {storeAddress}
              </div>
            </div>

            {/* Daftar Item */}
            <div className="mt-4 space-y-2 text-[12px] text-slate-700">
              {data.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    {item.name} × {item.qty}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">
                    {formatCurrency(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            {/* Garis Putus-putus */}
            <div className="my-3 border-t border-dashed border-slate-300" />

            {/* Total Pembayaran */}
            <div className="flex items-center justify-between text-[13px] font-bold text-slate-800">
              <span>TOTAL</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>

            {/* Footer Struk */}
            <div className="mt-4 text-center text-[11px] text-slate-400">
              Terima kasih sudah berbelanja
            </div>

            {/* Efek Gerigi / Perforasi Struk Bawah */}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-between overflow-hidden px-1">
              {Array.from({ length: 26 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2.5 rotate-45 bg-[#f5f5f3] -mb-1"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Form Input WhatsApp jika dipilih */}
        {showWaInput ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
                <span>Kirim Struk via WhatsApp</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWaInput(false)}
                className="text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                Batal
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Masukkan nomor WhatsApp pembeli untuk langsung mengirim rincian struk.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  +62
                </span>
                <input
                  type="tel"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendWhatsApp();
                    }
                  }}
                  placeholder="812-3456-7890"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex items-center gap-1.5 rounded-xl bg-[#1b7a4e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#14633f] transition"
              >
                <span>{isWaSent ? "Terkirim!" : "Kirim"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Tiga Tombol Aksi: Cetak, PDF, Kirim WA */
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 px-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4 text-slate-700" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 px-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <FileText className="h-4 w-4 text-slate-700" />
              <span>{isDownloading ? "Mengunduh..." : "PDF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWaInput(true)}
              className="flex flex-1.2 items-center justify-center gap-2 rounded-2xl bg-[#1b7a4e] py-3 px-4 text-[14px] font-semibold text-white shadow-[0_10px_20px_rgba(27,122,78,0.22)] transition hover:bg-[#156741]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>Kirim WA</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
