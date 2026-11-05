# Panduan Arsitektur & Setup Next.js (TypeScript + Tailwind CSS)

Dokumen ini berisi panduan standar arsitektur fullstack **Next.js (App Router)** dengan **TypeScript** dan **Tailwind CSS**, lengkap dengan struktur direktori, pemisahan layer, serta rekomendasi library.

---

## 1. Pohon Direktori Proyek (Project Tree)

```text
my-next-project/
├── .env
├── .env.local
├── next.config.mjs
├── package.json
├── tsconfig.json
├── tailwind.config.ts        # Konfigurasi Tailwind CSS
├── postcss.config.mjs        # Konfigurasi PostCSS
├── public/                 # Aset statis (gambar, font, favicon)
│   └── images/
│
└── src/
    ├── actions/            # Backend Internal (Server Actions)
    │   ├── auth.ts         # Mutasi data form, cookies, & redirect
    │   └── user.ts         # Mutasi data user dari UI
    │
    ├── app/                # Next.js App Router & Global Styling
    │   ├── (auth)/         # Route Group: Halaman Auth (login, register)
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   │
    │   ├── (dashboard)/    # Route Group: Halaman Privat / Admin
    │   │   ├── dashboard/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx  # Layout persisten (Sidebar + Navbar Tailwind)
    │   │
    │   ├── api/            # REST API / Webhooks (Eksternal Client)
    │   │   └── v1/
    │   │       ├── webhooks/
    │   │       │   └── route.ts
    │   │       └── users/
    │   │           └── route.ts
    │   │
    │   ├── globals.css     # Directives Tailwind CSS (@tailwind base, etc.)
    │   ├── layout.tsx      # Root Layout (<html>, <body>, Providers)
    │   └── page.tsx        # Landing Page Utama
    │
    ├── components/         # Frontend UI Components (Tailwind Styled)
    │   ├── layouts/        # Layout besar (Navbar, Sidebar, Footer)
    │   ├── modules/        # Komponen fitur spesifik (UserTable, StatCard)
    │   └── ui/             # Komponen atomic/primitif (Button, Input, Modal via Shadcn/Tailwind)
    │
    ├── lib/                # Konfigurasi Library & Koneksi
    │   ├── db.ts           # Instance ORM Database (Prisma / Drizzle)
    │   └── utils.ts        # Helper `cn()` untuk penggabungan class Tailwind (clsx + tailwind-merge)
    │
    ├── services/           # Business Logic Layer (Logika bisnis & Query DB)
    │   ├── auth.service.ts
    │   └── user.service.ts
    │
    └── types/              # Type Definition / Interface global TypeScript
        └── user.type.ts
```

### Diagram Struktur Direktori

```mermaid
flowchart LR
    ROOT["my-next-project/"] --> PUBLIC["public/<br/>aset statis"]
    ROOT --> CFG["Config<br/>next.config.mjs, tailwind.config.ts,<br/>postcss.config.mjs, tsconfig.json"]
    ROOT --> SRC["src/"]

    SRC --> ACTIONS["actions/<br/>Server Actions"]
    SRC --> APP["app/<br/>App Router"]
    SRC --> COMP["components/<br/>UI"]
    SRC --> LIB["lib/<br/>db.ts, utils.ts"]
    SRC --> SERV["services/<br/>Business Logic"]
    SRC --> TYPES["types/<br/>TypeScript types"]

    APP --> AUTH["(auth)/<br/>login"]
    APP --> DASH["(dashboard)/<br/>dashboard"]
    APP --> API["api/v1/<br/>webhooks, users"]

    COMP --> C1["layouts/"]
    COMP --> C2["modules/"]
    COMP --> C3["ui/"]
```

---

## 2. Implementasi & Integrasi Tailwind CSS

### A. Pengaturan File Utilitas (`src/lib/utils.ts`)
Gunakan kombinasi `clsx` dan `tailwind-merge` untuk menangani *conditional class styling* dengan Tailwind tanpa *conflict*:

