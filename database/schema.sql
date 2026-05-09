create extension if not exists pgcrypto;

drop table if exists notifications cascade;
drop table if exists settings cascade;
drop table if exists audit_logs cascade;
drop table if exists return_items cascade;
drop table if exists returns cascade;
drop table if exists transfer_items cascade;
drop table if exists transfers cascade;
drop table if exists sales_order_items cascade;
drop table if exists sales_orders cascade;
drop table if exists purchase_order_items cascade;
drop table if exists purchase_orders cascade;
drop table if exists stock_movements cascade;
drop table if exists inventory cascade;
drop table if exists product_variants cascade;
drop table if exists products cascade;
drop table if exists suppliers cascade;
drop table if exists categories cascade;
drop table if exists warehouses cascade;
drop table if exists users cascade;

drop type if exists user_role cascade;
drop type if exists stock_movement_type cascade;
drop type if exists purchase_order_status cascade;
drop type if exists sales_order_status cascade;
drop type if exists transfer_status cascade;
drop type if exists return_reference_type cascade;
drop type if exists return_status cascade;
drop type if exists return_item_condition cascade;
drop type if exists return_item_action cascade;

create type user_role as enum ('admin', 'manager', 'staff', 'viewer');
create type stock_movement_type as enum ('purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage');
create type purchase_order_status as enum ('draft', 'sent', 'confirmed', 'received', 'cancelled');
create type sales_order_status as enum ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type transfer_status as enum ('draft', 'in_transit', 'completed', 'cancelled');
create type return_reference_type as enum ('sale', 'purchase');
create type return_status as enum ('pending', 'approved', 'rejected', 'completed');
create type return_item_condition as enum ('good', 'damaged', 'expired');
create type return_item_action as enum ('restock', 'discard', 'return_to_supplier');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role user_role not null default 'viewer',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_format check (position('@' in email) > 1)
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  address text,
  city text not null,
  country text not null default 'India',
  capacity integer not null default 0 check (capacity >= 0),
  manager_id uuid references users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint categories_not_self_parent check (parent_id is null or parent_id <> id)
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  country text not null default 'India',
  payment_terms text,
  lead_time_days integer not null default 7 check (lead_time_days >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  unit_of_measure text not null default 'unit',
  cost_price numeric(14, 2) not null default 0 check (cost_price >= 0),
  selling_price numeric(14, 2) not null default 0 check (selling_price >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  reorder_quantity integer not null default 0 check (reorder_quantity >= 0),
  barcode text,
  qr_code text,
  batch_tracking boolean not null default false,
  expiry_tracking boolean not null default false,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_name text not null,
  sku_suffix text not null,
  attributes jsonb not null default '{}'::jsonb,
  cost_price numeric(14, 2) check (cost_price is null or cost_price >= 0),
  selling_price numeric(14, 2) check (selling_price is null or selling_price >= 0),
  barcode text,
  is_active boolean not null default true,
  unique(product_id, sku_suffix)
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  available_quantity integer generated always as (quantity - reserved_quantity) stored,
  batch_number text not null default '',
  expiry_date date,
  last_counted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(product_id, warehouse_id, batch_number),
  constraint inventory_reserved_not_over_quantity check (reserved_quantity <= quantity)
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  movement_type stock_movement_type not null,
  quantity integer not null check (quantity > 0),
  reference_id uuid,
  reference_type text,
  unit_cost numeric(14, 2) check (unit_cost is null or unit_cost >= 0),
  total_cost numeric(14, 2) check (total_cost is null or total_cost >= 0),
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  status purchase_order_status not null default 'draft',
  order_date date not null default current_date,
  expected_date date,
  received_date date,
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  unit_cost numeric(14, 2) not null check (unit_cost >= 0),
  total_cost numeric(14, 2) generated always as (quantity_ordered * unit_cost) stored,
  constraint po_received_not_over_ordered check (quantity_received <= quantity_ordered)
);

create table sales_orders (
  id uuid primary key default gen_random_uuid(),
  so_number text not null unique,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  status sales_order_status not null default 'draft',
  order_date date not null default current_date,
  shipped_date date,
  delivered_date date,
  tracking_number text,
  carrier_name text,
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sales_order_items (
  id uuid primary key default gen_random_uuid(),
  so_id uuid not null references sales_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  total_price numeric(14, 2) generated always as (quantity * unit_price * (1 - discount_percent / 100.0)) stored,
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100)
);

create table transfers (
  id uuid primary key default gen_random_uuid(),
  transfer_number text not null unique,
  from_warehouse_id uuid not null references warehouses(id) on delete restrict,
  to_warehouse_id uuid not null references warehouses(id) on delete restrict,
  status transfer_status not null default 'draft',
  initiated_by uuid references users(id) on delete set null,
  transfer_date date not null default current_date,
  completed_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfer_distinct_warehouses check (from_warehouse_id <> to_warehouse_id)
);

create table transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references transfers(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity_requested integer not null check (quantity_requested > 0),
  quantity_transferred integer not null default 0 check (quantity_transferred >= 0),
  constraint transfer_transferred_not_over_requested check (quantity_transferred <= quantity_requested)
);

create table returns (
  id uuid primary key default gen_random_uuid(),
  return_number text not null unique,
  reference_type return_reference_type not null,
  reference_id uuid,
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  reason text not null,
  status return_status not null default 'pending',
  total_items integer not null default 0 check (total_items >= 0),
  processed_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references returns(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  condition return_item_condition not null default 'good',
  action return_item_action not null default 'restock'
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index idx_users_role_active on users(role, is_active);
create index idx_warehouses_active_city on warehouses(is_active, city);
create index idx_categories_parent on categories(parent_id);
create index idx_suppliers_search on suppliers using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(contact_person, '') || ' ' || coalesce(email, '')));
create index idx_products_search on products using gin (to_tsvector('english', coalesce(sku, '') || ' ' || coalesce(name, '') || ' ' || coalesce(description, '')));
create index idx_products_category on products(category_id);
create index idx_products_supplier on products(supplier_id);
create index idx_inventory_product on inventory(product_id);
create index idx_inventory_warehouse on inventory(warehouse_id);
create index idx_inventory_expiry on inventory(expiry_date) where expiry_date is not null;
create index idx_stock_movements_product_time on stock_movements(product_id, created_at desc);
create index idx_stock_movements_warehouse_time on stock_movements(warehouse_id, created_at desc);
create index idx_purchase_orders_status_date on purchase_orders(status, order_date desc);
create index idx_sales_orders_status_date on sales_orders(status, order_date desc);
create index idx_transfers_status_date on transfers(status, transfer_date desc);
create index idx_returns_status_time on returns(status, created_at desc);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_time on audit_logs(created_at desc);
create index idx_notifications_user_read on notifications(user_id, is_read, created_at desc);
create index idx_settings_key on settings(key);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_set_updated_at before update on users for each row execute function set_updated_at();
create trigger warehouses_set_updated_at before update on warehouses for each row execute function set_updated_at();
create trigger suppliers_set_updated_at before update on suppliers for each row execute function set_updated_at();
create trigger products_set_updated_at before update on products for each row execute function set_updated_at();
create trigger inventory_set_updated_at before update on inventory for each row execute function set_updated_at();
create trigger purchase_orders_set_updated_at before update on purchase_orders for each row execute function set_updated_at();
create trigger sales_orders_set_updated_at before update on sales_orders for each row execute function set_updated_at();
create trigger transfers_set_updated_at before update on transfers for each row execute function set_updated_at();
create trigger returns_set_updated_at before update on returns for each row execute function set_updated_at();
create trigger settings_set_updated_at before update on settings for each row execute function set_updated_at();

alter table users disable row level security;
alter table warehouses disable row level security;
alter table categories disable row level security;
alter table suppliers disable row level security;
alter table products disable row level security;
alter table product_variants disable row level security;
alter table inventory disable row level security;
alter table stock_movements disable row level security;
alter table purchase_orders disable row level security;
alter table purchase_order_items disable row level security;
alter table sales_orders disable row level security;
alter table sales_order_items disable row level security;
alter table transfers disable row level security;
alter table transfer_items disable row level security;
alter table returns disable row level security;
alter table return_items disable row level security;
alter table audit_logs disable row level security;
alter table notifications disable row level security;
alter table settings disable row level security;
