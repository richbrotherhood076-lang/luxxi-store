-- Jalankan seluruh SQL ini di Supabase > SQL Editor > New query.
-- Buat user terlebih dahulu di Authentication > Users, lalu salin UUID-nya ke langkah README.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  class_name text not null default '',
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null default (timezone('Asia/Jakarta', now())::date),
  status text not null check (status in ('hadir','sakit','izin','alpa')),
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, attendance_date)
);

create index if not exists attendance_date_idx on public.attendance(attendance_date);
create index if not exists attendance_student_date_idx on public.attendance(student_id, attendance_date desc);

-- Security-definer helper menghindari policy profiles yang saling memanggil.
create or replace function public.is_school_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "profile read self or admin" on public.profiles;
create policy "profile read self or admin" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_school_admin()));

-- Tidak ada policy insert/update/delete untuk profil dari browser.
-- Admin membuat dan mengubah profil melalui Supabase Dashboard saja.

drop policy if exists "student read own attendance or admin" on public.attendance;
create policy "student read own attendance or admin" on public.attendance
for select to authenticated
using (student_id = (select auth.uid()) or (select public.is_school_admin()));

drop policy if exists "student create own attendance" on public.attendance;
create policy "student create own attendance" on public.attendance
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and status in ('hadir','sakit','izin')
  and attendance_date = (timezone('Asia/Jakarta', now())::date)
);

drop policy if exists "student update own today attendance or admin" on public.attendance;
create policy "student update own today attendance or admin" on public.attendance
for update to authenticated
using (
  (student_id = (select auth.uid()) and attendance_date = (timezone('Asia/Jakarta', now())::date))
  or (select public.is_school_admin())
)
with check (
  (student_id = (select auth.uid()) and attendance_date = (timezone('Asia/Jakarta', now())::date) and status in ('hadir','sakit','izin'))
  or (select public.is_school_admin())
);

-- Tidak memberi hak delete melalui browser. Admin dapat mengoreksi status,
-- tetapi penghapusan data dilakukan lewat dashboard database bila diperlukan.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update on public.attendance to authenticated;
grant execute on function public.is_school_admin() to authenticated;
