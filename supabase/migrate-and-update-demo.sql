-- ============================================================
-- RestoQR — Migrations + Demo Update
-- Corré esto COMPLETO en Supabase SQL Editor
-- Es seguro correrlo múltiples veces (idempotente)
-- ============================================================

-- 1. Agregar columnas nuevas a restaurants (IF NOT EXISTS = seguro re-correr)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_alias TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_holder TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_bank TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS transfer_cbu TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#f97316';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS default_view TEXT DEFAULT 'list';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_type TEXT DEFAULT 'discount';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_title TEXT DEFAULT '10% de descuento';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_description TEXT DEFAULT 'En tu próxima visita o pedido online';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS incentive_code TEXT;

-- 2. Actualizar demo restaurant con logo + configuración completa
UPDATE restaurants
SET
  logo_url              = 'https://resto-virid.vercel.app/demo-logo-don-carlos.svg',
  primary_color         = '#c0392b',
  default_view          = 'list',
  require_email         = true,
  incentive_type        = 'discount',
  incentive_title       = '10% de descuento',
  incentive_description = 'En tu primer pedido online. Válido solo hoy.',
  incentive_code        = 'BIENVENIDO10',
  welcome_message       = '¡Bienvenido a La Parrilla de Don Carlos!'
WHERE slug = 'don-carlos';
