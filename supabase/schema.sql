-- Oravie Dental Studio schema. Run once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run), then `npm run db:seed`.

create extension if not exists btree_gist;

create table if not exists doctors (
  id text primary key,
  name text not null,
  specialty text not null,
  languages text[] not null,
  -- 0 = Sunday … 6 = Saturday
  working_days smallint[] not null
);

create table if not exists treatments (
  id text primary key,
  name text not null,
  from_price_aed integer not null check (from_price_aed >= 0),
  minutes integer not null check (minutes > 0),
  -- null: any available doctor (emergency visits)
  doctor_id text references doctors (id)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^OR-[0-9]{4}$'),
  patient_name text not null check (char_length(patient_name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 20),
  treatment_id text not null references treatments (id),
  doctor_id text not null references doctors (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  source text not null check (source in ('noor', 'staff')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- A doctor can never hold two overlapping live bookings, even if two
  -- patients confirm the same slot at the same moment.
  constraint bookings_no_overlap exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'booked')
);

create index if not exists bookings_starts_at_idx on bookings (starts_at);

-- Row Level Security on, with no public policies: only the server (service
-- role key, never sent to the browser) can read or write these tables.
alter table doctors enable row level security;
alter table treatments enable row level security;
alter table bookings enable row level security;
