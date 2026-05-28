# Sari-Sari Store POS - Inventory & Credit System

A simple inventory and credit (utang) management system for sari-sari stores in the Philippines. Built with a **7-Eleven inspired theme**.

## Features

- **Dashboard** - Overview of products, low stock alerts, total utang, and today's sales
- **Inventory Management** - Add, edit, delete, and restock products with category filtering
- **Credit / Utang System** - Track neighbor credits, record partial payments, mark as fully paid
- **Point of Sale** - Quick sales with cash or credit (utang) payment options
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5
- Supabase (PostgreSQL database)
- Vercel (deployment)

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run the SQL from `supabase-schema.sql`
4. Go to **Settings → API** and copy your:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **anon/public key** (e.g., `eyJhbGciOiJIUzI1NiIs...`)

### 2. Configure the App

Open `js/supabase-config.js` and replace the placeholders:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Deploy to Vercel

1. Push the `sari-sari-store` folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set the **Root Directory** to `sari-sari-store` (if it's a subfolder)
4. Deploy!

### 4. Run Locally

Just open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

## File Structure

```
sari-sari-store/
├── index.html              # Dashboard
├── inventory.html          # Inventory management
├── credits.html            # Credit/utang tracking
├── sales.html              # Point of sale
├── supabase-schema.sql     # Database schema (run in Supabase)
├── css/
│   └── style.css           # 7-Eleven themed styles
├── js/
│   ├── supabase-config.js  # Supabase credentials (edit this!)
│   ├── app.js              # Shared utilities
│   ├── dashboard.js        # Dashboard logic
│   ├── inventory.js        # Inventory CRUD
│   ├── credits.js          # Credits/utang management
│   └── sales.js            # POS/sales logic
└── README.md
```

## Product Categories

Pre-configured for typical sari-sari store items:
- Noodles, Canned Goods, Beverages, Coffee & Drinks
- Snacks, Household, Cigarettes, Condiments
- Rice & Essentials, Bread & Pastries, Frozen, General

## Sample Data

The SQL schema includes sample products (Lucky Me, Argentina, Coca-Cola, etc.) and sample customers (Aling Maria, Mang Jose, etc.) to get you started.
