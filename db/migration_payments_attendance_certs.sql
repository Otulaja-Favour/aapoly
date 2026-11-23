-- AAPoly · Additive migration for payments, attendance, project approval, certificates, signatures.
-- Safe to run repeatedly (IF NOT EXISTS). Existing rows keep their data.

-- 1) Payment + certificate flags on students
alter table public.class_students
  add column if not exists has_paid boolean not null default false,
  add column if not exists payment_method text,           -- 'company' | 'wunmi' | null
  add column if not exists certificate_approved boolean not null default false;

-- 2) Project completion flag on groups (current-year certificate gate)
alter table public.class_groups
  add column if not exists project_approved boolean not null default false;

-- 3) Attendance — one row per (student, week) for a 12-week program
create table if not exists public.class_attendance (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.class_students (id) on delete cascade,
  week       integer not null check (week between 1 and 12),
  present    boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, week)
);
create index if not exists class_attendance_student_idx on public.class_attendance (student_id);

-- 4) Settings (key/value) — stores uploaded signature images as data URLs and cert text
create table if not exists public.class_settings (
  key   text primary key,
  value text
);

-- RLS + grants for the new table
alter table public.class_attendance enable row level security;
alter table public.class_settings   enable row level security;

drop policy if exists "anon write class_attendance" on public.class_attendance;
drop policy if exists "anon write class_settings"   on public.class_settings;

create policy "anon write class_attendance" on public.class_attendance for all to anon using (true) with check (true);
create policy "anon write class_settings"   on public.class_settings   for all to anon using (true) with check (true);

grant select, insert, update, delete on public.class_attendance to anon;
grant select, insert, update, delete on public.class_settings   to anon;

-- The existing class_students / class_groups grants already cover the new columns.
