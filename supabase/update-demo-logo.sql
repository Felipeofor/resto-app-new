-- Run this in Supabase SQL Editor to update the demo restaurant logo
-- (for existing installations where demo-data.sql was already run)

UPDATE restaurants
SET
  logo_url      = 'https://resto-virid.vercel.app/demo-logo-don-carlos.svg',
  primary_color = '#c0392b',
  default_view  = 'list',
  require_email = true,
  incentive_type        = 'discount',
  incentive_title       = '10% de descuento',
  incentive_description = 'En tu primer pedido online. Válido solo hoy.',
  incentive_code        = 'BIENVENIDO10'
WHERE slug = 'don-carlos';
