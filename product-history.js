// 点开饮料显示库存历史；可筛选，并允许删除 Key 错的单条操作记录。
(function(){
  let historyRows=[];
  let currentItem=null;

  function wait(){
    if(typeof renderDrawer!=='function'||typeof sb==='undefined'){
      setTimeout(wait,120);return;
    }
    install();
  }

  function install(){
    const oldRenderDrawer=renderDrawer;
    renderDrawer=function(x){
      oldRenderDrawer(x);
      currentItem=x;
      ensureHistoryBox();
      resetHistoryFilters();
      loadProductHistory(x);
    };
  }

  function ensureHistoryBox(){
    const drawer=document.getElementById('itemDrawer');
    if(!drawer||document.getElementById('productHistoryBox'))return;
    const danger=drawer.querySelector('.danger-zone');
    const box=document.createElement('div');
    box.id='productHistoryBox';
    box.style.marginTop='22px';
    box.innerHTML=`
      <div class="section-head"><h3 style="margin:0;font-size:17px">入库 / 出库历史</h3><span id="productHistorySummary" class="hint"></span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin:12px 0 14px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fafbfc">
        <label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">操作类型<select id="historyActionFilter"><option value="">全部操作</option><option value="IN">只看入库</option><option value="OUT">只看出库</option><option value="TRANSFER">只看移库</option><option value="ADJUST">只看盘点</option><option value="CREATE">只看新增</option><option value="EDIT">只看编辑</option></select></label>
        <label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">开始日期<input id="historyDateFrom" type="date"></label>
        <label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">结束日期<input id="historyDateTo" type="date"></label>
        <label style="font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:5px">查找<input id="historyKeywordFilter" placeholder="备注或操作账号"></label>
        <div style="display:flex;align-items:flex-end"><button id="historyResetBtn" class="secondary" style="width:100%">清除筛选</button></div>
      </div>
      <div id="historyFilterMessage" class="hint" style="margin-bottom:8px"></div>
      <div class="tablewrap" style="margin-top:8px"><table style="min-width:760px"><thead><tr><th>日期</th><th>操作</th><th>数量</th><th>位置 / 备注</th><th>操作人</th><th>操作</th></tr></thead><tbody id="productHistoryBody"><tr><td colspan="6">读取中...</td></tr></tbody></table></div>`;
    drawer.insertBefore(box,danger||null);
    document.getElementById('historyActionFilter').onchange=applyHistoryFilters;
    document.getElementById('historyDateFrom').onchange=applyHistoryFilters;
    document.getElementById('historyDateTo').onchange=applyHistoryFilters;
    document.getElementById('historyKeywordFilter').oninput=applyHistoryFilters;
    document.getElementById('historyResetBtn').onclick=()=>{resetHistoryFilters();applyHistoryFilters();};
  }

  function resetHistoryFilters(){
    const action=document.getElementById('historyActionFilter'),from=document.getElementById('historyDateFrom'),to=document.getElementById('historyDateTo'),keyword=document.getElementById('historyKeywordFilter');
    if(action)action.value='';if(from)from.value='';if(to)to.value='';if(keyword)keyword.value='';
  }
  function dateOf(x){return x.operation_date||new Date(x.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
  function actionName(action){return ({IN:'入库',OUT:'出库',TRANSFER:'移库',ADJUST:'盘点',CREATE:'新增',EDIT:'编辑'})[action]||action;}

  async function fetchHistory(itemId){
    let result=await sb.from('inventory_logs').select('*').eq('item_id',itemId).order('operation_date',{ascending:false}).order('created_at',{ascending:false}).limit(1000);
    if(result.error&&String(result.error.message||'').toLowerCase().includes('operation_date')){
      result=await sb.from('inventory_logs').select('*').eq('item_id',itemId).order('created_at',{ascending:false}).limit(1000);
    }
    return result;
  }

  async function loadProductHistory(x){
    const body=document.getElementById('productHistoryBody'),summary=document.getElementById('productHistorySummary'),message=document.getElementById('historyFilterMessage');if(!body)return;
    historyRows=[];body.innerHTML='<tr><td colspan="6">读取中...</td></tr>';if(summary)summary.textContent='';if(message)message.textContent='';
    const {data,error}=await fetchHistory(x.id);
    if(error){body.innerHTML=`<tr><td colspan="6">读取失败：${esc(error.message)}</td></tr>`;return;}
    historyRows=data||[];applyHistoryFilters();
  }

  function applyHistoryFilters(){
    const body=document.getElementById('productHistoryBody'),summary=document.getElementById('productHistorySummary'),message=document.getElementById('historyFilterMessage');if(!body)return;
    const action=document.getElementById('historyActionFilter')?.value||'',from=document.getElementById('historyDateFrom')?.value||'',to=document.getElementById('historyDateTo')?.value||'',keyword=(document.getElementById('historyKeywordFilter')?.value||'').trim().toLowerCase();
    if(from&&to&&from>to){body.innerHTML='<tr><td colspan="6">开始日期不能晚于结束日期</td></tr>';if(message)message.textContent='请重新选择日期范围。';if(summary)summary.textContent='';return;}
    const filtered=historyRows.filter(row=>{const date=dateOf(row);if(action&&row.action!==action)return false;if(from&&date<from)return false;if(to&&date>to)return false;if(keyword){const text=[actionName(row.action),row.note,row.user_email,date].join(' ').toLowerCase();if(!text.includes(keyword))return false;}return true;});
    const inQty=filtered.filter(r=>r.action==='IN').reduce((s,r)=>s+Number(r.quantity||0),0),outQty=filtered.filter(r=>r.action==='OUT').reduce((s,r)=>s+Number(r.quantity||0),0);
    if(summary)summary.textContent=`入库 ${inQty} / 出库 ${outQty}`;if(message)message.textContent=`显示 ${filtered.length} 条，共 ${historyRows.length} 条记录`;
    body.innerHTML=filtered.map(r=>`<tr><td>${esc(dateOf(r))}</td><td><b>${esc(actionName(r.action))}</b></td><td>${Number(r.quantity||0)}</td><td>${esc(r.note||'')}</td><td>${esc(r.user_email||'')}</td><td><button class="secondary history-delete-btn" data-id="${r.id}" style="padding:5px 8px;font-size:12px">删除</button></td></tr>`).join('')||'<tr><td colspan="6">没有符合筛选条件的记录</td></tr>';
    body.querySelectorAll('.history-delete-btn').forEach(btn=>btn.onclick=()=>deleteHistoryRecord(btn.dataset.id));
  }

  async function deleteHistoryRecord(id){
    const row=historyRows.find(r=>String(r.id)===String(id));if(!row)return;
    if(!confirm(`确定删除这条记录吗？\n${dateOf(row)} · ${actionName(row.action)} · 数量 ${Number(row.quantity||0)}\n\n注意：这里只删除历史记录，不会自动把当前库存数量改回去。`))return;
    const {error}=await sb.from('inventory_logs').delete().eq('id',id);
    if(error)return alert('删除失败：'+error.message+'\n请确认已运行最新版 account-directory-upgrade.sql。');
    historyRows=historyRows.filter(r=>String(r.id)!==String(id));
    applyHistoryFilters();
  }

  wait();
})();