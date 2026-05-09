create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('SUPER_ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'VIEWER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('PURCHASE', 'SALE', 'TRANSFER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('DRAFT', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'CANCELLED', 'RETURNED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('INWARD', 'OUTWARD', 'TRANSFER', 'ADJUSTMENT', 'DAMAGED', 'RETURN');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique,
  name text not null,
  email text not null unique,
  password_hash text,
  role user_role not null default 'VIEWER',
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  lead_time_days integer not null default 7,
  rating numeric(3, 2) not null default 4.50,
  created_at timestamptz not null default now()
);

create table if not exists warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  city text not null,
  address text,
  manager_id uuid references users(id),
  capacity integer not null default 0,
  utilization numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text not null unique,
  category text not null,
  brand text,
  price numeric(12, 2) not null check (price >= 0),
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  barcode text,
  qr_payload text,
  variants jsonb not null default '[]'::jsonb,
  batch_number text,
  expiry_date text,
  reorder_level integer not null default 10,
  supplier text,
  image_url text,
  stock integer not null default 0,
  status text not null default 'Low Stock',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  damaged_quantity integer not null default 0 check (damaged_quantity >= 0),
  updated_at timestamptz not null default now(),
  unique(product_id, warehouse_id)
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  type order_type not null,
  status order_status not null default 'DRAFT',
  source_warehouse_id uuid references warehouses(id),
  destination_warehouse_id uuid references warehouses(id),
  supplier text,
  customer text,
  items integer not null default 0,
  total_amount numeric(12, 2) not null default 0,
  created_by uuid references users(id),
  expected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  amount numeric(12, 2) generated always as (quantity * unit_price) stored
);

create table if not exists returns (
  id uuid primary key default uuid_generate_v4(),
  return_number text not null unique,
  order_id uuid references orders(id),
  warehouse_id uuid references warehouses(id),
  reason text not null,
  status text not null default 'PENDING',
  total_items integer not null default 0,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id),
  warehouse_id uuid references warehouses(id),
  from_warehouse_id uuid references warehouses(id),
  to_warehouse_id uuid references warehouses(id),
  order_id uuid references orders(id),
  type transaction_type not null,
  quantity integer not null,
  reason text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_value jsonb,
  after_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  title text not null,
  message text not null,
  type text not null default 'INFO',
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists login_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_search on products using gin (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(category, '') || ' ' || coalesce(brand, ''))
);
create index if not exists idx_inventory_product on inventory(product_id);
create index if not exists idx_inventory_warehouse on inventory(warehouse_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_transactions_product_time on transactions(product_id, created_at desc);
create index if not exists idx_audit_logs_time on audit_logs(created_at desc);
create index if not exists idx_notifications_user_read on notifications(user_id, is_read);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at before update on users for each row execute function set_updated_at();

drop trigger if exists warehouses_set_updated_at on warehouses;
create trigger warehouses_set_updated_at before update on warehouses for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products for each row execute function set_updated_at();

drop trigger if exists inventory_set_updated_at on inventory;
create trigger inventory_set_updated_at before update on inventory for each row execute function set_updated_at();

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at before update on orders for each row execute function set_updated_at();

-- RLS is DISABLED because our Express API handles all authentication
-- and authorization via JWT tokens + RBAC middleware (requirePermission).
-- Enabling RLS without policies blocks ALL database operations.
alter table users disable row level security;
alter table suppliers disable row level security;
alter table warehouses disable row level security;
alter table products disable row level security;
alter table inventory disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;
alter table returns disable row level security;
alter table transactions disable row level security;
alter table audit_logs disable row level security;
alter table notifications disable row level security;
alter table login_history disable row level security;

