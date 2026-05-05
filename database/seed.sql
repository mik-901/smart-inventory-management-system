insert into users (id, clerk_id, name, email, role, avatar_url, last_login_at) values
  ('11111111-1111-1111-1111-111111111111', 'demo_super_admin', 'Aarav Mehta', 'admin@demo.com', 'SUPER_ADMIN', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160', now()),
  ('22222222-2222-2222-2222-222222222222', 'demo_manager', 'Maya Kapoor', 'manager@demo.com', 'MANAGER', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160', now() - interval '2 hours'),
  ('33333333-3333-3333-3333-333333333333', 'demo_staff', 'Kabir Sethi', 'staff@demo.com', 'WAREHOUSE_STAFF', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160', now() - interval '1 day'),
  ('44444444-4444-4444-4444-444444444444', 'demo_viewer', 'Nisha Rao', 'viewer@demo.com', 'VIEWER', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160', now() - interval '3 days')
on conflict (email) do nothing;

insert into suppliers (id, name, contact_name, email, phone, lead_time_days, rating) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Northstar Components', 'Rohan Bose', 'supply@northstar.example', '+91 98765 10001', 5, 4.80),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Urban Retail Supply', 'Amrita Sen', 'ops@urbanretail.example', '+91 98765 10002', 8, 4.55),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Prime Packaging Co.', 'Dev Nair', 'orders@primepack.example', '+91 98765 10003', 6, 4.35)
on conflict do nothing;

insert into warehouses (id, name, code, city, address, manager_id, capacity, utilization) values
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Mumbai Central Hub', 'MUM-CEN', 'Mumbai', 'Andheri East, Mumbai', '22222222-2222-2222-2222-222222222222', 12000, 76.20),
  ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Delhi North DC', 'DEL-NOR', 'Delhi', 'Okhla Industrial Area, Delhi', '33333333-3333-3333-3333-333333333333', 9000, 63.40),
  ('cccccccc-3333-3333-3333-cccccccccccc', 'Bengaluru South Fulfillment', 'BLR-SOU', 'Bengaluru', 'Electronic City, Bengaluru', '33333333-3333-3333-3333-333333333333', 10500, 82.10)
on conflict (code) do nothing;

insert into products (id, name, sku, category, brand, price, cost_price, barcode, qr_payload, variants, batch_number, expiry_date, reorder_level, supplier_id, image_urls) values
  ('10000000-0000-0000-0000-000000000001', 'AeroTrack RFID Tag Pack', 'SKU-AER-0001', 'Electronics', 'AeroTrack', 1199.00, 650.00, '890100000001', 'SKU-AER-0001', '[{"size":"50-pack","color":"Graphite"}]', 'AT-2404', '2028-04-30', 120, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', array['https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=800']),
  ('10000000-0000-0000-0000-000000000002', 'NovaScan Wireless Scanner', 'SKU-NOV-0002', 'Hardware', 'NovaScan', 8499.00, 5100.00, '890100000002', 'SKU-NOV-0002', '[{"size":"Standard","color":"Black"}]', 'NS-2405', '2029-01-20', 25, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', array['https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800']),
  ('10000000-0000-0000-0000-000000000003', 'ColdChain Label Roll', 'SKU-COL-0003', 'Packaging', 'PrimePack', 449.00, 210.00, '890100000003', 'SKU-COL-0003', '[{"size":"1000 labels","color":"White"}]', 'CC-2402', '2027-08-15', 300, 'cccccccc-cccc-cccc-cccc-cccccccccccc', array['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800']),
  ('10000000-0000-0000-0000-000000000004', 'Retail Shelf Sensor', 'SKU-RET-0004', 'IoT', 'ShelfSense', 3299.00, 1990.00, '890100000004', 'SKU-RET-0004', '[{"size":"Mini","color":"Silver"},{"size":"Pro","color":"Black"}]', 'RS-2401', '2028-11-10', 60, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', array['https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800']),
  ('10000000-0000-0000-0000-000000000005', 'Thermal Printer Ribbon', 'SKU-THE-0005', 'Consumables', 'PrintEdge', 799.00, 360.00, '890100000005', 'SKU-THE-0005', '[{"size":"110mm x 300m","color":"Black"}]', 'TP-2406', '2027-12-01', 180, 'cccccccc-cccc-cccc-cccc-cccccccccccc', array['https://images.unsplash.com/photo-1581091870627-3f619f8d999f?w=800'])
on conflict (sku) do nothing;

insert into inventory (product_id, warehouse_id, quantity, reserved_quantity, damaged_quantity) values
  ('10000000-0000-0000-0000-000000000001', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 420, 30, 4),
  ('10000000-0000-0000-0000-000000000001', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 160, 12, 1),
  ('10000000-0000-0000-0000-000000000002', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 21, 5, 0),
  ('10000000-0000-0000-0000-000000000002', 'cccccccc-3333-3333-3333-cccccccccccc', 44, 8, 1),
  ('10000000-0000-0000-0000-000000000003', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 920, 120, 8),
  ('10000000-0000-0000-0000-000000000004', 'cccccccc-3333-3333-3333-cccccccccccc', 54, 11, 2),
  ('10000000-0000-0000-0000-000000000005', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 175, 32, 3)
on conflict (product_id, warehouse_id) do nothing;

insert into orders (id, order_number, type, status, supplier_id, source_warehouse_id, destination_warehouse_id, customer_name, total_amount, created_by, expected_at) values
  ('20000000-0000-0000-0000-000000000001', 'PO-2026-1001', 'PURCHASE', 'APPROVED', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', null, 125000.00, '22222222-2222-2222-2222-222222222222', now() + interval '4 days'),
  ('20000000-0000-0000-0000-000000000002', 'SO-2026-2042', 'SALE', 'DISPATCHED', null, 'cccccccc-3333-3333-3333-cccccccccccc', null, 'BrightMart Retail', 87950.00, '33333333-3333-3333-3333-333333333333', now() + interval '1 day'),
  ('20000000-0000-0000-0000-000000000003', 'TO-2026-0312', 'TRANSFER', 'RECEIVED', null, 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', null, 0.00, '33333333-3333-3333-3333-333333333333', now() - interval '2 days')
on conflict (order_number) do nothing;

insert into returns (return_number, order_id, warehouse_id, reason, status, total_items, created_by) values
  ('RT-2026-0091', '20000000-0000-0000-0000-000000000002', 'cccccccc-3333-3333-3333-cccccccccccc', 'Damaged during transit', 'INSPECTION', 6, '33333333-3333-3333-3333-333333333333')
on conflict (return_number) do nothing;

insert into transactions (product_id, warehouse_id, from_warehouse_id, to_warehouse_id, order_id, type, quantity, reason, created_by, created_at) values
  ('10000000-0000-0000-0000-000000000001', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', null, null, '20000000-0000-0000-0000-000000000001', 'INWARD', 240, 'Purchase order received', '22222222-2222-2222-2222-222222222222', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000004', 'cccccccc-3333-3333-3333-cccccccccccc', null, null, '20000000-0000-0000-0000-000000000002', 'OUTWARD', 18, 'Sales dispatch', '33333333-3333-3333-3333-333333333333', now() - interval '5 hours'),
  ('10000000-0000-0000-0000-000000000002', null, 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '20000000-0000-0000-0000-000000000003', 'TRANSFER', 12, 'Regional balancing', '33333333-3333-3333-3333-333333333333', now() - interval '2 days');

insert into audit_logs (actor_id, action, entity_type, entity_id, after_value, created_at) values
  ('22222222-2222-2222-2222-222222222222', 'APPROVED_PURCHASE_ORDER', 'orders', '20000000-0000-0000-0000-000000000001', '{"status":"APPROVED"}', now() - interval '3 hours'),
  ('33333333-3333-3333-3333-333333333333', 'ADJUSTED_DAMAGED_STOCK', 'inventory', null, '{"sku":"SKU-RET-0004","quantity":2}', now() - interval '6 hours'),
  ('11111111-1111-1111-1111-111111111111', 'UPDATED_REORDER_LEVEL', 'products', '10000000-0000-0000-0000-000000000002', '{"reorderLevel":25}', now() - interval '1 day');

insert into notifications (user_id, title, message, type, metadata) values
  ('22222222-2222-2222-2222-222222222222', 'Low stock warning', 'NovaScan Wireless Scanner is close to reorder level in Mumbai Central Hub.', 'LOW_STOCK', '{"sku":"SKU-NOV-0002"}'),
  ('11111111-1111-1111-1111-111111111111', 'Purchase order suggestion', 'AI demand forecast suggests creating a PO for ShelfSense Retail Shelf Sensor.', 'REORDER', '{"sku":"SKU-RET-0004","suggestedQuantity":160}');
