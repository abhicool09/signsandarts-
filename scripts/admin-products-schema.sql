create table if not exists public.admin_products (
  id text primary key,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  name text not null,
  short_name text,
  title text,
  description text,
  category_key text not null default 'custom',
  category text not null default 'Custom / Any Shop',
  price integer not null default 0 check (price >= 0),
  brand text not null default 'Signs and Arts',
  badge text,
  images jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_products_status_idx
  on public.admin_products (status);

create index if not exists admin_products_published_at_idx
  on public.admin_products (published_at desc);

alter table public.admin_products enable row level security;
