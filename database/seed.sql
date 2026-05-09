-- Smart Inventory Management System seed data.
-- Demo password for every seeded user: inventory123

insert into users (id, email, password_hash, name, role, is_active, last_login_at) values
  ('11111111-1111-1111-1111-111111111111', 'admin@demo.com',   'demo_inventory_seed_2026:f09357e8d3411f32b896183d5c8630d38548848ad920f593f937bc0ffac1e47d29cdfa1a4d2bc3f2879d38c090a97da09a3137d9998130895f41fd791d4b8d04', 'Aarav Mehta', 'admin',   true, now()),
  ('22222222-2222-2222-2222-222222222222', 'manager@demo.com', 'demo_inventory_seed_2026:f09357e8d3411f32b896183d5c8630d38548848ad920f593f937bc0ffac1e47d29cdfa1a4d2bc3f2879d38c090a97da09a3137d9998130895f41fd791d4b8d04', 'Maya Kapoor', 'manager', true, now() - interval '2 hours'),
  ('33333333-3333-3333-3333-333333333333', 'staff@demo.com',   'demo_inventory_seed_2026:f09357e8d3411f32b896183d5c8630d38548848ad920f593f937bc0ffac1e47d29cdfa1a4d2bc3f2879d38c090a97da09a3137d9998130895f41fd791d4b8d04', 'Kabir Sethi', 'staff',   true, now() - interval '1 day'),
  ('44444444-4444-4444-4444-444444444444', 'viewer@demo.com',  'demo_inventory_seed_2026:f09357e8d3411f32b896183d5c8630d38548848ad920f593f937bc0ffac1e47d29cdfa1a4d2bc3f2879d38c090a97da09a3137d9998130895f41fd791d4b8d04', 'Nisha Rao',  'viewer',  true, now() - interval '3 days');

insert into warehouses (id, name, location, address, city, country, capacity, manager_id, is_active) values
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Mumbai Central Hub', 'West Zone',  'Andheri East Logistics Park, Gate 4', 'Mumbai',    'India', 12000, '22222222-2222-2222-2222-222222222222', true),
  ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Delhi North DC',     'North Zone', 'Okhla Industrial Area Phase II',      'Delhi',     'India',  9000, '33333333-3333-3333-3333-333333333333', true),
  ('cccccccc-3333-3333-3333-cccccccccccc', 'Bengaluru South Fulfillment', 'South Zone', 'Electronic City Phase I', 'Bengaluru', 'India', 10500, '33333333-3333-3333-3333-333333333333', true),
  ('dddddddd-4444-4444-4444-dddddddddddd', 'Pune Returns & QA',  'West Zone',  'Chakan Industrial Estate',            'Pune',      'India',  4500, '22222222-2222-2222-2222-222222222222', true);

insert into categories (id, name, description, parent_id) values
  ('ca000000-0000-0000-0000-000000000001', 'Electronics', 'Connected inventory hardware and smart devices', null),
  ('ca000000-0000-0000-0000-000000000002', 'Hardware', 'Scanning, printing, and warehouse equipment', null),
  ('ca000000-0000-0000-0000-000000000003', 'IoT', 'Sensors and telemetry products', 'ca000000-0000-0000-0000-000000000001'),
  ('ca000000-0000-0000-0000-000000000004', 'Packaging', 'Labels, cartons, and consumable packaging', null),
  ('ca000000-0000-0000-0000-000000000005', 'Consumables', 'Printer ribbons and operational consumables', 'ca000000-0000-0000-0000-000000000002');

insert into suppliers (id, name, contact_person, email, phone, address, city, country, payment_terms, lead_time_days, is_active) values
  ('su000000-0000-0000-0000-000000000001', 'Northstar Components', 'Rohan Bose',  'supply@northstar.example', '+91 98765 10001', 'Plot 14, MIDC',           'Pune',      'India', 'Net 30', 5, true),
  ('su000000-0000-0000-0000-000000000002', 'Urban Retail Supply',  'Amrita Sen',  'ops@urbanretail.example',  '+91 98765 10002', 'Sector 63 Industrial',   'Noida',     'India', 'Net 15', 8, true),
  ('su000000-0000-0000-0000-000000000003', 'Prime Packaging Co.',  'Dev Nair',    'orders@primepack.example', '+91 98765 10003', 'Bidadi Industrial Area', 'Bengaluru', 'India', 'Net 21', 6, true),
  ('su000000-0000-0000-0000-000000000004', 'Medley Cold Chain',    'Simran Gill', 'dispatch@medley.example',  '+91 98765 10004', 'Sanand GIDC',            'Ahmedabad', 'India', 'Net 30', 9, true);

