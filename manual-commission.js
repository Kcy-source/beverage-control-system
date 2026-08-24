// 员工销售与提成改为手动录入：日期、员工、饮料、数量、提成与备注。
(function () {
  'use strict';
  let installed = false;
  function todaySG() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }); }
  function recordDate(row) { return row.operation_date || new Date(row.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }); }
  function waitForApp() {
    const ready = typeof sb !== 'undefined' && typeof items !== 'undefined' && typeof commissions !== 'undefined' && typeof render === 'function' && typeof loadAll === 'function' && typeof openStock === 'function' && document.getElementById('commission') && document.getElementById('commissionBody');
    const dateFeatureReady = document.getElementById('itemOperationDate');
    if (!ready || !dateFeatureReady) { setTimeout(waitForApp, 150); return; }
    install();
  }
  function install() {
    if (installed) return; installed = true;
    disableAutomaticCommissionOnStockOut();
    buildManualCommissionUI();
    const originalRender = render;
    render = function () { originalRender(); refreshManualCommissionUI(); };
    refreshManualCommissionUI();
  }
  function disableAutomaticCommissionOnStockOut() {
    function hideSellerField() {
      const wrap = document.getElementById('sellerWrap');
      const input = document.getElementById('stockSeller');
      if (wrap) { wrap.classList.add('hidden'); wrap.style.display = 'none'; }
      if (input) input.value = '';
    }
    const originalOpenStock = openStock;
    openStock = function (id, action) { originalOpenStock(id, action); hideSellerField(); };
    const actionSelect = document.getElementById('stockAction');
    if (actionSelect) actionSelect.onchange = hideSellerField;
    hideSellerField();
    const stockDialog = document.getElementById('stockDialog');
    if (stockDialog && !document.getElementById('manualCommissionStockHint')) {
      const hint = document.createElement('div');
      hint.id = 'manualCommissionStockHint'; hint.className = 'hint'; hint.style.marginTop = '10px';
      hint.textContent = '这里的出库只调整库存。员工卖了什么，请到“员工提成”页面手动录入。';
      const footer = stockDialog.querySelector('.modalfooter');
      if (footer) footer.parentElement.insertBefore(hint, footer);
    }
  }
  function buildManualCommissionUI() {
    const section = document.getElementById('commission');
    if (!section || document.getElementById('manualCommissionPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'manualCommissionPanel';
    panel.style.cssText = 'border:1px solid #e5e7eb;border-radius:13px;padding:16px;margin-bottom:16px;background:#fafbfc;';
    panel.innerHTML = `<div class="section-head"><h2 style="font-size:18px">手动录入员工销售 / 提成</h2><span class="hint">统计谁、哪一天、卖了什么</span></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px"><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">日期<input id="manualCommissionDate" type="date" required></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">员工<input id="manualCommissionSeller" list="manualCommissionSellerList" placeholder="输入员工姓名" required><datalist id="manualCommissionSellerList"></datalist></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">饮料<select id="manualCommissionItem" required></select></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">卖出数量<input id="manualCommissionQty" type="number" min="0.01" step="0.01" placeholder="数量" required></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">每单位提成 SGD<input id="manualCommissionRate" type="number" min="0" step="0.01" value="0"></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">备注<input id="manualCommissionNote" placeholder="例如：晚市 / 包厢 3"></label></div><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:12px"><div class="hint">这项记录只统计员工销售和提成，不会再次扣减库存。</div><button id="saveManualCommissionBtn">保存销售记录</button></div><div id="manualCommissionMessage" class="hint" style="margin-top:8px"></div>`;
    section.insertBefore(panel, section.firstChild);
    const filter = document.createElement('div');
    filter.id = 'manualCommissionFilterPanel';
    filter.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:12px;margin:0 0 14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;';
    filter.innerHTML = `<label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">员工筛选<select id="commissionSellerFilter"><option value="">全部员工</option></select></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">饮料筛选<select id="commissionItemFilter"><option value="">全部饮料</option></select></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">开始日期<input id="commissionDateFrom" type="date"></label><label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">结束日期<input id="commissionDateTo" type="date"></label><div style="display:flex;align-items:flex-end"><button id="clearCommissionFiltersBtn" class="secondary" style="width:100%">清除筛选</button></div>`;
    const table = section.querySelector('table');
    if (table) section.insertBefore(filter, table); else section.appendChild(filter);
    const summary = document.createElement('div');
    summary.id = 'manualCommissionSummary'; summary.className = 'hint'; summary.style.marginBottom = '10px';
    if (table) section.insertBefore(summary, table); else section.appendChild(summary);
    const heading = section.querySelector(':scope > .section-head h2'); if (heading) heading.textContent = '员工销售与提成记录';
    const status = document.getElementById('commissionStatus'); if (status) status.textContent = '手动录入';
    const headerRow = section.querySelector('table thead tr');
    if (headerRow) headerRow.innerHTML = '<th>日期</th><th>员工</th><th>饮料</th><th>数量</th><th>单件提成</th><th>提成金额</th><th>备注</th><th>录入账号</th><th>操作</th>';
    document.getElementById('manualCommissionDate').value = todaySG();
    document.getElementById('manualCommissionItem').onchange = fillRateFromSelectedItem;
    document.getElementById('saveManualCommissionBtn').onclick = saveManualCommission;
    document.getElementById('commissionSellerFilter').onchange = renderCommissionRows;
    document.getElementById('commissionItemFilter').onchange = renderCommissionRows;
    document.getElementById('commissionDateFrom').onchange = renderCommissionRows;
    document.getElementById('commissionDateTo').onchange = renderCommissionRows;
    document.getElementById('clearCommissionFiltersBtn').onclick = clearCommissionFilters;
  }
  function refreshManualCommissionUI() { refreshProductOptions(); refreshSellerOptions(); renderCommissionRows(); }
  function refreshProductOptions() {
    const entry = document.getElementById('manualCommissionItem'); const filter = document.getElementById('commissionItemFilter'); if (!entry || !filter) return;
    const entryValue = entry.value, filterValue = filter.value; const sortedItems = [...items].sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    entry.innerHTML = '<option value="">请选择饮料</option>' + sortedItems.map(item => `<option value="${item.id}">${esc(item.name)}${item.spec ? ' · ' + esc(item.spec) : ''}</option>`).join('');
    const productNames = [...new Set([...sortedItems.map(item=>item.name), ...commissions.map(row=>row.item_name).filter(Boolean)])].sort((a,b)=>String(a).localeCompare(String(b)));
    filter.innerHTML = '<option value="">全部饮料</option>' + productNames.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
    if ([...entry.options].some(o=>o.value===entryValue)) entry.value=entryValue;
    if ([...filter.options].some(o=>o.value===filterValue)) filter.value=filterValue;
  }
  function refreshSellerOptions() {
    const list=document.getElementById('manualCommissionSellerList'), filter=document.getElementById('commissionSellerFilter'); if(!list||!filter)return;
    const filterValue=filter.value; const sellers=[...new Set(commissions.map(r=>r.seller_name).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
    list.innerHTML=sellers.map(name=>`<option value="${esc(name)}"></option>`).join('');
    filter.innerHTML='<option value="">全部员工</option>'+sellers.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
    if([...filter.options].some(o=>o.value===filterValue))filter.value=filterValue;
  }
  function fillRateFromSelectedItem(){ const id=document.getElementById('manualCommissionItem').value; const item=items.find(r=>r.id===id); document.getElementById('manualCommissionRate').value=item?Number(item.commission_per_unit||0).toFixed(2):'0.00'; }
  async function saveManualCommission(){
    const message=document.getElementById('manualCommissionMessage'); const date=document.getElementById('manualCommissionDate').value; const seller=document.getElementById('manualCommissionSeller').value.trim(); const itemId=document.getElementById('manualCommissionItem').value; const quantity=Number(document.getElementById('manualCommissionQty').value); const rate=Number(document.getElementById('manualCommissionRate').value||0); const note=document.getElementById('manualCommissionNote').value.trim(); const item=items.find(r=>r.id===itemId);
    if(!date)return alert('请选择日期'); if(!seller)return alert('请输入员工姓名'); if(!item)return alert('请选择饮料'); if(!Number.isFinite(quantity)||quantity<=0)return alert('请输入大于 0 的卖出数量'); if(!Number.isFinite(rate)||rate<0)return alert('请输入正确的每单位提成');
    message.textContent='保存中...';
    const payload={item_id:item.id,item_name:item.name,seller_name:seller,quantity,commission_per_unit:rate,commission_amount:quantity*rate,operation_date:date,note,user_email:userEmail()};
    const {error}=await sb.from('commission_logs').insert(payload);
    if(error){message.textContent='';const text=String(error.message||error);if(text.includes('operation_date')||text.includes('note'))alert('保存失败：请先在 Supabase 运行更新后的 commission-upgrade.sql。');else alert('保存失败：'+text);return;}
    document.getElementById('manualCommissionQty').value=''; document.getElementById('manualCommissionNote').value=''; message.textContent=`已记录：${date} · ${seller} · ${item.name} × ${quantity}`; await loadAll();
  }
  async function deleteCommission(id){
    const row=commissions.find(r=>String(r.id)===String(id));
    if(!row)return;
    if(!confirm(`确定删除这条提成记录吗？\n${recordDate(row)} · ${row.seller_name} · ${row.item_name} × ${row.quantity}`))return;
    const {error}=await sb.from('commission_logs').delete().eq('id',id);
    if(error){
      const text=String(error.message||error);
      if(text.toLowerCase().includes('policy')||text.toLowerCase().includes('permission')) alert('删除失败：请先在 Supabase 重新运行最新的 commission-upgrade.sql。');
      else alert('删除失败：'+text);
      return;
    }
    await loadAll();
  }
  function clearCommissionFilters(){ document.getElementById('commissionSellerFilter').value='';document.getElementById('commissionItemFilter').value='';document.getElementById('commissionDateFrom').value='';document.getElementById('commissionDateTo').value='';renderCommissionRows(); }
  function renderCommissionRows(){
    const body=document.getElementById('commissionBody'), summary=document.getElementById('manualCommissionSummary'); if(!body||!summary)return;
    const seller=document.getElementById('commissionSellerFilter')?.value||'', itemName=document.getElementById('commissionItemFilter')?.value||'', from=document.getElementById('commissionDateFrom')?.value||'', to=document.getElementById('commissionDateTo')?.value||'';
    if(from&&to&&from>to){body.innerHTML='<tr><td colspan="9">开始日期不能晚于结束日期</td></tr>';summary.textContent='请重新选择日期范围。';return;}
    const rows=[...commissions].filter(row=>{const date=recordDate(row);if(seller&&row.seller_name!==seller)return false;if(itemName&&row.item_name!==itemName)return false;if(from&&date<from)return false;if(to&&date>to)return false;return true;}).sort((a,b)=>{const dc=recordDate(b).localeCompare(recordDate(a));if(dc!==0)return dc;return String(b.created_at||'').localeCompare(String(a.created_at||''));});
    const totalQty=rows.reduce((s,r)=>s+Number(r.quantity||0),0), totalCommission=rows.reduce((s,r)=>s+Number(r.commission_amount||0),0);
    summary.textContent=`共 ${rows.length} 条记录｜卖出 ${totalQty}｜提成 $${totalCommission.toFixed(2)}`;
    body.innerHTML=rows.map(row=>`<tr><td>${esc(recordDate(row))}</td><td><b>${esc(row.seller_name||'')}</b></td><td>${esc(row.item_name||'')}</td><td>${Number(row.quantity||0)}</td><td>$${Number(row.commission_per_unit||0).toFixed(2)}</td><td class="money">$${Number(row.commission_amount||0).toFixed(2)}</td><td>${esc(row.note||'')}</td><td>${esc(row.user_email||'')}</td><td><button class="red" style="padding:6px 9px;font-size:12px" onclick="window.deleteCommissionRecord('${row.id}')">删除</button></td></tr>`).join('')||'<tr><td colspan="9">没有符合条件的销售记录</td></tr>';
    const stat=document.getElementById('statCommission');if(stat){const todayTotal=commissions.filter(row=>recordDate(row)===todaySG()).reduce((s,r)=>s+Number(r.commission_amount||0),0);stat.textContent='$'+todayTotal.toFixed(2);}
  }
  window.deleteCommissionRecord=deleteCommission;
  waitForApp();
})();