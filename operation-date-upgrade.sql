-- Supabase > SQL Editor > New query > 粘贴整段 > Run
-- 给库存操作记录与提成记录增加“业务日期”。

alter table public.inventory_logs
add column if not exists operation_date date;

update public.inventory_logs
set operation_date = (created_at at time zone 'Asia/Singapore')::date
where operation_date is null;

alter table public.inventory_logs
alter column operation_date set default (now() at time zone 'Asia/Singapore')::date;

alter table public.inventory_logs
alter column operation_date set not null;

alter table public.commission_logs
add column if not exists operation_date date;

update public.commission_logs
set operation_date = (created_at at time zone 'Asia/Singapore')::date
where operation_date is null;

alter table public.commission_logs
alter column operation_date set default (now() at time zone 'Asia/Singapore')::date;

alter table public.commission_logs
alter column operation_date set not null;

create index if not exists inventory_logs_operation_date_idx
on public.inventory_logs(operation_date desc);

create index if not exists commission_logs_operation_date_idx
on public.commission_logs(operation_date desc);
