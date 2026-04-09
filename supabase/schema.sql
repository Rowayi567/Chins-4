-- Chins - Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard - SQL Editor)

-- profiles
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text,
  display_name    text,
  vibe            text,
  looking_for     text,
  interests       text[],
  energy          text,
  depth           text,
  social_goal     text,
  life_stage      text,
  comm_style      text,
  humour          text,
  privacy_mode    text default 'discoverable',
  city            text,
  area            text,
  chip_animal     jsonb,
  reed_complete   boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-create profile row when user signs up (prevents upsert failures)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- connections
create table if not exists public.connections (
  id          uuid primary key default gen_random_uuid(),
  user1_id    uuid not null references public.profiles(id) on delete cascade,
  user2_id    uuid not null references public.profiles(id) on delete cascade,
  status      text default 'pending',
  created_at  timestamptz default now(),
  unique (user1_id, user2_id)
);

-- conversations
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user1_id    uuid not null references public.profiles(id) on delete cascade,
  user2_id    uuid not null references public.profiles(id) on delete cascade,
  last_msg    text,
  last_msg_at timestamptz,
  created_at  timestamptz default now(),
  unique (user1_id, user2_id)
);

-- messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text,
  type            text default 'text',
  duration_s      integer,
  photo_url       text,
  created_at      timestamptz default now()
);

-- events (plans)
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  date        date,
  time_label  text,
  location    text,
  city        text,
  area        text,
  category    text default 'social',
  reed_note   text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists public.event_attendees (
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  joined_at   timestamptz default now(),
  primary key (event_id, user_id)
);

-- reed_usage
create table if not exists public.reed_usage (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  date          date not null,
  message_count integer default 1,
  primary key (user_id, date)
);

create or replace function public.increment_reed_usage(p_user_id uuid, p_date date)
returns void language plpgsql as $$
begin
  insert into public.reed_usage (user_id, date, message_count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date) do update
    set message_count = reed_usage.message_count + 1;
end;
$$;

-- spark starters
create table if not exists public.starters (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references public.profiles(id) on delete set null,
  body         text not null,
  share_age    boolean default false,
  share_gender boolean default false,
  is_anon      boolean default true,
  likes        integer default 0,
  created_at   timestamptz default now()
);

-- Row Level Security
alter table public.profiles        enable row level security;
alter table public.connections     enable row level security;
alter table public.conversations   enable row level security;
alter table public.messages        enable row level security;
alter table public.events          enable row level security;
alter table public.event_attendees enable row level security;
alter table public.reed_usage      enable row level security;
alter table public.starters        enable row level security;

-- profiles RLS
create policy "read discoverable profiles" on public.profiles for select using (privacy_mode = 'discoverable' or id = auth.uid());
create policy "update own profile"         on public.profiles for update using (id = auth.uid());
create policy "insert own profile"         on public.profiles for insert with check (id = auth.uid());

-- connections RLS
create policy "see own connections" on public.connections for select using (user1_id = auth.uid() or user2_id = auth.uid());
create policy "create connection"   on public.connections for insert with check (user1_id = auth.uid());
create policy "update connection"   on public.connections for update using (user1_id = auth.uid() or user2_id = auth.uid());

-- conversations RLS
create policy "see own conversations" on public.conversations for select using (user1_id = auth.uid() or user2_id = auth.uid());
create policy "create conversation"   on public.conversations for insert with check (user1_id = auth.uid() or user2_id = auth.uid());
create policy "update conversation"   on public.conversations for update using (user1_id = auth.uid() or user2_id = auth.uid());

-- messages RLS
create policy "see conversation messages" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "send message" on public.messages for insert with check (sender_id = auth.uid());

-- events RLS
create policy "read events"    on public.events          for select using (auth.uid() is not null);
create policy "create event"   on public.events          for insert with check (auth.uid() is not null);
create policy "attend event"   on public.event_attendees for insert with check (user_id = auth.uid());
create policy "leave event"    on public.event_attendees for delete using (user_id = auth.uid());
create policy "read attendees" on public.event_attendees for select using (auth.uid() is not null);

-- reed_usage RLS
create policy "own reed usage" on public.reed_usage for all using (user_id = auth.uid());

-- starters RLS
create policy "read starters"  on public.starters for select using (auth.uid() is not null);
create policy "create starter" on public.starters for insert with check (author_id = auth.uid() or is_anon = true);
