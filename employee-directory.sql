-- 所有登录账号共用的销售提成员工名单
create extension if not exists pgcrypto;

create table if not exists public.commission_employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by text
);

create unique index if not exists commission_employees_name_unique
on public.commission_employees (lower(trim(name)));

alter table public.commission_employees enable row level security;

drop policy if exists "commission_employees_select_authenticated" on public.commission_employees;
create policy "commission_employees_select_authenticated"
on public.commission_employees
for select
to authenticated
using (true);

drop policy if exists "commission_employees_insert_authenticated" on public.commission_employees;
create policy "commission_employees_insert_authenticated"
on public.commission_employees
for insert
to authenticated
with check (char_length(trim(name)) > 0);

drop policy if exists "commission_employees_delete_authenticated" on public.commission_employees;
create policy "commission_employees_delete_authenticated"
on public.commission_employees
for delete
to authenticated
using (true);

grant select, insert, delete on public.commission_employees to authenticated;
