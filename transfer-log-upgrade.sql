-- 让“移库”可以正常写入操作记录
-- Supabase > SQL Editor > New query > 粘贴整段 > Run

alter table public.inventory_logs
  drop constraint if exists inventory_logs_action_check;

alter table public.inventory_logs
  add constraint inventory_logs_action_check
  check (action in ('IN','OUT','ADJUST','CREATE','EDIT','TRANSFER'));
