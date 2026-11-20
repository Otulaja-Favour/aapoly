-- AAPoly · Class Project Assignments
-- Additive migration. Creates namespaced tables so it never touches the existing
-- E-Hub tables (students, admins, attendance, logs, settings, ...).

create table if not exists public.class_projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  repo_folder text,
  difficulty  text,
  tags        text[] default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists public.class_groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  project_id uuid references public.class_projects (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.class_students (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  matric_number text unique not null,
  group_id      uuid references public.class_groups (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists class_students_group_id_idx on public.class_students (group_id);
create index if not exists class_groups_project_id_idx on public.class_groups (project_id);

-- ----- Row Level Security ---------------------------------------------------
alter table public.class_projects enable row level security;
alter table public.class_groups   enable row level security;
alter table public.class_students enable row level security;

-- Public (anon) read + write. The student portal looks people up without a
-- login, and the admin area is gated in the app by a passcode (Vite env), so
-- there is no per-user auth session to rely on here.
drop policy if exists "anon read class_projects" on public.class_projects;
drop policy if exists "anon read class_groups"   on public.class_groups;
drop policy if exists "anon read class_students" on public.class_students;

drop policy if exists "anon write class_projects" on public.class_projects;
drop policy if exists "anon write class_groups"   on public.class_groups;
drop policy if exists "anon write class_students" on public.class_students;

create policy "anon write class_projects" on public.class_projects for all to anon using (true) with check (true);
create policy "anon write class_groups"   on public.class_groups   for all to anon using (true) with check (true);
create policy "anon write class_students" on public.class_students for all to anon using (true) with check (true);

-- Table-level privileges (Postgres GRANTs) must accompany the RLS policies —
-- RLS is evaluated *after* the role passes the table privilege check.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.class_projects to anon;
grant select, insert, update, delete on public.class_groups   to anon;
grant select, insert, update, delete on public.class_students to anon;
