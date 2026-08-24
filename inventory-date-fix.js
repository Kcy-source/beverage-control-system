// 强制库存操作把用户选择的日期直接写入 inventory_logs.operation_date。
(function(){
  let installed=false;
  function wait(){
    if(typeof sb==='undefined'||typeof items==='undefined'||typeof saveStock!=='function'||typeof saveItem!=='function'||typeof fridge!=='function'||typeof warehouse!=='function'||typeof userEmail!=='function'){
      setTimeout(wait,120);return;
    }
    install();
  }
  function selected(id){return document.getElementById(id)?.value||'';}
  function install(){
    if(installed)return;installed=true;

    saveStock=async function(){
      const x=items.find(i=>i.id===stockItemId);if(!x)return;
      const date=selected('stockOperationDate');
      if(!date)return alert('请选择日期');
      const action=document.getElementById('stockAction').value;
      const loc=document.getElementById('stockLocation').value;
      const qty=Number(document.getElementById('stockQty').value);
      if(!Number.isFinite(qty)||qty<0)return alert('请输入正确数量');
      const current=loc==='fridge'?fridge(x):warehouse(x);
      let next=current;
      if(action==='IN')next+=qty;
      if(action==='OUT'){
        if(qty>current)return alert((loc==='fridge'?'冰箱':'仓库')+'库存不足');
        next-=qty;
      }
      if(action==='ADJUST')next=qty;
      const update=loc==='fridge'?{fridge_quantity:next,updated_at:new Date().toISOString()}:{warehouse_quantity:next,updated_at:new Date().toISOString()};
      const u=await sb.from('inventory_items').update(update).eq('id',x.id);
      if(u.error)return alert('库存更新失败：'+u.error.message);
      const locationName=loc==='fridge'?'冰箱':'仓库';
      const note=(document.getElementById('stockNote').value||'').trim();
      const l=await sb.from('inventory_logs').insert({
        item_id:x.id,
        item_name:x.name,
        action,
        quantity:qty,
        note:`${locationName}｜${note}`,
        user_email:userEmail(),
        operation_date:date
      });
      if(l.error){
        alert('库存已更新，但日期记录失败：'+l.error.message+'。请确认已运行 operation-date-upgrade.sql。');
        return;
      }
      document.getElementById('stockDialog').close();
      await loadAll();
    };

    saveItem=async function(){
      const date=selected('itemOperationDate');
      if(!date)return alert('请选择日期');
      const fq=Number(document.getElementById('itemFridgeQty').value||0);
      const wq=Number(document.getElementById('itemWarehouseQty').value||0);
      const p={
        name:document.getElementById('itemName').value.trim(),
        category:document.getElementById('itemCategory').value,
        spec:document.getElementById('itemSpec').value.trim(),
        unit:document.getElementById('itemUnit').value.trim()||'瓶',
        fridge_quantity:fq,
        warehouse_quantity:wq,
        quantity:fq+wq,
        min_quantity:Number(document.getElementById('itemMin').value||0),
        cost_price:Number(document.getElementById('itemCost').value||0),
        commission_per_unit:Number(document.getElementById('itemCommission').value||0),
        updated_at:new Date().toISOString()
      };
      if(!p.name)return alert('请输入名称');
      const isEdit=!!editingId;
      const r=isEdit?await sb.from('inventory_items').update(p).eq('id',editingId).select().single():await sb.from('inventory_items').insert(p).select().single();
      if(r.error)return alert('保存失败：'+r.error.message);
      const l=await sb.from('inventory_logs').insert({
        item_id:r.data.id,
        item_name:r.data.name,
        action:isEdit?'EDIT':'CREATE',
        quantity:fq+wq,
        note:isEdit?`编辑资料（冰箱 ${fq} / 仓库 ${wq}）`:`新增饮料（冰箱 ${fq} / 仓库 ${wq}）`,
        user_email:userEmail(),
        operation_date:date
      });
      if(l.error)alert('资料已保存，但日期记录失败：'+l.error.message);
      document.getElementById('itemDialog').close();
      await loadAll();
    };
  }
  wait();
})();