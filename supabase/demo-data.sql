-- ============================================
-- DEMO DATA: Restaurant "La Parrilla de Don Carlos"
-- ============================================
-- Run this AFTER creating the demo user account via Supabase Auth
--
-- PASO 1: Crear cuenta en /register con:
--   Email: demo@restoqr.com
--   Password: Demo2024!
--   Nombre: Demo RestoQR
--
-- PASO 2: Obtener el user ID del usuario demo
--   SELECT id FROM auth.users WHERE email = 'demo@restoqr.com';
--
-- PASO 3: Reemplazar 'DEMO_USER_ID' abajo con ese UUID y ejecutar
-- ============================================

-- Variables (reemplazar DEMO_USER_ID)
DO $$
DECLARE
  demo_user_id UUID;
  rest_id UUID := uuid_generate_v4();
  cat_entradas UUID := uuid_generate_v4();
  cat_principales UUID := uuid_generate_v4();
  cat_pastas UUID := uuid_generate_v4();
  cat_parrilla UUID := uuid_generate_v4();
  cat_ensaladas UUID := uuid_generate_v4();
  cat_postres UUID := uuid_generate_v4();
  cat_bebidas UUID := uuid_generate_v4();
  cat_promos UUID := uuid_generate_v4();
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@restoqr.com';

  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'Demo user not found. Create account with email demo@restoqr.com first.';
  END IF;

  -- Update profile to admin
  UPDATE profiles SET role = 'admin', full_name = 'Carlos Demo', phone = '+54 9 11 5555-1234' WHERE id = demo_user_id;

  -- Create restaurant
  INSERT INTO restaurants (id, owner_id, name, slug, description, plan, require_email, welcome_message, discount_text, is_active, delivery_enabled, delivery_fee, whatsapp_number, transfer_alias, transfer_holder, transfer_bank, transfer_cbu, min_order_amount)
  VALUES (
    rest_id,
    demo_user_id,
    'La Parrilla de Don Carlos',
    'don-carlos',
    'Auténtica parrilla argentina con los mejores cortes de carne a la brasa. Tradición y sabor desde 1985.',
    'pro',
    false,
    '¡Bienvenido a La Parrilla de Don Carlos! Explora nuestra carta y hacé tu pedido.',
    '🔥 Promo: 2x1 en empanadas los martes',
    true,
    true,
    500,
    '+5491155551234',
    'doncarlos.mp',
    'Carlos Alberto Gómez',
    'Banco Galicia',
    '0070123456789012345678',
    1500
  );

  -- Categories
  INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order, is_active) VALUES
    (cat_entradas, rest_id, 'Entradas', 'Para compartir mientras esperás', 1, true),
    (cat_principales, rest_id, 'Platos Principales', 'Nuestras especialidades', 2, true),
    (cat_pastas, rest_id, 'Pastas', 'Pastas caseras hechas el día', 3, true),
    (cat_parrilla, rest_id, 'Parrilla', 'Cortes a la brasa con carbón', 4, true),
    (cat_ensaladas, rest_id, 'Ensaladas', 'Frescas y saludables', 5, true),
    (cat_postres, rest_id, 'Postres', 'El final perfecto', 6, true),
    (cat_bebidas, rest_id, 'Bebidas', 'Para acompañar tu comida', 7, true),
    (cat_promos, rest_id, 'Promociones', 'Ofertas especiales', 8, true);

  -- ENTRADAS
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_entradas, 'Empanadas (x6)', 'Carne cortada a cuchillo, humita, jamón y queso, pollo, caprese, verdura', 4800, true, 1),
    (rest_id, cat_entradas, 'Provoleta a la Parrilla', 'Queso provolone fundido con orégano y aceite de oliva', 5200, true, 2),
    (rest_id, cat_entradas, 'Tabla de Fiambres y Quesos', 'Selección de jamón crudo, salame, queso azul, brie y crackers', 7800, true, 3),
    (rest_id, cat_entradas, 'Morcilla Vasca', 'Morcilla artesanal crocante, acompañada con pan de campo', 3800, true, 4),
    (rest_id, cat_entradas, 'Humita en Chala', 'Tradicional humita de choclo envuelta en chala', 3200, true, 5),
    (rest_id, cat_entradas, 'Matambre Arrollado', 'Matambre tiernizado relleno con morrones y huevo, servido frío', 5500, true, 6);

  -- PLATOS PRINCIPALES
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_principales, 'Milanesa Napolitana', 'Milanesa de ternera con salsa de tomate, jamón y muzzarella. Papas fritas', 8500, true, 1),
    (rest_id, cat_principales, 'Milanesa de Pollo', 'Suprema empanada crocante con guarnición a elección', 7200, true, 2),
    (rest_id, cat_principales, 'Suprema Maryland', 'Suprema empanada con banana, durazno, papas pay y crema de choclo', 8800, true, 3),
    (rest_id, cat_principales, 'Lomo a la Pimienta', 'Medallones de lomo con salsa de pimienta negra y papas noisette', 12500, true, 4),
    (rest_id, cat_principales, 'Pollo al Verdeo', 'Medio pollo deshuesado con salsa de verdeo y puré', 7800, true, 5);

  -- PASTAS
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_pastas, 'Ñoquis de Papa', 'Ñoquis caseros con salsa bolognesa, filetto o estofado', 6200, true, 1),
    (rest_id, cat_pastas, 'Ravioles de Ricota', 'Ravioles caseros rellenos de ricota y nuez, con salsa a elección', 6800, true, 2),
    (rest_id, cat_pastas, 'Fetuccini Alfredo', 'Fetuccini al huevo con salsa cremosa de parmesano', 7200, true, 3),
    (rest_id, cat_pastas, 'Sorrentinos de Jamón y Queso', 'Sorrentinos caseros con salsa rosa', 7500, true, 4),
    (rest_id, cat_pastas, 'Lasagna de Carne', 'Lasagna de pasta al huevo con carne, bechamel y muzzarella gratinada', 8200, true, 5);

  -- PARRILLA
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_parrilla, 'Bife de Chorizo (400g)', 'El clásico corte argentino, jugoso y tierno. Con ensalada mixta', 11800, true, 1),
    (rest_id, cat_parrilla, 'Ojo de Bife (350g)', 'Corte premium marmoleado, a punto. Con papas al horno', 13500, true, 2),
    (rest_id, cat_parrilla, 'Entraña', 'Corte fino y sabroso, ideal al punto. Con verduras grilladas', 10500, true, 3),
    (rest_id, cat_parrilla, 'Vacío (500g)', 'Corte lento a la brasa, crocante por fuera y jugoso por dentro', 12000, true, 4),
    (rest_id, cat_parrilla, 'Asado de Tira', 'Costillas de res a la brasa con chimichurri casero', 9800, true, 5),
    (rest_id, cat_parrilla, 'Parrillada para 2', 'Bife, chorizo, morcilla, entraña, mollejas y chinchulín', 22000, true, 6),
    (rest_id, cat_parrilla, 'Parrillada para 4', 'Generosa selección de todos los cortes + achuras', 38000, true, 7),
    (rest_id, cat_parrilla, 'Mollejas', 'Mollejas doradas y crocantes con limón', 7800, true, 8),
    (rest_id, cat_parrilla, 'Chorizo Criollo', 'Chorizo artesanal a la parrilla con chimichurri', 4200, true, 9);

  -- ENSALADAS
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_ensaladas, 'Ensalada César', 'Lechuga, croutones, parmesano, pollo grillado y aderezo César', 6200, true, 1),
    (rest_id, cat_ensaladas, 'Ensalada Mixta', 'Lechuga, tomate, cebolla, zanahoria y huevo', 3500, true, 2),
    (rest_id, cat_ensaladas, 'Ensalada Caprese', 'Tomate, muzzarella fresca, albahaca y aceite de oliva', 5200, true, 3),
    (rest_id, cat_ensaladas, 'Ensalada Rúcula y Parmesano', 'Rúcula, parmesano en lascas, tomates cherry y balsámico', 5500, true, 4);

  -- POSTRES
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_postres, 'Flan Casero', 'Flan de huevo con dulce de leche y crema', 3800, true, 1),
    (rest_id, cat_postres, 'Tiramisú', 'Clásico italiano con mascarpone, café y cacao', 4500, true, 2),
    (rest_id, cat_postres, 'Panqueques con Dulce de Leche', 'Panqueques rellenos de dulce de leche, flameados', 3500, true, 3),
    (rest_id, cat_postres, 'Brownie con Helado', 'Brownie de chocolate tibio con helado de vainilla', 4800, true, 4),
    (rest_id, cat_postres, 'Ensalada de Frutas', 'Frutas de estación con jugo de naranja natural', 3200, true, 5),
    (rest_id, cat_postres, 'Helado Artesanal (3 bochas)', 'Variedad de sabores artesanales', 3500, true, 6);

  -- BEBIDAS
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_bebidas, 'Agua Mineral (500ml)', 'Con o sin gas', 1200, true, 1),
    (rest_id, cat_bebidas, 'Gaseosa (500ml)', 'Coca-Cola, Sprite, Fanta', 1500, true, 2),
    (rest_id, cat_bebidas, 'Cerveza Artesanal (pinta)', 'IPA, Amber Ale, Stout', 3200, true, 3),
    (rest_id, cat_bebidas, 'Quilmes (1L)', 'La cerveza argentina clásica', 3500, true, 4),
    (rest_id, cat_bebidas, 'Vino Malbec (botella)', 'Malbec mendocino de bodega seleccionada', 8500, true, 5),
    (rest_id, cat_bebidas, 'Vino Tinto de la Casa (jarra)', 'Vino tinto de corte, ideal para compartir', 5500, true, 6),
    (rest_id, cat_bebidas, 'Limonada Casera (jarra)', 'Limonada fresca con menta y jengibre', 3200, true, 7),
    (rest_id, cat_bebidas, 'Café Espresso', 'Café de especialidad', 1800, true, 8),
    (rest_id, cat_bebidas, 'Cortado', 'Espresso con toque de leche', 2000, true, 9);

  -- PROMOCIONES
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
    (rest_id, cat_promos, '🔥 Combo Parrillero', 'Parrillada para 2 + Ensalada mixta + Jarra de vino', 26000, true, 1),
    (rest_id, cat_promos, '🍕 Promo Milanesa', 'Milanesa napolitana + Gaseosa 500ml + Flan', 10500, true, 2),
    (rest_id, cat_promos, '🎉 Promo Amigos (4 personas)', 'Empanadas x12 + Parrillada p/4 + 2 jarras de limonada', 48000, true, 3);

  -- Some sample analytics events (last 30 days)
  FOR i IN 1..100 LOOP
    INSERT INTO analytics_events (restaurant_id, event_type, created_at)
    VALUES (
      rest_id,
      ((ARRAY['visit', 'qr_scan', 'email_register'])[floor(random() * 3 + 1)])::event_type,
      NOW() - (random() * interval '30 days')
    );
  END LOOP;

  -- Some sample customer emails
  INSERT INTO customer_emails (restaurant_id, email, name, registered_via, created_at) VALUES
    (rest_id, 'juan.garcia@gmail.com', 'Juan García', 'manual', NOW() - interval '2 hours'),
    (rest_id, 'maria.lopez@hotmail.com', 'María López', 'manual', NOW() - interval '5 hours'),
    (rest_id, 'carlos.rodriguez@gmail.com', 'Carlos Rodríguez', 'manual', NOW() - interval '1 day'),
    (rest_id, 'ana.martinez@outlook.com', 'Ana Martínez', 'google', NOW() - interval '2 days'),
    (rest_id, 'pedro.sanchez@gmail.com', 'Pedro Sánchez', 'manual', NOW() - interval '3 days'),
    (rest_id, 'lucia.fernandez@yahoo.com', 'Lucía Fernández', 'google', NOW() - interval '4 days'),
    (rest_id, 'diego.morales@gmail.com', 'Diego Morales', 'manual', NOW() - interval '5 days'),
    (rest_id, 'valeria.silva@hotmail.com', 'Valeria Silva', 'manual', NOW() - interval '6 days'),
    (rest_id, 'martin.perez@gmail.com', 'Martín Pérez', 'google', NOW() - interval '7 days'),
    (rest_id, 'camila.ruiz@gmail.com', 'Camila Ruiz', 'manual', NOW() - interval '8 days');

  RAISE NOTICE 'Demo restaurant created! Slug: don-carlos, Menu URL: /menu/don-carlos';
END $$;