insert into products (
  id, sku, name, description, category_id, supplier_id, unit_of_measure,
  cost_price, selling_price, reorder_point, reorder_quantity, barcode, qr_code,
  batch_tracking, expiry_tracking, image_url, is_active
) values
  ('10000000-0000-0000-0000-000000000001', 'SKU-AER-0001', 'AeroTrack RFID Tag Pack', 'Tamper-resistant RFID tags for cartons and shelf bins.', 'ca000000-0000-0000-0000-000000000001', 'su000000-0000-0000-0000-000000000001', 'pack', 650.00, 1199.00, 120, 360, '890100000001', 'SKU-AER-0001', true,  false, 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=800', true),
  ('10000000-0000-0000-0000-000000000002', 'SKU-NOV-0002', 'NovaScan Wireless Scanner', 'Bluetooth handheld barcode scanner for picking stations.', 'ca000000-0000-0000-0000-000000000002', 'su000000-0000-0000-0000-000000000001', 'unit', 5100.00, 8499.00, 25, 80, '890100000002', 'SKU-NOV-0002', true,  false, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800', true),
  ('10000000-0000-0000-0000-000000000003', 'SKU-COL-0003', 'ColdChain Label Roll', 'Temperature-safe label rolls for chilled shipments.', 'ca000000-0000-0000-0000-000000000004', 'su000000-0000-0000-0000-000000000003', 'roll', 210.00, 449.00, 300, 900, '890100000003', 'SKU-COL-0003', true,  true, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', true),
  ('10000000-0000-0000-0000-000000000004', 'SKU-RET-0004', 'Retail Shelf Sensor', 'IoT shelf sensor with hourly stock-presence telemetry.', 'ca000000-0000-0000-0000-000000000003', 'su000000-0000-0000-0000-000000000002', 'unit', 1990.00, 3299.00, 60, 180, '890100000004', 'SKU-RET-0004', true,  false, 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', true),
  ('10000000-0000-0000-0000-000000000005', 'SKU-THE-0005', 'Thermal Printer Ribbon', 'Wax-resin ribbon for thermal transfer printers.', 'ca000000-0000-0000-0000-000000000005', 'su000000-0000-0000-0000-000000000003', 'roll', 360.00, 799.00, 180, 540, '890100000005', 'SKU-THE-0005', true,  true, 'https://images.unsplash.com/photo-1581091870627-3f619f8d999f?w=800', true),
  ('10000000-0000-0000-0000-000000000006', 'SKU-MED-0006', 'ColdPack Gel Brick', 'Reusable gel brick for pharma cold-chain cartons.', 'ca000000-0000-0000-0000-000000000004', 'su000000-0000-0000-0000-000000000004', 'unit', 95.00, 180.00, 500, 1500, '890100000006', 'SKU-MED-0006', true, true, 'https://images.unsplash.com/photo-1581093458791-9d42e252f7d4?w=800', true);

insert into product_variants (id, product_id, variant_name, sku_suffix, attributes, cost_price, selling_price, barcode, is_active) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50-pack graphite', '50-GPH', '{"packSize":50,"color":"graphite"}', 650.00, 1199.00, '890100000001', true),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Standard black', 'STD-BLK', '{"color":"black","rangeMeters":30}', 5100.00, 8499.00, '890100000002', true),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Mini silver', 'MIN-SLV', '{"size":"mini","color":"silver"}', 1990.00, 3299.00, '890100000004A', true),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Pro black', 'PRO-BLK', '{"size":"pro","color":"black"}', 2450.00, 3999.00, '890100000004B', true);

insert into inventory (id, product_id, warehouse_id, quantity, reserved_quantity, batch_number, expiry_date, last_counted_at) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 420, 30, 'AT-2404', null, now() - interval '2 days'),
  ('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 160, 12, 'AT-2404', null, now() - interval '1 day'),
  ('12000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',  21,  5, 'NS-2405', null, now() - interval '5 hours'),
  ('12000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'cccccccc-3333-3333-3333-cccccccccccc',  44,  8, 'NS-2405', null, now() - interval '4 hours'),
  ('12000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 920,120, 'CC-2402', current_date + interval '410 days', now() - interval '3 days'),
  ('12000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'cccccccc-3333-3333-3333-cccccccccccc',  54, 11, 'RS-2401', null, now() - interval '6 hours'),
  ('12000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 175, 32, 'TP-2406', current_date + interval '140 days', now() - interval '2 hours'),
  ('12000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', 'dddddddd-4444-4444-4444-dddddddddddd', 820,  0, 'CP-2403', current_date + interval '75 days', now() - interval '1 day');

insert into purchase_orders (id, po_number, supplier_id, warehouse_id, status, order_date, expected_date, received_date, total_amount, notes, created_by) values
  ('20000000-0000-0000-0000-000000000001', 'PO-2026-1001', 'su000000-0000-0000-0000-000000000001', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'received',  current_date - interval '7 days', current_date - interval '2 days', current_date - interval '1 day', 182000.00, 'RFID tags and scanner replenishment', '22222222-2222-2222-2222-222222222222'),
  ('20000000-0000-0000-0000-000000000002', 'PO-2026-1002', 'su000000-0000-0000-0000-000000000003', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'confirmed', current_date - interval '1 day', current_date + interval '5 days', null, 189000.00, 'Monthly label roll replenishment', '22222222-2222-2222-2222-222222222222');

insert into purchase_order_items (id, po_id, product_id, quantity_ordered, quantity_received, unit_cost) values
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 200, 200, 650.00),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 10, 10, 5100.00),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 900, 0, 210.00);

insert into sales_orders (id, so_number, customer_name, customer_email, customer_phone, warehouse_id, status, order_date, shipped_date, delivered_date, tracking_number, carrier_name, total_amount, notes, created_by) values
  ('30000000-0000-0000-0000-000000000001', 'SO-2026-2042', 'BrightMart Retail', 'ops@brightmart.example', '+91 91234 56780', 'cccccccc-3333-3333-3333-cccccccccccc', 'shipped', current_date - interval '1 day', current_date, null, 'BLUEDART98231', 'Blue Dart', 87950.00, 'Priority retail replenishment', '33333333-3333-3333-3333-333333333333'),
  ('30000000-0000-0000-0000-000000000002', 'SO-2026-2046', 'Metro Fresh', 'receiving@metrofresh.example', '+91 91234 56781', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'confirmed', current_date, null, null, null, null, 42600.00, 'Hold for route B dispatch', '33333333-3333-3333-3333-333333333333');

insert into sales_order_items (id, so_id, product_id, quantity, unit_price, discount_percent) values
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 20, 3299.00, 0),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 3, 8499.00, 5),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 100, 449.00, 5);

