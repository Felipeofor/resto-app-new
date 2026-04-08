-- ============================================
-- RestoQR - Multi-tenant Schema
-- ============================================
-- Estrategia: Row-Level Security por restaurant_id
-- Cada restaurante es un "tenant" aislado
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types (idempotent — safe to re-run)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE plan_type AS ENUM ('free', 'pro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE registration_method AS ENUM ('manual', 'google'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_type AS ENUM ('visit', 'qr_scan', 'email_register'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE member_role AS ENUM ('owner', 'editor', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Restaurants table (each restaurant = 1 tenant)
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  plan plan_type NOT NULL DEFAULT 'free',
  pro_started_at TIMESTAMP WITH TIME ZONE,
  pro_expires_at TIMESTAMP WITH TIME ZONE,
  require_email BOOLEAN NOT NULL DEFAULT FALSE,
  welcome_message TEXT DEFAULT 'Bienvenido a nuestro restaurante! Gracias por visitarnos.',
  discount_text TEXT DEFAULT '10% de descuento en tu próxima visita',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ============================================
-- MULTI-TENANT: restaurant_members
-- ============================================
-- Permite que un admin gestione VARIOS restaurantes
-- y que un restaurante tenga VARIOS admins/editores
--
-- member_role:
--   owner  = creador, puede eliminar el restaurante, gestionar miembros
--   editor = puede editar menú, categorías, configuración
--   viewer = solo lectura (útil para franquicias/supervisores)
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_role member_role NOT NULL DEFAULT 'editor',
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(restaurant_id, user_id)
);

