-- NOW Agency CRM - Supabase SQL
-- Pega todo esto en Supabase > SQL Editor > Run

create extension if not exists "pgcrypto";

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  created_at timestamptz default now(),
  nombre text,
  empresa text,
  telefono text,
  email text,
  instagram text,
  servicio text,
  estado text
);

create table if not exists facturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  created_at timestamptz default now(),
  numero text,
  cliente text,
  concepto text,
  base numeric default 0,
  igic numeric default 7,
  estado text
);

create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  created_at timestamptz default now(),
  cliente text,
  servicio text,
  importe numeric default 0,
  fecha date,
  estado text
);

create table if not exists proyectos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  created_at timestamptz default now(),
  proyecto text,
  cliente text,
  tipo text,
  fecha date,
  estado text,
  notas text
);

create table if not exists rrss (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  created_at timestamptz default now(),
  cliente text,
  instagram text,
  pack text,
  posts numeric default 0,
  reels numeric default 0,
  estado text
);

create table if not exists accesos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  created_at timestamptz default now(),
  cliente text,
  instagram text,
  tiktok text,
  facebook text,
  email text,
  notas text
);

alter table clientes enable row level security;
alter table facturas enable row level security;
alter table pagos enable row level security;
alter table proyectos enable row level security;
alter table rrss enable row level security;
alter table accesos enable row level security;

drop policy if exists "crud own clientes" on clientes;
drop policy if exists "crud own facturas" on facturas;
drop policy if exists "crud own pagos" on pagos;
drop policy if exists "crud own proyectos" on proyectos;
drop policy if exists "crud own rrss" on rrss;
drop policy if exists "crud own accesos" on accesos;

create policy "crud own clientes" on clientes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crud own facturas" on facturas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crud own pagos" on pagos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crud own proyectos" on proyectos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crud own rrss" on rrss for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crud own accesos" on accesos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