insert into transfers (id, transfer_number, from_warehouse_id, to_warehouse_id, status, initiated_by, transfer_date, completed_date, notes) values
  ('40000000-0000-0000-0000-000000000001', 'TR-2026-0312', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'completed', '33333333-3333-3333-3333-333333333333', current_date - interval '3 days', current_date - interval '2 days', 'Regional balancing before weekend demand'),
  ('40000000-0000-0000-0000-000000000002', 'TR-2026-0318', 'dddddddd-4444-4444-4444-dddddddddddd', 'cccccccc-3333-3333-3333-cccccccccccc', 'in_transit', '33333333-3333-3333-3333-333333333333', current_date, null, 'Cold-chain buffers for Bengaluru');

insert into transfer_items (id, transfer_id, product_id, quantity_requested, quantity_transferred) values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 120, 120),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 12, 12),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 300, 0);

insert into returns (id, return_number, reference_type, reference_id, warehouse_id, reason, status, total_items, processed_by) values
  ('50000000-0000-0000-0000-000000000001', 'RT-2026-0091', 'sale', '30000000-0000-0000-0000-000000000001', 'cccccccc-3333-3333-3333-cccccccccccc', 'Damaged during transit', 'pending', 6, '33333333-3333-3333-3333-333333333333'),
  ('50000000-0000-0000-0000-000000000002', 'RT-2026-0092', 'purchase', '20000000-0000-0000-0000-000000000001', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Scanner carton seal broken', 'approved', 1, '22222222-2222-2222-2222-222222222222');

insert into return_items (id, return_id, product_id, quantity, condition, action) values
  ('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 4, 'damaged', 'discard'),
  ('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 2, 'good', 'restock'),
  ('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, 'damaged', 'return_to_supplier');

insert into stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_id, reference_type, unit_cost, total_cost, notes, created_by, created_at) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'purchase', 200, '20000000-0000-0000-0000-000000000001', 'purchase_order', 650.00, 130000.00, 'PO received into Mumbai', '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'purchase', 10, '20000000-0000-0000-0000-000000000001', 'purchase_order', 5100.00, 51000.00, 'PO received into Mumbai', '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'cccccccc-3333-3333-3333-cccccccccccc', 'sale', 20, '30000000-0000-0000-0000-000000000001', 'sales_order', 1990.00, 39800.00, 'Sales shipment picked', '33333333-3333-3333-3333-333333333333', now() - interval '5 hours'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'transfer_out', 120, '40000000-0000-0000-0000-000000000001', 'transfer', 650.00, 78000.00, 'Transfer dispatched from Mumbai', '33333333-3333-3333-3333-333333333333', now() - interval '2 days'),
  ('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'transfer_in', 120, '40000000-0000-0000-0000-000000000001', 'transfer', 650.00, 78000.00, 'Transfer received in Delhi', '33333333-3333-3333-3333-333333333333', now() - interval '2 days');

insert into audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) values
  ('70000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'purchase_order.received', 'purchase_orders', '20000000-0000-0000-0000-000000000001', '{"status":"confirmed"}', '{"status":"received"}', null, 'seed', now() - interval '1 day'),
  ('70000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'sales_order.shipped', 'sales_orders', '30000000-0000-0000-0000-000000000001', '{"status":"confirmed"}', '{"status":"shipped"}', null, 'seed', now() - interval '5 hours'),
  ('70000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'settings.updated', 'settings', null, null, '{"currency":"INR"}', null, 'seed', now() - interval '2 days');

insert into notifications (id, user_id, type, title, message, is_read, entity_type, entity_id, created_at) values
  ('80000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'low_stock', 'Low stock warning', 'NovaScan Wireless Scanner is below reorder point in Mumbai Central Hub.', false, 'products', '10000000-0000-0000-0000-000000000002', now() - interval '12 minutes'),
  ('80000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'reorder', 'Purchase order suggestion', 'Retail Shelf Sensor is below threshold. Suggested replenishment quantity: 180.', false, 'products', '10000000-0000-0000-0000-000000000004', now() - interval '26 minutes'),
  ('80000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'order', 'Shipment dispatched', 'SO-2026-2042 has been shipped with Blue Dart tracking BLUEDART98231.', true, 'sales_orders', '30000000-0000-0000-0000-000000000001', now() - interval '5 hours');

insert into settings (id, key, value, description, updated_by) values
  ('90000000-0000-0000-0000-000000000001', 'company', '{"name":"Smart Inventory Demo Pvt Ltd","email":"ops@example.com","phone":"+91 22 4000 1000"}', 'Company profile shown across documents and exports', '11111111-1111-1111-1111-111111111111'),
  ('90000000-0000-0000-0000-000000000002', 'localization', '{"currency":"INR","timezone":"Asia/Kolkata","dateFormat":"dd MMM yyyy"}', 'Locale and currency preferences', '11111111-1111-1111-1111-111111111111'),
  ('90000000-0000-0000-0000-000000000003', 'alerts', '{"lowStockDefaultThreshold":25,"emailLowStock":true,"emailReturns":false}', 'Notification and alert preferences', '11111111-1111-1111-1111-111111111111');
