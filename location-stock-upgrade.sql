-- 冰箱 + 仓库库存升级
-- Supabase > SQL Editor > New query > 粘贴整段 > Run

alter table public.inventory_items
add column if not exists fridge_quantity numeric not null default 0 check (fridge_quantity >= 0),
add column if not exists warehouse_quantity numeric not null default 0 check (warehouse_quantity >= 0);

-- 旧库存不丢失：第一次升级时，原来的总库存先放到“仓库库存”
update public.inventory_items
set warehouse_quantity = quantity
where fridge_quantity = 0
  and warehouse_quantity = 0
  and quantity > 0;

create or replace function public.sync_inventory_total()
returns trigger
language plpgsql
as $$
begin
  new.quantity := coalesce(new.fridge_quantity,0) + coalesce(new.warehouse_quantity,0);
  return new;
end;
$$;

drop trigger if exists trg_sync_inventory_total on public.inventory_items;
create trigger trg_sync_inventory_total
before insert or update of fridge_quantity, warehouse_quantity
on public.inventory_items
for each row
execute function public.sync_inventory_total();

-- 立即校正现有总库存
update public.inventory_items
set quantity = fridge_quantity + warehouse_quantity;
