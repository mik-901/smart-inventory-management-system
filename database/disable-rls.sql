-- ─────────────────────────────────────────────────────────────────
-- Disable RLS on all tables
-- 
-- Our Express API handles authentication and authorization via
-- JWT + RBAC middleware. Supabase RLS is not needed and blocks
-- all queries when no policies are defined.
--
-- Run this in Supabase SQL Editor ONCE.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_history DISABLE ROW LEVEL SECURITY;