```typescript
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### B. Pengaturan Global CSS (`src/app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-50 text-slate-900 antialiased;
  }
}
```

---

## 3. Daftar Library & Dependensi yang Dibutuhkan

| Kategori | Library / Tool | Kegunaan |
| :--- | :--- | :--- |
| **Styling Core** | `tailwindcss`, `postcss`, `autoprefixer` | Framework CSS berbasis utility-first. |
| **Tailwind Utilities** | `clsx`, `tailwind-merge`, `tailwind-variants` | Menggabungkan class Tailwind secara dinamis & mengelola varian komponen. |
| **UI Components** | `shadcn/ui`, `lucide-react` | Komponen primitif accessible bertema Tailwind + Set Icon modern. |
| **ORM & Database** | `@prisma/client`, `prisma` | Pemetaan data database bertipe TypeScript (atau Drizzle ORM). |
| **Form & Validasi** | `zod`, `react-hook-form`, `@hookform/resolvers` | Validasi skema di Server Actions & pengolahan form di UI. |
| **Auth & Security** | `next-auth`, `bcryptjs` | Manajemen sesi/cookies & enkripsi password. |

### Diagram Kategori Library

```mermaid
mindmap
  root((Next.js Project))
    Styling
      tailwindcss
      postcss
      autoprefixer
      clsx
      tailwind-merge
      tailwind-variants
    UI
      shadcn/ui
      lucide-react
    Data
      Prisma
      "@prisma/client"
    Form & Validasi
      zod
      react-hook-form
      "@hookform/resolvers"
    Auth & Security
      next-auth
      bcryptjs
```

---

## 4. Perintah Instalasi Terminal (All-in-One)

Jalankan perintah berikut di terminal untuk memasang semua library yang dibutuhkan sekaligus:

```bash
# 1. Install dependensi utama (Styling, UI, Validasi, Auth, ORM)
npm install lucide-react clsx tailwind-merge zod react-hook-form @hookform/resolvers bcryptjs next-auth@beta @prisma/client

# 2. Install devDependencies
npm install -D prisma @types/bcryptjs tailwindcss postcss autoprefixer

# 3. Inisialisasi konfigurasi Prisma & Shadcn UI
npx prisma init
npx shadcn@latest init
```

### Diagram Alur Setup

```mermaid
flowchart TD
    A([Mulai]) --> B["npm install<br/>dependensi utama"]
    B --> C["npm install -D<br/>devDependencies"]
    C --> D["npx prisma init"]
    D --> E["npx shadcn@latest init"]
    E --> F["Isi .env<br/>DATABASE_URL, AUTH_SECRET"]
    F --> G["Definisikan schema.prisma"]
    G --> H["npx prisma migrate dev"]
    H --> I["npm run dev"]
    I --> J([Proyek siap dikembangkan])
```

---

## 5. Ringkasan Alur Kerja Layer (FE & BE)

$$\text{UI (Tailwind Component)} \longrightarrow \text{Server Action (`actions/`)} \longrightarrow \text{Business Logic (`services/`)} \longrightarrow \text{Database (`lib/db.ts`)}$$

1. **Frontend (View)**: Tampilan UI dibentuk menggunakan class Tailwind di dalam `src/components/` atau `src/app/`.
2. **Server Actions (`src/actions/`)**: Memproses data form kiriman pengguna di server, menangani `revalidatePath()`, dan `redirect()`.
3. **Services (`src/services/`)**: Menjalankan enkripsi data, kalkulasi, serta eksekusi query ke database via `lib/db.ts`.

### A. Diagram Arsitektur Layer

```mermaid
flowchart LR
    subgraph FE["Frontend"]
        UI["UI Component<br/>(Tailwind)<br/>components/, app/"]
    end

    subgraph BE["Backend Internal"]
        ACT["Server Action<br/>actions/"]
        SVC["Business Logic<br/>services/"]
        DB["lib/db.ts<br/>Prisma / Drizzle"]
    end

    subgraph EXT["Eksternal"]
        CLIENT["Client Eksternal /<br/>Webhook"]
        API["REST API<br/>app/api/v1/"]
    end

    PG[("PostgreSQL")]

    UI -->|submit form| ACT
    ACT -->|panggil| SVC
    SVC -->|query| DB
    DB --> PG

    CLIENT -->|HTTP| API
    API --> SVC
