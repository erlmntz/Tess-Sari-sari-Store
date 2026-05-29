-- ============================================================
-- SARI-SARI STORE INVENTORY & CREDIT SYSTEM
-- Supabase Database Schema
-- ============================================================
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pc',
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  barcode TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CUSTOMERS TABLE (mga kapitbahay)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREDITS TABLE (utang ng mga kapitbahay)
CREATE TABLE IF NOT EXISTS credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'cash', -- 'cash' or 'credit'
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - allow all operations (public access for simplicity)
-- For production, add proper auth policies
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on credits" ON credits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales" ON sales FOR ALL USING (true) WITH CHECK (true);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_customer ON credits(customer_id);
CREATE INDEX IF NOT EXISTS idx_credits_is_paid ON credits(is_paid);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 8. Sample categories for sari-sari store
-- You can insert sample data below:

-- Sample Products
INSERT INTO products (name, category, price, cost, quantity, unit) VALUES
  ('Lucky Me Pancit Canton Original', 'Noodles', 12.00, 9.50, 50, 'pc'),
  ('Lucky Me Pancit Canton Chilimansi', 'Noodles', 12.00, 9.50, 40, 'pc'),
  ('Nissin Cup Noodles Seafood', 'Noodles', 28.00, 22.00, 30, 'pc'),
  ('Argentina Corned Beef 150g', 'Canned Goods', 38.00, 30.00, 25, 'pc'),
  ('555 Sardines 155g', 'Canned Goods', 22.00, 17.00, 35, 'pc'),
  ('Century Tuna Flakes 180g', 'Canned Goods', 42.00, 34.00, 20, 'pc'),
  ('Coca-Cola Mismo 295ml', 'Beverages', 15.00, 11.00, 48, 'pc'),
  ('Royal Tru-Orange 350ml', 'Beverages', 18.00, 13.00, 36, 'pc'),
  ('C2 Green Tea Apple 355ml', 'Beverages', 20.00, 15.00, 30, 'pc'),
  ('Red Horse Beer 500ml', 'Beverages', 55.00, 42.00, 24, 'pc'),
  ('San Miguel Pale Pilsen 320ml', 'Beverages', 45.00, 35.00, 24, 'pc'),
  ('Kopiko Brown Coffee 25g', 'Coffee & Drinks', 7.00, 5.00, 100, 'sachet'),
  ('Nescafe 3-in-1 Original', 'Coffee & Drinks', 8.00, 6.00, 80, 'sachet'),
  ('Bear Brand Powdered Milk 33g', 'Coffee & Drinks', 12.00, 9.00, 60, 'sachet'),
  ('Tide Powder 66g', 'Household', 10.00, 7.50, 50, 'sachet'),
  ('Joy Dishwashing Liquid 45ml', 'Household', 10.00, 7.00, 40, 'sachet'),
  ('Safeguard Soap 60g', 'Household', 28.00, 22.00, 30, 'pc'),
  ('Skyflakes Crackers 25g', 'Snacks', 5.00, 3.50, 100, 'pc'),
  ('Boy Bawang Cornick 100g', 'Snacks', 20.00, 15.00, 40, 'pc'),
  ('Piatos Cheese 40g', 'Snacks', 15.00, 11.00, 45, 'pc'),
  ('Marlboro Red Cigarette', 'Cigarettes', 9.00, 7.00, 200, 'stick'),
  ('Fortune Cigarette', 'Cigarettes', 6.00, 4.50, 200, 'stick'),
  ('White King Vinegar 385ml', 'Condiments', 18.00, 13.00, 20, 'pc'),
  ('Silver Swan Soy Sauce 385ml', 'Condiments', 22.00, 16.00, 20, 'pc'),
  ('Rice (Sinandomeng) 1kg', 'Rice & Essentials', 55.00, 45.00, 50, 'kg');

-- 6. STORAGE BUCKET for product images
-- Run this in SQL Editor to create the storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies (allow public read, anon upload)
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Allow upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Allow delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- Sample Customers (Kapitbahay)
INSERT INTO customers (name, address, phone, notes) VALUES
  ('Aling Maria', 'Block 1 Lot 5, Brgy. Sampaguita', '09171234567', 'Suki, laging bayad on time'),
  ('Mang Jose', 'Block 2 Lot 10, Brgy. Sampaguita', '09181234567', 'Minsan late magbayad'),
  ('Ate Nena', 'Block 1 Lot 8, Brgy. Sampaguita', '09191234567', 'Mabait na kapitbahay'),
  ('Kuya Ben', 'Block 3 Lot 2, Brgy. Sampaguita', '09201234567', ''),
  ('Tita Rose', 'Block 2 Lot 7, Brgy. Sampaguita', '09211234567', 'May anak na tatlo');
