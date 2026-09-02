// Excel 导出：支持全部、指定日期、指定月份；历史导出会还原所选日期结束时的库存。
(function(){
  function wait(){if(typeof sb==='undefined'||typeof items==='undefined'||!document.getElementById('dashboard')){setTimeout(wait,150);return;}install();}
  function install(){if(document.getElementById('exportExcelBtn'))return;loadSheetJS();const dashboard=document.getElementById('dashboard');const bar=document.createElement('div');bar.style.cssText='display:flex;justify-content:flex-end;margin:0 0 14px';bar.innerHTML='<button id="exportExcelBtn" class="secondary">导出 Excel</button>';dashboard.insertBefore(bar,dashboard.firstChild);buildDialog();document.getElementById('exportExcelBtn').onclick=()=>document.getElementById('exportExcelDialog').showModal();}
  function buildDialog(){if(document.getElementById('exportExcelDialog'))return;const d=document.createElement('dialog');d.id='exportExcelDialog';d.innerHTML=`<div class="modal"><h3>导出 Excel</h3><div class="grid2"><label class="full">导出范围<select id="excelExportRange"><option value="all">全部数据</option><option value="day">指定日期</option><option value="month">指定月份</option></select></label><label id="excelDayWrap" class="full hidden">日期<input id="excelExportDay" type="date"></label><label id="excelMonthWrap" class="full hidden">月份<input id="excelExportMonth" type="month"></label><div id="excelSnapshotHint" class="full hint" style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc">全部数据：库存工作表显示当前最新库存。</div></div><div class="modalfooter"><button id="cancelExcelExport" class="secondary">取消</button><button id="confirmExcelExport">导出</button></div></div>`;document.body.appendChild(d);document.getElementById('excelExportRange').onchange=toggleRange;document.getElementById('cancelExcelExport').onclick=()=>d.close();document.getElementById('confirmExcelExport').onclick=exportExcel;}
  function toggleRange(){const v=document.getElementById('excelExportRange').value;document.getElementById('excelDayWrap').classList.toggle('hidden',v!=='day');document.getElementById('excelMonthWrap').classList.toggle('hidden',v!=='month');const hint=document.getElementById('excelSnapshotHint');if(hint)hint.textContent=v==='day'?'指定日期：库存工作表将还原为该日期营业结束后的库存。':v==='month'?'指定月份：库存工作表将还原为该月份最后一天营业结束后的库存。':'全部数据：库存工作表显示当前最新库存。';}
  function loadSheetJS(){if(window.XLSX||document.getElementById('sheetJsLib'))return;const s=document.createElement('script');s.id='sheetJsLib';s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';document.head.appendChild(s);}
  function todaySG(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
  function dateOf(r){return r.operation_date||new Date(r.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
  function inRange(r,mode,value){const d=dateOf(r);if(mode==='day')return d===value;if(mode==='month')return d.startsWith(value+'-');return true;}
  function monthEnd(month){const p=String(month).split('-').map(Number);if(p.length!==2||!p[0]||!p[1])return '';return new Date(Date.UTC(p[0],p[1],0)).toISOString().slice(0,10);}
  function logSort(a,b){const da=dateOf(a),db=dateOf(b);if(da!==db)return da.localeCompare(db);const ca=String(a.created_at||''),cb=String(b.created_at||'');if(ca!==cb)return ca.localeCompare(cb);return Number(a.id||0)-Number(b.id||0);}
  function parseAbsolute(note){const m=String(note||'').match(/冰箱\s*([+-]?[0-9]+(?:\.[0-9]+)?)\s*\/\s*仓库\s*([+-]?[0-9]+(?:\.[0-9]+)?)/);return m?{fridge:Number(m[1]),warehouse:Number(m[2])}:null;}
  function locationOf(note){const s=String(note||'');if(s.startsWith('冰箱｜'))return 'fridge';if(s.startsWith('仓库｜'))return 'warehouse';return '';}
  function currentInventoryRows(snapshotDate){return [...items].sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(x=>({'库存日期':snapshotDate,'名称':x.name,'类别':x.category||'','规格':x.spec||'','单位':x.unit||'','冰箱库存':Number(x.fridge_quantity||0),'仓库库存':Number(x.warehouse_quantity||0),'总库存':Number(x.fridge_quantity||0)+Number(x.warehouse_quantity||0),'最低库存':Number(x.min_quantity||0),'成本价 SGD':Number(x.cost_price||0),'单位提成 SGD':Number(x.commission_per_unit||0),'数据状态':'当前库存'}));}
  function historicalInventoryRows(allLogs,cutoff){
    const states=new Map();
    items.forEach(x=>states.set(String(x.id),{fridge:0,warehouse:0,baseline:false,activity:false,exists:false,baselineDate:''}));
    [...allLogs].sort(logSort).forEach(r=>{
      const d=dateOf(r);if(!d||d>cutoff)return;
      const s=states.get(String(r.item_id||''));if(!s)return;
      s.activity=true;
      const q=Number(r.quantity||0),action=String(r.action||''),loc=locationOf(r.note);
      if(action==='CREATE'||action==='EDIT'){
        const absolute=parseAbsolute(r.note);
        if(absolute){s.fridge=absolute.fridge;s.warehouse=absolute.warehouse;s.baseline=true;s.exists=true;s.baselineDate=d;}
        return;
      }
      if(!s.baseline)return;
      if(action==='IN'){
        if(loc==='fridge')s.fridge+=q;else if(loc==='warehouse')s.warehouse+=q;
      }else if(action==='OUT'){
        if(loc==='fridge')s.fridge-=q;else if(loc==='warehouse')s.warehouse-=q;
      }else if(action==='TRANSFER'){
        const note=String(r.note||'');
        if(note.startsWith('仓库 → 冰箱')){s.warehouse-=q;s.fridge+=q;}
        else if(note.startsWith('冰箱 → 仓库')){s.fridge-=q;s.warehouse+=q;}
      }else if(action==='ADJUST'){
        if(loc==='fridge')s.fridge=q;else if(loc==='warehouse')s.warehouse=q;
      }
    });
    const rows=[];let uncertain=0;
    [...items].sort((a,b)=>String(a.name).localeCompare(String(b.name))).forEach(x=>{
      const s=states.get(String(x.id));if(!s)return;
      if(!s.baseline&&!s.activity)return;
      if(!s.baseline){uncertain++;rows.push({'库存日期':cutoff,'名称':x.name,'类别':x.category||'','规格':x.spec||'','单位':x.unit||'','冰箱库存':'','仓库库存':'','总库存':'','最低库存':Number(x.min_quantity||0),'成本价 SGD':Number(x.cost_price||0),'单位提成 SGD':Number(x.commission_per_unit||0),'数据状态':'历史基准不足'});return;}
      const f=Math.max(0,Number(s.fridge||0)),w=Math.max(0,Number(s.warehouse||0));
      rows.push({'库存日期':cutoff,'名称':x.name,'类别':x.category||'','规格':x.spec||'','单位':x.unit||'','冰箱库存':f,'仓库库存':w,'总库存':f+w,'最低库存':Number(x.min_quantity||0),'成本价 SGD':Number(x.cost_price||0),'单位提成 SGD':Number(x.commission_per_unit||0),'数据状态':'历史还原'});
    });
    return {rows,uncertain};
  }
  async function exportExcel(){if(!window.XLSX)return alert('Excel 模块正在加载，请稍后重试。');const mode=document.getElementById('excelExportRange').value,value=mode==='day'?document.getElementById('excelExportDay').value:mode==='month'?document.getElementById('excelExportMonth').value:'';if(mode!=='all'&&!value)return alert(mode==='day'?'请选择日期':'请选择月份');const btn=document.getElementById('confirmExcelExport');btn.disabled=true;btn.textContent='导出中...';try{
    const [logRes,comRes]=await Promise.all([sb.from('inventory_logs').select('*').order('operation_date',{ascending:true}).order('created_at',{ascending:true}),sb.from('commission_logs').select('*').order('operation_date',{ascending:true}).order('created_at',{ascending:true})]);if(logRes.error)throw logRes.error;if(comRes.error)throw comRes.error;
    const allLogs=logRes.data||[],allCommissions=comRes.data||[];
    const cutoff=mode==='day'?value:mode==='month'?monthEnd(value):todaySG();
    let inventory,inventorySheet='当前库存',uncertain=0;
    if(mode==='all')inventory=currentInventoryRows(cutoff);else{const snapshot=historicalInventoryRows(allLogs,cutoff);inventory=snapshot.rows;uncertain=snapshot.uncertain;inventorySheet='库存快照';}
    const actions={IN:'入库',OUT:'出库',TRANSFER:'移库',ADJUST:'盘点',CREATE:'新增',EDIT:'编辑'};
    const logRows=allLogs.filter(r=>inRange(r,mode,value));const comRows=allCommissions.filter(r=>inRange(r,mode,value));
    const logs=logRows.map(r=>({'日期':dateOf(r),'饮料':r.item_name||'','操作':actions[r.action]||r.action,'数量':Number(r.quantity||0),'备注':r.note||'','操作账号':r.user_email||''}));
    const commission=comRows.map(r=>({'日期':dateOf(r),'员工':r.seller_name||'','饮料':r.item_name||'','销售数量':Number(r.quantity||0),'单位提成 SGD':Number(r.commission_per_unit||0),'提成金额 SGD':Number(r.commission_amount||0),'备注':r.note||'','录入账号':r.user_email||''}));
    const wb=XLSX.utils.book_new();addSheet(wb,inventorySheet,inventory);addSheet(wb,'库存记录',logs);addSheet(wb,'销售提成',commission);const label=mode==='all'?'全部':value;XLSX.writeFile(wb,`饮料库存数据_${label}.xlsx`);document.getElementById('exportExcelDialog').close();if(uncertain>0)alert(`Excel 已导出。\n其中 ${uncertain} 个品项在所选日期之前缺少完整库存基准，已在“数据状态”栏标记为“历史基准不足”。`);
  }catch(e){alert('导出失败：'+String(e.message||e));}finally{btn.disabled=false;btn.textContent='导出';}}
  function addSheet(wb,name,rows){const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{'暂无数据':''}]);const range=XLSX.utils.decode_range(ws['!ref']),widths=[];for(let c=range.s.c;c<=range.e.c;c++){let max=10;for(let r=range.s.r;r<=range.e.r;r++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell&&cell.v!=null)max=Math.max(max,String(cell.v).length+2);}widths.push({wch:Math.min(max,35)});}ws['!cols']=widths;ws['!autofilter']={ref:ws['!ref']};XLSX.utils.book_append_sheet(wb,ws,name);}
  wait();
})();