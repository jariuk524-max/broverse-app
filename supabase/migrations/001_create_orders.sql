create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  service_name text not null default '',
  client_name text,
  client_phone text,
  address text not null default '',
  lat double precision,
  lng double precision,
  status text not null default 'pending',
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

create policy "Allow anonymous inserts" on orders
  for insert with check (true);

create policy "Allow anonymous reads" on orders
  for select using (true);

create policy "Allow anonymous updates" on orders
  for update using (true);

alter publication supabase_realtime add table orders;
