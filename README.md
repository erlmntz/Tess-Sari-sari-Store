# Tess Sari-Sari Store - POS, Inventory & Credit System

A complete sari-sari store system with **customer storefront** and **admin panel**. Built with a 7-Eleven inspired theme.

## Features

### Customer Store (index.html)
- Browse all products with images and categories
- Search and filter products
- Add to cart, checkout for pickup
- Google Maps location
- Tagalog / Pinoy style design

### Admin Panel (admin/)
- **Dashboard** - Overview of products, low stock alerts, total utang, and today's sales
- **Inventory Management** - Add, edit, delete, restock products with image URL support
- **Credit / Utang System** - Track neighbor credits, record partial payments, mark as fully paid
- **Point of Sale** - Quick sales with cash or credit (utang) payment options
- **Pickup Orders** - Manage customer pickup orders from the storefront
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5
- Supabase (PostgreSQL database)
- Vercel (deployment)

## File Structure

```
Tess-Sari-sari-Store/
├── index.html              # Customer storefront (main page)
├── admin/
│   ├── index.html          # Admin dashboard
│   ├── inventory.html      # Inventory management (with product images)
│   ├── credits.html        # Credit/utang tracking
│   ├── sales.html          # Point of sale
│   └── orders.html         # Pickup orders management
├── css/
│   ├── style.css           # Admin 7-Eleven themed styles
│   └── store.css           # Customer storefront styles
├── js/
│   ├── supabase-config.js  # Supabase credentials
│   ├── app.js              # Shared admin utilities
│   ├── dashboard.js        # Dashboard logic
│   ├── inventory.js        # Inventory CRUD + image support
│   ├── credits.js          # Credits/utang management
│   ├── sales.js            # POS/sales logic
│   ├── orders.js           # Pickup orders logic
│   └── store.js            # Customer storefront logic
├── supabase-schema.sql     # Database schema
└── README.md
```

## Setup Instructions

### 1. Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to **SQL Editor** and run the SQL from `supabase-schema.sql`
3. Go to **Settings → API** and copy your **Project URL** and **anon key**

### 2. Configure the App

Open `js/supabase-config.js` and set your credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Deploy!

### 4. Run Locally

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

## URLs

- **Customer Store**: `your-domain.vercel.app/` (root)
- **Admin Panel**: `your-domain.vercel.app/admin/`

## Product Categories

Pre-configured for typical sari-sari store items:
- Noodles, Canned Goods, Beverages, Coffee & Drinks
- Snacks, Household, Cigarettes, Condiments
- Rice & Essentials, Bread & Pastries, Frozen, General

## Sample Data

The SQL schema includes 25 sample products with images (Lucky Me, Argentina, Coca-Cola, etc.) and 5 sample customers (Aling Maria, Mang Jose, etc.) to get you started.
