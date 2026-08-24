// 点开每个饮料时显示该饮料的入库、出库、移库和盘点历史。
(function(){
  function wait(){
    if(typeof renderDrawer!=='function'||typeof sb==='undefined'){
      setTimeout(wait,120);
      return;
    }
    install();
  }

  function install(){
    const oldRenderDrawer=renderDrawer;
    renderDrawer=function(x){
      oldRenderDrawer(x);
      ensureHistoryBox();
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
      <div class="section-head">
        <h3 style="margin:0;font-size:16px">入库 / 出库历史</h3>
        <span id="productHistorySummary" class="hint"></span>
      </div>
      <div class="tablewrap" style="margin-top:8px">
        <table style="min-width:560px">
          <thead><tr><th>日期</th><th>操作</th><th>数量</th><th>位置 / 备注</th><th>操作人</th></tr></thead>
          <tbody id="productHistoryBody"><tr><td colspan="5">读取中...</td></tr></tbody>
        </table>
      </div>`;
    drawer.insertBefore(box,danger||null);
  }

  function dateOf(x){
    return x.operation_date||new Date(x.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});
  }

  function actionName(action){
    return ({IN:'入库',OUT:'出库',TRANSFER:'移库',ADJUST:'盘点',CREATE:'新增',EDIT:'编辑'})[action]||action;
  }

  async function fetchHistory(itemId){
    let result=await sb.from('inventory_logs')
      .select('*')
      .eq('item_id',itemId)
      .order('operation_date',{ascending:false})
      .order('created_at',{ascending:false})
      .limit(200);

    // 尚未运行 operation-date-upgrade.sql 时，仍可先按系统录入时间显示。
    if(result.error&&String(result.error.message||'').toLowerCase().includes('operation_date')){
      result=await sb.from('inventory_logs')
        .select('*')
        .eq('item_id',itemId)
        .order('created_at',{ascending:false})
        .limit(200);
    }
    return result;
  }

  async function loadProductHistory(x){
    const body=document.getElementById('productHistoryBody');
    const summary=document.getElementById('productHistorySummary');
    if(!body)return;
    body.innerHTML='<tr><td colspan="5">读取中...</td></tr>';

    const {data,error}=await fetchHistory(x.id);
    if(error){
      body.innerHTML=`<tr><td colspan="5">读取失败：${esc(error.message)}</td></tr>`;
      return;
    }

    const rows=data||[];
    const inQty=rows.filter(r=>r.action==='IN').reduce((s,r)=>s+Number(r.quantity||0),0);
    const outQty=rows.filter(r=>r.action==='OUT').reduce((s,r)=>s+Number(r.quantity||0),0);
    summary.textContent=`累计入库 ${inQty} / 累计出库 ${outQty}`;

    body.innerHTML=rows.map(r=>`
      <tr>
        <td>${esc(dateOf(r))}</td>
        <td><b>${esc(actionName(r.action))}</b></td>
        <td>${Number(r.quantity||0)}</td>
        <td>${esc(r.note||'')}</td>
        <td>${esc(r.user_email||'')}</td>
      </tr>`).join('')||'<tr><td colspan="5">这个饮料还没有操作记录</td></tr>';
  }

  wait();
})();