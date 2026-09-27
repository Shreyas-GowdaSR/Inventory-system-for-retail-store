# KiranaStore - Provision Store Inventory Management System

A full-stack, real-time inventory and stock tracking application designed specifically for provision stores, kirana shops, and retail grocery businesses. Built with **React 19**, **Node.js + Express**, and **Supabase (PostgreSQL)**.

---

## 🌟 Key Features

* **📦 Complete Inventory Management**:
  * Create, view, edit, and delete store items.
  * Multi-unit support (`kg`, `g`, `L`, `ml`, `packet`, `box`, `piece`, `can`).
  * Automated purchase/cost price, retail selling price, and profit margin calculation.
  * Categories tailored for grocery stores (Grains & Staples, Pulses & Lentils, Oils & Ghee, Spices & Masalas, Beverages, Household & Cleaning, Snacks, Personal Care, Dairy & Bakery).

* **🔄 Stock In / Stock Out Workflow**:
  * **Stock IN (Restocking)**: Quick-entry for new batch arrivals, vendor replenishment, and recording invoice/purchase prices.
  * **Stock OUT (Sales/Consumption)**: Daily retail deductions with instant stock balance updates and negative inventory prevention guards.

* **🚨 Low-Stock & Out-of-Stock Alerts**:
  * Dynamic threshold monitoring (`min_stock_level`).
  * Instant alert badges for products requiring urgent reordering.
  * Filter inventory view by alert severity: *All Items*, *Low Stock*, or *Out of Stock*.

* **📜 Immutable Audit Log**:
  * Complete transaction history of every `IN` and `OUT` movement.
  * Records quantity change, timestamp, previous balance, updated balance, user role, and custom notes.

* **👥 Role-Based Access Control (RBAC)**:
  * **Admin**: Unrestricted access to add/delete items, update prices, modify minimum stock thresholds, view total store inventory valuation & margin analysis, and configure database connections.
  * **Staff**: Streamlined interface focused on everyday operations—recording sales (Stock OUT), restocking (Stock IN), and checking stock levels without destructive item deletions or cost price alterations.

* **🗄️ Hybrid Database Persistence (Supabase + Local Fallback)**:
  * Seamless connection to **Supabase PostgreSQL** via REST & service role / anon keys.
  * Automatic fallback to an active in-memory store pre-populated with realistic Indian provision store items if Supabase is not yet configured.

---

## 🏗️ Architecture & Tech Stack

```
├── Client (Vite + React 19)
│   ├── Component-driven UI (Lucide Icons, Semantic CSS Design System)
│   └── Real-time REST API consumption (/api/*)
└── Backend (Node.js + Express)
    ├── Express REST API (/api/items, /api/stock-transaction, /api/alerts, /api/stock-transactions)
    ├── Supabase Client (@supabase/supabase-js)
    ├── In-memory persistence fallback
    └── Vite middleware for unified single-port development (port 3000)
```

* **Frontend**: React 19, Lucide React icons, Tailwind CSS / Custom CSS design tokens.
* **Backend**: Node.js, Express 4.x.
* **Database**: PostgreSQL on Supabase (with fallback in-memory cache).
* **Build Tooling**: Vite 8, tsx / esbuild.

---

## 📁 Project Structure

```
.
├── index.html              # HTML entry point with metadata and fonts
├── metadata.json           # Application manifest
├── package.json            # Project dependencies and run scripts
├── server.js               # Express API backend + Vite development integration
├── src/
│   ├── App.jsx             # Main dashboard UI, modals, filters, and state management
│   ├── index.css           # Semantic store design system styling
│   └── main.jsx            # React root mount
├── .env.example            # Environment variables template
└── README.md               # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **bun** / **yarn**

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <YOUR_REPOSITORY_URL>
cd kirana-store-inventory
npm install
```

### 3. Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env` to configure your Supabase instance (optional—app works out-of-the-box with default sample items if omitted):

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-or-anon-key"
SUPABASE_SECRET_KEY="your-supabase-service-role-key"
PORT=3000
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase PostgreSQL Setup (Optional)

To persist data in your own Supabase database, run the following SQL script in the **Supabase SQL Editor**:

```sql
-- 1. Create items table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  min_stock_level NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create stock_logs table
CREATE TABLE IF NOT EXISTS stock_logs (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  previous_stock NUMERIC NOT NULL,
  new_stock NUMERIC NOT NULL,
  user_role TEXT DEFAULT 'staff',
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for public access (or restrict per your auth requirements)
CREATE POLICY "Allow all read" ON items FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON items FOR ALL USING (true);
CREATE POLICY "Allow all read logs" ON stock_logs FOR SELECT USING (true);
CREATE POLICY "Allow all write logs" ON stock_logs FOR ALL USING (true);
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Health check & Supabase connection status |
| `GET` | `/api/items` | List inventory items (supports `?search=` and `?category=`) |
| `POST` | `/api/items` | Add a new inventory item |
| `PUT` | `/api/items/:id` | Update an existing item (details, prices, min stock) |
| `DELETE` | `/api/items/:id` | Remove an item from the system |
| `POST` | `/api/stock-transaction` | Execute stock movement (`IN` or `OUT`) and record audit log |
| `GET` | `/api/stock-transactions` | Retrieve audit log history |
| `GET` | `/api/alerts` | Get list of low-stock and out-of-stock items |
| `POST` | `/api/config/supabase` | Dynamically update Supabase credentials |

---

## 📜 Available Scripts

* `npm run dev` — Starts the backend Express server with Vite middleware on port 3000.
* `npm run build` — Builds the production React client assets into `/dist`.
* `npm run preview` — Previews the built production client.
* `npm run lint` — Syntax validation check for backend and scripts.

---

## 📄 License

MIT License. Feel free to customize and use for your grocery or retail shop.
