-- Enable PostGIS for location features (optional but good for future)
-- create extension if not exists postgis;

-- 1. Profiles (Extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  phone text unique,
  role text check (role in ('PASSENGER', 'DRIVER', 'FLEET')) default 'PASSENGER',
  first_name text,
  last_name text,
  avatar_url text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Drivers (Live Location & Status)
create table public.drivers (
  id uuid references public.profiles(id) primary key,
  is_online boolean default false,
  lat double precision,
  lng double precision,
  last_seen timestamp with time zone default now(),
  document_status text check (document_status in ('PENDING', 'APPROVED', 'REJECTED')) default 'PENDING',
  license_url text,
  id_card_url text,
  rating decimal default 5.0,
  total_trips int default 0
);

-- 3. Trips (Realtime Trip Data)
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  passenger_id uuid references public.profiles(id) not null,
  driver_id uuid references public.drivers(id), -- Nullable initially
  status text check (status in ('REQUESTING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) default 'REQUESTING',
  
  origin_address text not null,
  destination_address text not null,
  price money not null,
  distance_km decimal,
  duration_min int,
  
  cancellation_reason text,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policies (Simplified for MVP)
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.trips enable row level security;

-- EVERYONE CAN READ/WRITE (For MVP speed/testing. Secure later.)
create policy "Public Usage" on public.profiles for all using (true);
create policy "Public Usage" on public.drivers for all using (true);
create policy "Public Usage" on public.trips for all using (true);

-- Realtime
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.drivers;

-- 4. Messages (Trip Chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table public.messages enable row level security;
create policy "Public Usage" on public.messages for all using (true);
alter publication supabase_realtime add table public.messages;

-- 5. Vehicles
create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  plate text unique not null,
  model text not null,
  year int,
  type text check (type in ('ECONOMY', 'COMFORT', 'XL', 'BIKE', 'PACKAGE', 'TRUCK')) default 'ECONOMY',
  created_at timestamp with time zone default now()
);

-- 6. Assignments (Driver x Vehicle)
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.drivers(id) not null,
  vehicle_id uuid references public.vehicles(id) not null,
  status text check (status in ('ACTIVE', 'ENDED')) default 'ACTIVE',
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone
);

alter table public.vehicles enable row level security;
alter table public.assignments enable row level security;
create policy "Public Usage" on public.vehicles for all using (true);
create policy "Public Usage" on public.assignments for all using (true);
alter publication supabase_realtime add table public.vehicles;
alter publication supabase_realtime add table public.assignments;
