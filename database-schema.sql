-- Restaurant Delivery App - Cart & Checkout Database Schema
-- Run these migrations in your Supabase project

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text,
  customer_whatsapp text NOT NULL,
  delivery_address text NOT NULL,
  delivery_notes text,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'new' CHECK (status IN ('new', 'pending_payment', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  transfer_receipt_url text,
  payment_status text CHECK (payment_status IN ('pending', 'uploaded', 'verified', 'confirmed')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_whatsapp ON orders(customer_whatsapp);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow public read for customer tracking (optional)
-- CREATE POLICY "Orders are viewable by phone number"
--   ON orders FOR SELECT
--   USING (true);

-- Allow authenticated users (admin) to read/update
-- CREATE POLICY "Admins can manage orders"
--   ON orders FOR ALL
--   USING (auth.role() = 'authenticated');

-- ============================================================================
-- TRIGGERS - Automatic timestamp updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS - Useful for reporting and analytics
-- ============================================================================

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT
  o.id,
  o.order_number,
  o.restaurant_id,
  o.customer_name,
  o.customer_whatsapp,
  o.customer_email,
  o.delivery_address,
  o.payment_method,
  o.total_amount,
  o.status,
  o.payment_status,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity,
  o.created_at,
  o.updated_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY
  o.id, o.order_number, o.restaurant_id, o.customer_name,
  o.customer_whatsapp, o.customer_email, o.delivery_address,
  o.payment_method, o.total_amount, o.status, o.payment_status,
  o.created_at, o.updated_at;

-- ============================================================================
-- STORAGE BUCKET - Receipts
-- ============================================================================

-- In Supabase dashboard:
-- 1. Go to Storage
-- 2. Create new bucket named "receipts"
-- 3. Set Access to "Public"
-- 4. Files in this bucket will be accessible at:
--    https://<project-id>.supabase.co/storage/v1/object/public/receipts/<filename>

-- Example SQL to set up if using Supabase SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('receipts', 'receipts', true);

-- ============================================================================
-- DATA INTEGRITY NOTES
-- ============================================================================
/*
KEY POINTS:

1. FOREIGN KEYS:
   - orders.restaurant_id → restaurants.id (CASCADE DELETE)
   - order_items.order_id → orders.id (CASCADE Delete)
   - order_items.menu_item_id → menu_items.id (RESTRICT - don't delete menu item if has orders)

2. CONSTRAINTS:
   - payment_method: only 'cash' or 'transfer'
   - status: valid order states
   - payment_status: valid payment states
   - total_amount & price: non-negative
   - quantity: must be > 0

3. INDEXES:
   - restaurant_id: fast filter by restaurant
   - status: fast filter for admin dashboards
   - created_at: fast ordering
   - whatsapp: useful for customer lookup

4. TRIGGERS:
   - updated_at auto-updates on record changes

5. VIEWS:
   - order_summary: aggregated data for reporting

6. STORAGE:
   - receipts bucket: transfer payment proofs
*/

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get orders for a specific restaurant today
SELECT * FROM orders
WHERE restaurant_id = '...'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Get pending payments (transfer receipts uploaded)
SELECT * FROM orders
WHERE payment_method = 'transfer'
  AND payment_status = 'uploaded'
  AND status = 'pending_payment'
ORDER BY created_at DESC;

-- Get order summary with item details
SELECT
  o.order_number,
  o.customer_name,
  o.customer_whatsapp,
  o.payment_method,
  o.total_amount,
  o.status,
  STRING_AGG(
    oi.name || ' (x' || oi.quantity || ')',
    ', '
  ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.restaurant_id = '...'
GROUP BY o.id, o.order_number, o.customer_name, o.customer_whatsapp, o.payment_method, o.total_amount, o.status
ORDER BY o.created_at DESC;

-- Get revenue by payment method for today
SELECT
  payment_method,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE restaurant_id = '...'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY payment_method;

-- ============================================================================
-- CLEANUP (if needed)
-- ============================================================================

-- Drop tables (be careful!)
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP VIEW IF EXISTS order_summary;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
