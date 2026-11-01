create table if not exists public.chess_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  rating int default 1500,
  wins int default 0,
  losses int default 0,
  draws int default 0,
  updated_at timestamp with time zone default now()
);

create table if not exists public.chess_matches (
  id uuid default gen_random_uuid() primary key,
  white_id uuid references public.chess_profiles(id),
  white_name text,
  white_rating int,
  black_id uuid references public.chess_profiles(id),
  black_name text,
  black_rating int,
  time_control int default 600,
  fen text default 'start',
  pgn text default '',
  status text default 'waiting',
  winner_id uuid,
  result_reason text,
  created_at timestamp with time zone default now()
);

alter table public.chess_profiles enable row level security;
alter table public.chess_matches enable row level security;

create policy "Public read profiles" on public.chess_profiles for select using (true);
create policy "Users insert own profile" on public.chess_profiles for insert with check (auth.uid() = id);
create policy "Users update profiles" on public.chess_profiles for update using (true);

create policy "Public read matches" on public.chess_matches for select using (true);
create policy "Auth users create matches" on public.chess_matches for insert with check (auth.role() = 'authenticated');
create policy "Auth users update matches" on public.chess_matches for update using (auth.role() = 'authenticated');

alter publication supabase_realtime add table public.chess_matches;
