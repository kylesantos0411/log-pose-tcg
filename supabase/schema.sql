-- =============================================================================
-- LOG POSE TCG - SUPABASE CLOUD DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =============================================================================

-- 1. PUBLIC PROFILES TABLE (Linked directly to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  tag text unique not null,
  email text,
  avatar text default '👒',
  crew text default 'Straw Hat Pirates',
  rank text default 'Cabin Boy',
  rank_badge text default '⚓',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. USER CARDS (PERMANENT CLOUD BINDER & COLLECTION)
create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id text not null,
  quantity integer not null default 1 check (quantity >= 0),
  condition text not null default 'NM',
  is_foil boolean not null default false,
  language text not null default 'en',
  purchase_price numeric,
  purchase_date date,
  notes text,
  is_wishlist boolean not null default false,
  for_trade boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique index to allow clean upserts
create unique index if not exists user_cards_unique_item_idx
  on public.user_cards (user_id, card_id, condition, is_foil, language, is_wishlist);

-- Enable RLS for user_cards
alter table public.user_cards enable row level security;

-- Policies for user_cards
create policy "Users can view their own cards."
  on public.user_cards for select
  using ( auth.uid() = user_id or for_trade = true );

create policy "Users can insert their own cards."
  on public.user_cards for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own cards."
  on public.user_cards for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own cards."
  on public.user_cards for delete
  using ( auth.uid() = user_id );

-- 3. TRIGGER TO AUTOMATICALLY CREATE PROFILE ON GOOGLE / EMAIL SIGN UP
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_username text;
  raw_avatar text;
  raw_crew text;
  generated_tag text;
begin
  -- Extract username from metadata (Google name or email username)
  raw_username := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  raw_avatar := coalesce(new.raw_user_meta_data->>'avatar', '👒');
  raw_crew := coalesce(new.raw_user_meta_data->>'crew', 'Straw Hat Pirates');
  
  -- Generate unique pirate tag
  generated_tag := coalesce(
    new.raw_user_meta_data->>'tag',
    'PIRATE-' || upper(regexp_replace(raw_username, '[^a-zA-Z0-9]', '', 'g')) || '-' || floor(1000 + random() * 9000)::text
  );

  insert into public.profiles (id, username, tag, email, avatar, crew, rank, rank_badge)
  values (
    new.id,
    raw_username,
    generated_tag,
    new.email,
    raw_avatar,
    raw_crew,
    'Cabin Boy',
    '⚓'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
