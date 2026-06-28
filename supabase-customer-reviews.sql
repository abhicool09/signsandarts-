create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  product text,
  description text not null,
  image_url text not null,
  image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.customer_reviews enable row level security;

drop policy if exists "Public can read approved customer reviews" on public.customer_reviews;
create policy "Public can read approved customer reviews"
on public.customer_reviews
for select
using (status = 'approved');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  1677722,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view customer review photos" on storage.objects;
create policy "Public can view customer review photos"
on storage.objects
for select
using (bucket_id = 'review-photos');