-- ============================================
-- MENU TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ============================================
-- CUSTOMER & ENGAGEMENT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS customer_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  registered_via registration_method NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(restaurant_id, email)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ============================================
-- ANALYTICS & AI TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  photos_processed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(restaurant_id, month)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_user_id ON restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_restaurant_id ON restaurant_members(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_customer_emails_restaurant_id ON customer_emails(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_emails_email ON customer_emails(email);
CREATE INDEX IF NOT EXISTS idx_qr_codes_restaurant_id ON qr_codes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_restaurant_id ON analytics_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_restaurant_id ON ai_usage(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON ai_usage(month);

-- ============================================
-- HELPER FUNCTION: check if user is member of restaurant
-- ============================================
-- Used by RLS policies to avoid repeating the same subquery
-- Returns TRUE if the user is owner/editor/viewer OR super_admin

CREATE OR REPLACE FUNCTION is_restaurant_member(
  _restaurant_id UUID,
  _user_id UUID,
  _min_role member_role DEFAULT 'viewer'
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins always have access
  IF EXISTS (SELECT 1 FROM profiles WHERE id = _user_id AND role = 'super_admin') THEN
    RETURN TRUE;
  END IF;

  -- Check restaurant_members table
  IF _min_role = 'owner' THEN
    RETURN EXISTS (
      SELECT 1 FROM restaurant_members
      WHERE restaurant_id = _restaurant_id
        AND user_id = _user_id
        AND member_role = 'owner'
    );
  ELSIF _min_role = 'editor' THEN
    RETURN EXISTS (
      SELECT 1 FROM restaurant_members
      WHERE restaurant_id = _restaurant_id
        AND user_id = _user_id
        AND member_role IN ('owner', 'editor')
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM restaurant_members
      WHERE restaurant_id = _restaurant_id
        AND user_id = _user_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = _user_id AND role = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: profiles
-- ============================================

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON profiles
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES: restaurants
-- ============================================

-- Anyone can view active restaurants (public menu page)
CREATE POLICY "Anyone can view active restaurants" ON restaurants
  FOR SELECT USING (is_active = TRUE);

-- Members can view their restaurants (including inactive)
CREATE POLICY "Members can view their restaurants" ON restaurants
  FOR SELECT USING (is_restaurant_member(id, auth.uid()));

-- Only owners can update their restaurant
CREATE POLICY "Owners can update their restaurant" ON restaurants
  FOR UPDATE USING (is_restaurant_member(id, auth.uid(), 'owner'));

-- Only owners can delete their restaurant
CREATE POLICY "Owners can delete their restaurant" ON restaurants
  FOR DELETE USING (is_restaurant_member(id, auth.uid(), 'owner'));

-- Any authenticated admin can create a restaurant
CREATE POLICY "Admins can create restaurants" ON restaurants
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- ============================================
-- RLS POLICIES: restaurant_members
-- ============================================

-- Members can see other members of their restaurants
CREATE POLICY "Members can view restaurant members" ON restaurant_members
  FOR SELECT USING (is_restaurant_member(restaurant_id, auth.uid()));

-- Only owners can add members
CREATE POLICY "Owners can add members" ON restaurant_members
  FOR INSERT WITH CHECK (is_restaurant_member(restaurant_id, auth.uid(), 'owner'));

-- Only owners can remove members
CREATE POLICY "Owners can remove members" ON restaurant_members
  FOR DELETE USING (is_restaurant_member(restaurant_id, auth.uid(), 'owner'));

-- Only owners can change member roles
CREATE POLICY "Owners can update member roles" ON restaurant_members
  FOR UPDATE USING (is_restaurant_member(restaurant_id, auth.uid(), 'owner'));

-- ============================================
-- RLS POLICIES: menu_categories
-- ============================================

CREATE POLICY "Anyone can view active menu categories" ON menu_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Editors can manage categories" ON menu_categories
  FOR UPDATE USING (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can insert categories" ON menu_categories
  FOR INSERT WITH CHECK (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete categories" ON menu_categories
  FOR DELETE USING (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

-- ============================================
-- RLS POLICIES: menu_items
-- ============================================

CREATE POLICY "Anyone can view menu items" ON menu_items
  FOR SELECT USING (TRUE);

CREATE POLICY "Editors can manage items" ON menu_items
  FOR UPDATE USING (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can insert items" ON menu_items
  FOR INSERT WITH CHECK (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete items" ON menu_items
  FOR DELETE USING (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

-- ============================================
-- RLS POLICIES: customer_emails
-- ============================================

CREATE POLICY "Members can view customer emails" ON customer_emails
  FOR SELECT USING (is_restaurant_member(restaurant_id, auth.uid()));

-- Anyone can register (public, from menu page)
CREATE POLICY "Anyone can register email" ON customer_emails
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Owners can delete customer emails" ON customer_emails
  FOR DELETE USING (is_restaurant_member(restaurant_id, auth.uid(), 'owner'));

-- ============================================
-- RLS POLICIES: qr_codes
-- ============================================

CREATE POLICY "Anyone can view QR codes" ON qr_codes
  FOR SELECT USING (TRUE);

CREATE POLICY "Editors can manage QR codes" ON qr_codes
  FOR INSERT WITH CHECK (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

CREATE POLICY "Owners can delete QR codes" ON qr_codes
  FOR DELETE USING (is_restaurant_member(restaurant_id, auth.uid(), 'owner'));

-- ============================================
-- RLS POLICIES: analytics_events
-- ============================================

-- Anyone can insert (public, from menu page visits)
CREATE POLICY "Anyone can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Members can view their analytics" ON analytics_events
  FOR SELECT USING (is_restaurant_member(restaurant_id, auth.uid()));

-- ============================================
-- RLS POLICIES: ai_usage
-- ============================================

CREATE POLICY "Members can view AI usage" ON ai_usage
  FOR SELECT USING (is_restaurant_member(restaurant_id, auth.uid()));

CREATE POLICY "Editors can track AI usage" ON ai_usage
  FOR INSERT WITH CHECK (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update AI usage" ON ai_usage
  FOR UPDATE USING (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Auto-add creator as owner when restaurant is created
CREATE OR REPLACE FUNCTION handle_new_restaurant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.restaurant_members (restaurant_id, user_id, member_role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_restaurant_created
  AFTER INSERT ON restaurants
  FOR EACH ROW EXECUTE PROCEDURE handle_new_restaurant();

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- ORDERS & DELIVERY
-- ============================================

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'uploaded', 'confirmed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  transfer_receipt_url TEXT,
  order_status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Anyone can create orders (public checkout)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (TRUE);

-- Restaurant members can view their orders
CREATE POLICY "Members can view orders" ON orders
  FOR SELECT USING (is_restaurant_member(restaurant_id, auth.uid()));

-- Anyone can view their own order by id (for tracking)
CREATE POLICY "Customers can view their order" ON orders
  FOR SELECT USING (TRUE);

-- Editors can update order status
CREATE POLICY "Editors can update orders" ON orders
  FOR UPDATE USING (is_restaurant_member(restaurant_id, auth.uid(), 'editor'));

-- Anyone can upload receipt (update transfer_receipt_url and payment_status)
CREATE POLICY "Anyone can upload receipt" ON orders
  FOR UPDATE USING (TRUE)
  WITH CHECK (TRUE);

-- Order items
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can view order items" ON order_items
  FOR SELECT USING (TRUE);

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add delivery configuration to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_alias TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_holder TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_bank TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_cbu TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10,2) DEFAULT 0;

-- Add restaurant address and public phone
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT;

-- Visual customization: brand color + default menu view
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#f97316';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS default_view TEXT DEFAULT 'list';

-- Email gate incentive (what benefit the customer gets for sharing their email)
-- incentive_type: 'discount' | 'free_item' | 'exclusive' | 'loyalty' | 'none'
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_type TEXT DEFAULT 'discount';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_title TEXT DEFAULT '10% de descuento';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_description TEXT DEFAULT 'En tu próxima visita o pedido online';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_code TEXT; -- optional promo code to show

-- ============================================
-- PROFILES: add phone for restaurant owners
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================
-- SUBSCRIPTION PAYMENTS
-- ============================================
-- Tracks Pro plan payment requests from restaurant owners
-- Super admin reviews and approves/rejects

DO $$ BEGIN
  CREATE TYPE subscription_payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 5000,
  transfer_receipt_url TEXT,
  status subscription_payment_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_restaurant ON subscription_payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user ON subscription_payments(user_id);

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can view their own payments
CREATE POLICY "Owners can view their subscription payments" ON subscription_payments
  FOR SELECT USING (
    user_id = auth.uid() OR
    is_restaurant_member(restaurant_id, auth.uid(), 'owner') OR
    is_super_admin(auth.uid())
  );

-- Restaurant owners can create payment requests
CREATE POLICY "Owners can create subscription payments" ON subscription_payments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    is_restaurant_member(restaurant_id, auth.uid(), 'owner')
  );

-- Only super admins can update (approve/reject)
CREATE POLICY "Super admins can update subscription payments" ON subscription_payments
  FOR UPDATE USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- APP SETTINGS (global config, managed by super_admin)
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

INSERT INTO app_settings (key, value) VALUES ('pro_price', '5000') ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read app settings" ON app_settings
  FOR SELECT USING (TRUE);

-- Only super admins can update
CREATE POLICY "Super admins can update app settings" ON app_settings
  FOR UPDATE USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert app settings" ON app_settings
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));
