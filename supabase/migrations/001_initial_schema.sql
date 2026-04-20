-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  favorite_spots text[] default '{}',
  notification_preferences jsonb default '{"scoreThreshold": 7, "peakWarning": true, "bunkerAlert": true}',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users view own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Spots
create table spots (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  spot_type text not null check (spot_type in ('jetty', 'river_mouth', 'beach_surf', 'bridge', 'rocky_point', 'tidal_flat', 'deep_water', 'inlet')),
  is_default boolean default false,
  created_by uuid references auth.users on delete set null,
  best_tide text, -- 'incoming', 'outgoing', 'slack', 'any'
  best_time text, -- 'dawn', 'dusk', 'night', 'any'
  noaa_station_id text, -- nearest NOAA tide station
  notes text,
  created_at timestamptz default now()
);

alter table spots enable row level security;
create policy "Anyone can view default spots" on spots for select using (is_default = true);
create policy "Authenticated users can view all spots" on spots for select using (auth.uid() is not null);
create policy "Users can create spots" on spots for insert with check (auth.uid() is not null);
create policy "Users can update own spots" on spots for update using (auth.uid() = created_by);
create policy "Users can delete own spots" on spots for delete using (auth.uid() = created_by);

-- Catches
create table catches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  spot_id uuid references spots on delete set null,
  caught_at timestamptz default now(),
  fish_length decimal,
  fish_weight decimal,
  lure_or_bait text,
  tide_stage text,
  water_temp decimal,
  wind_speed decimal,
  wind_direction text,
  barometric_pressure decimal,
  moon_phase text,
  weather_conditions jsonb default '{}',
  photo_url text,
  notes text,
  created_at timestamptz default now()
);

alter table catches enable row level security;
create policy "Users view catches in their crew" on catches for select using (auth.uid() is not null);
create policy "Users insert own catches" on catches for insert with check (auth.uid() = user_id);
create policy "Users update own catches" on catches for update using (auth.uid() = user_id);
create policy "Users delete own catches" on catches for delete using (auth.uid() = user_id);

-- Crews (groups)
create table crews (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_by uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table crews enable row level security;
create policy "Users can create crews" on crews for insert with check (auth.uid() is not null);

-- Crew Members
create table crew_members (
  id uuid default gen_random_uuid() primary key,
  crew_id uuid references crews on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique (crew_id, user_id)
);

alter table crew_members enable row level security;
create policy "Members can view crew members" on crew_members for select using (
  crew_id in (select crew_id from crew_members where user_id = auth.uid())
);
create policy "Users can join crews" on crew_members for insert with check (auth.uid() = user_id);

-- Crew view policy (after crew_members exists)
create policy "Members can view crew" on crews for select using (
  id in (select crew_id from crew_members where user_id = auth.uid())
);

-- Spot Reports (quick intel from crew)
create table spot_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  spot_id uuid references spots on delete cascade,
  report_type text not null check (report_type in ('bunker', 'blitz', 'bait', 'fish_caught', 'conditions', 'general')),
  message text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

alter table spot_reports enable row level security;
create policy "Authenticated users can view reports" on spot_reports for select using (auth.uid() is not null);
create policy "Users can create reports" on spot_reports for insert with check (auth.uid() = user_id);

-- Notification Subscriptions
create table notification_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  spot_id uuid references spots on delete cascade not null,
  score_threshold integer default 7,
  enabled boolean default true,
  unique (user_id, spot_id)
);

alter table notification_subscriptions enable row level security;
create policy "Users manage own subscriptions" on notification_subscriptions for all using (auth.uid() = user_id);
