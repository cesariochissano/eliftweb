-- Create saved_places table for User Favorites (Home, Work, etc.)
create table if not exists public.saved_places (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null, -- 'Casa', 'Trabalho', or custom
    address text not null,
    lat double precision not null,
    lng double precision not null,
    type text default 'other', -- 'home', 'work', 'other'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Policy: Users can only see their own places
alter table public.saved_places enable row level security;

create policy "Users can view own saved places"
on public.saved_places for select
using (auth.uid() = user_id);

create policy "Users can insert own saved places"
on public.saved_places for insert
with check (auth.uid() = user_id);

create policy "Users can delete own saved places"
on public.saved_places for delete
using (auth.uid() = user_id);

-- Force cache refresh
notify pgrst, 'reload config';