```

### B. Diagram Sequence: Proses Login

```mermaid
sequenceDiagram
    actor U as User
    participant UI as Login Page (UI)
    participant ACT as actions/auth.ts
    participant SVC as services/auth.service.ts
    participant DB as lib/db.ts (Prisma)

    U->>UI: Isi username & password
    UI->>ACT: Submit form (Server Action)
    ACT->>ACT: Validasi input (Zod)
    ACT->>SVC: login(username, password)
    SVC->>DB: Cari user berdasarkan username
    DB-->>SVC: Data user
    SVC->>SVC: Bandingkan password (bcryptjs)
    alt Kredensial valid
        SVC-->>ACT: User valid
        ACT->>ACT: Set session / cookies
        ACT-->>UI: redirect("/dashboard")
    else Kredensial salah
        SVC-->>ACT: Error
        ACT-->>UI: Pesan error
    end
```

### C. Diagram Routing (App Router)

```mermaid
flowchart TD
    ROOT["app/layout.tsx<br/>Root Layout"] --> HOME["/ <br/>page.tsx"]
    ROOT --> AUTHG["(auth)/layout.tsx"]
    ROOT --> DASHG["(dashboard)/layout.tsx<br/>Sidebar + Navbar"]
    ROOT --> APIR["api/v1/"]

    AUTHG --> LOGIN["/login"]
    DASHG --> DASHBOARD["/dashboard"]
    APIR --> WH["/api/v1/webhooks"]
    APIR --> USR["/api/v1/users"]
```

---

## 6. Diagram Database (ERD)

Berikut Entity Relationship Diagram yang dihasilkan dari file `drawSQL-pgsql-export-2026-11-05.sql`. Skema ini mengarah ke aplikasi toko/kasir (produk, pembeli, kasbon, transaksi).

```mermaid
erDiagram
    users ||--o{ products : "memiliki"
    users ||--o{ categories : "membuat"
    users ||--o{ shops : "mengelola"
    categories ||--o{ products : "mengelompokkan"
    products ||--o{ product_buyer : "dibeli"
    buyers ||--o{ product_buyer : "membeli"
    buyers ||--o{ transactions : "melakukan"
    product_buyer ||--o{ history_product_buyer : "riwayat bayar"

    users {
        uuid id PK
        text username
        text password
        text email
        boolean membership
        timestamp created_at
    }

    categories {
        uuid id PK
        text category
        uuid user_id FK
        timestamp created_at
    }

    products {
        uuid id PK
        text name
        float price
        int stock
        varchar status "habis, aman, menipis"
        text image_path
        uuid category_id FK
        uuid user_id FK
        timestamp created_at
    }

    shops {
        uuid id PK
        text name
        text address
        timestamp open
        time close
        uuid user_id FK
        timestamp created_at
    }

    buyers {
        uuid id PK
        text name
        bigint total_price
        bigint paid
        varchar status "kasbon, lunas"
    }

    product_buyer {
        uuid id PK
        bigint total
        float price
        uuid product_id FK
        uuid buyer_id FK
        timestamp created_at
    }

    history_product_buyer {
        uuid id PK
        float paid
        uuid product_buyer_id FK
    }

    transactions {
        uuid id PK
        text transaction_id
        varchar type "cash, qris, kasbon"
        uuid buyer_id FK
    }
```

### Diagram Alur Bisnis (Penjualan & Kasbon)

```mermaid
flowchart TD
    A([Pembeli memilih produk]) --> B["Catat di product_buyer<br/>(jumlah + harga)"]
    B --> C["Kurangi stock produk"]
    C --> D{"Stock sekarang?"}
    D -->|0| E["status = habis"]
    D -->|Rendah| F["status = menipis"]
    D -->|Cukup| G["status = aman"]
    B --> H{"Metode bayar?"}
    H -->|cash / qris| I["transactions<br/>buyers.status = lunas"]
    H -->|kasbon| J["buyers.status = kasbon"]
    J --> K["Pembayaran cicilan<br/>history_product_buyer"]
    K --> L{"paid >= total_price?"}
    L -->|Ya| M["buyers.status = lunas"]
    L -->|Belum| K
```
