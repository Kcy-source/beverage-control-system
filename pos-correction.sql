-- POS 错单更正：支持「品项开错」与「数量开错」。
-- Supabase > SQL Editor > New query > 粘贴整段 > Run

create extension if not exists pgcrypto;

alter table public.inventory_logs
  add column if not exists correction_ref uuid;

create index if not exists inventory_logs_correction_ref_idx
  on public.inventory_logs(correction_ref);

-- 品项开错：例如实际喝可乐，但 POS 开成雪碧。
create or replace function public.correct_pos_inventory(
  p_wrong_item uuid,
  p_actual_item uuid,
  p_qty numeric,
  p_wrong_location text,
  p_actual_location text,
  p_operation_date date,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  wrong_row public.inventory_items%rowtype;
  actual_row public.inventory_items%rowtype;
  wrong_f numeric;
  wrong_w numeric;
  actual_f numeric;
  actual_w numeric;
  ref uuid := gen_random_uuid();
  email text := coalesce(auth.jwt()->>'email','');
  wrong_loc_name text;
  actual_loc_name text;
begin
  if not public.is_app_active() then raise exception '此账号已停用'; end if;
  if p_wrong_item is null or p_actual_item is null then raise exception '请选择两种饮料'; end if;
  if p_wrong_item = p_actual_item then raise exception 'POS 开错饮料与实际饮料不能相同'; end if;
  if p_qty is null or p_qty <= 0 then raise exception '数量必须大于 0'; end if;
  if p_wrong_location not in ('fridge','warehouse') or p_actual_location not in ('fridge','warehouse') then raise exception '库存位置无效'; end if;
  if p_operation_date is null then raise exception '请选择日期'; end if;

  select * into wrong_row from public.inventory_items where id=p_wrong_item for update;
  if not found then raise exception '找不到 POS 开错的饮料'; end if;
  select * into actual_row from public.inventory_items where id=p_actual_item for update;
  if not found then raise exception '找不到实际饮用的饮料'; end if;

  wrong_f := coalesce(wrong_row.fridge_quantity,0);
  wrong_w := coalesce(wrong_row.warehouse_quantity,0);
  actual_f := coalesce(actual_row.fridge_quantity,0);
  actual_w := coalesce(actual_row.warehouse_quantity,0);

  if p_wrong_location='fridge' then wrong_f := wrong_f + p_qty; wrong_loc_name := '冰箱';
  else wrong_w := wrong_w + p_qty; wrong_loc_name := '仓库'; end if;

  if p_actual_location='fridge' then
    if actual_f < p_qty then raise exception '实际饮料冰箱库存不足，当前只有 %', actual_f; end if;
    actual_f := actual_f - p_qty; actual_loc_name := '冰箱';
  else
    if actual_w < p_qty then raise exception '实际饮料仓库库存不足，当前只有 %', actual_w; end if;
    actual_w := actual_w - p_qty; actual_loc_name := '仓库';
  end if;

  update public.inventory_items set fridge_quantity=wrong_f,warehouse_quantity=wrong_w,quantity=wrong_f+wrong_w,updated_at=now() where id=wrong_row.id;
  update public.inventory_items set fridge_quantity=actual_f,warehouse_quantity=actual_w,quantity=actual_f+actual_w,updated_at=now() where id=actual_row.id;

  insert into public.inventory_logs(item_id,item_name,action,quantity,note,user_email,operation_date,correction_ref)
  values(wrong_row.id,wrong_row.name,'IN',p_qty,
    wrong_loc_name||'｜错单更正｜品项错误｜POS 开成「'||wrong_row.name||'」，实际「'||actual_row.name||'」｜恢复误扣'||case when coalesce(p_note,'')<>'' then '｜'||p_note else '' end,
    email,p_operation_date,ref);

  insert into public.inventory_logs(item_id,item_name,action,quantity,note,user_email,operation_date,correction_ref)
  values(actual_row.id,actual_row.name,'OUT',p_qty,
    actual_loc_name||'｜错单更正｜品项错误｜POS 开成「'||wrong_row.name||'」，实际「'||actual_row.name||'」｜补扣实际'||case when coalesce(p_note,'')<>'' then '｜'||p_note else '' end,
    email,p_operation_date,ref);

  return jsonb_build_object('ok',true,'correction_ref',ref,'type','item','wrong_item',wrong_row.name,'actual_item',actual_row.name,'quantity',p_qty);
end;
$$;

grant execute on function public.correct_pos_inventory(uuid,uuid,numeric,text,text,date,text) to authenticated;

-- 数量开错：不需要知道是哪张单，只记录盘点时发现实际库存多/少几瓶。
create or replace function public.correct_pos_quantity_difference(
  p_item uuid,
  p_difference numeric,
  p_difference_type text,
  p_location text,
  p_operation_date date,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  i public.inventory_items%rowtype;
  f numeric;
  w numeric;
  ref uuid := gen_random_uuid();
  email text := coalesce(auth.jwt()->>'email','');
  loc_name text;
  act text;
  reason text;
begin
  if not public.is_app_active() then raise exception '此账号已停用'; end if;
  if p_item is null then raise exception '请选择饮料'; end if;
  if p_difference is null or p_difference <= 0 then raise exception '差异数量必须大于 0'; end if;
  if p_difference_type not in ('extra','short') then raise exception '差异类型无效'; end if;
  if p_location not in ('fridge','warehouse') then raise exception '库存位置无效'; end if;
  if p_operation_date is null then raise exception '请选择日期'; end if;

  select * into i from public.inventory_items where id=p_item for update;
  if not found then raise exception '找不到饮料'; end if;

  f := coalesce(i.fridge_quantity,0);
  w := coalesce(i.warehouse_quantity,0);
  loc_name := case when p_location='fridge' then '冰箱' else '仓库' end;

  if p_difference_type='extra' then
    act := 'IN'; reason := '实际库存多';
    if p_location='fridge' then f := f + p_difference; else w := w + p_difference; end if;
  else
    act := 'OUT'; reason := '实际库存少';
    if p_location='fridge' then
      if f < p_difference then raise exception '冰箱库存不足，当前只有 %', f; end if;
      f := f - p_difference;
    else
      if w < p_difference then raise exception '仓库库存不足，当前只有 %', w; end if;
      w := w - p_difference;
    end if;
  end if;

  update public.inventory_items
  set fridge_quantity=f,warehouse_quantity=w,quantity=f+w,updated_at=now()
  where id=i.id;

  insert into public.inventory_logs(item_id,item_name,action,quantity,note,user_email,operation_date,correction_ref)
  values(
    i.id,i.name,act,p_difference,
    loc_name||'｜错单更正｜数量错误｜'||reason||'｜差异 '||p_difference||case when coalesce(p_note,'')<>'' then '｜'||p_note else '' end,
    email,p_operation_date,ref
  );

  return jsonb_build_object('ok',true,'correction_ref',ref,'type','quantity','item',i.name,'difference',p_difference,'difference_type',p_difference_type,'action',act);
end;
$$;

grant execute on function public.correct_pos_quantity_difference(uuid,numeric,text,text,date,text) to authenticated;

-- 保留旧函数，避免旧页面缓存暂时失效。
create or replace function public.correct_pos_quantity(
  p_item uuid,
  p_pos_qty numeric,
  p_actual_qty numeric,
  p_location text,
  p_operation_date date,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pos_qty is null or p_actual_qty is null or p_pos_qty = p_actual_qty then
    raise exception 'POS 数量与实际数量相同，无需调整';
  end if;
  return public.correct_pos_quantity_difference(
    p_item,
    abs(p_pos_qty-p_actual_qty),
    case when p_pos_qty>p_actual_qty then 'extra' else 'short' end,
    p_location,
    p_operation_date,
    p_note
  );
end;
$$;

grant execute on function public.correct_pos_quantity(uuid,numeric,numeric,text,date,text) to authenticated;

-- 撤销一整组错单更正；适用于品项错误与数量错误。
create or replace function public.undo_pos_correction(p_correction_ref uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.inventory_logs%rowtype;
  i public.inventory_items%rowtype;
  f numeric;
  w numeric;
  count_logs int := 0;
begin
  if not public.is_app_active() then raise exception '此账号已停用'; end if;
  if p_correction_ref is null then raise exception '缺少更正编号'; end if;

  for l in select * from public.inventory_logs where correction_ref=p_correction_ref order by id for update loop
    count_logs := count_logs + 1;
    if l.item_id is null then raise exception '更正记录对应饮料不存在'; end if;
    select * into i from public.inventory_items where id=l.item_id for update;
    if not found then raise exception '找不到对应饮料'; end if;
    f := coalesce(i.fridge_quantity,0); w := coalesce(i.warehouse_quantity,0);

    if l.action='IN' then
      if coalesce(l.note,'') like '冰箱｜%' then
        if f < l.quantity then raise exception '当前冰箱库存不足以撤销错单更正'; end if;
        f := f-l.quantity;
      elsif coalesce(l.note,'') like '仓库｜%' then
        if w < l.quantity then raise exception '当前仓库库存不足以撤销错单更正'; end if;
        w := w-l.quantity;
      else raise exception '无法识别库存位置'; end if;
    elsif l.action='OUT' then
      if coalesce(l.note,'') like '冰箱｜%' then f := f+l.quantity;
      elsif coalesce(l.note,'') like '仓库｜%' then w := w+l.quantity;
      else raise exception '无法识别库存位置'; end if;
    else
      raise exception '错单更正记录格式异常';
    end if;

    update public.inventory_items set fridge_quantity=f,warehouse_quantity=w,quantity=f+w,updated_at=now() where id=i.id;
  end loop;

  if count_logs=0 then raise exception '找不到该错单更正记录'; end if;
  delete from public.inventory_logs where correction_ref=p_correction_ref;
  return jsonb_build_object('ok',true,'deleted_logs',count_logs);
end;
$$;

grant execute on function public.undo_pos_correction(uuid) to authenticated;
