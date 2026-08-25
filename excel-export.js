// Excel 导出：库存、库存操作记录、销售提成。
(function(){
  function wait(){if(typeof sb==='undefined'||typeof items==='undefined'||!document.getElementById('dashboard')){setTimeout(wait,150);return;}install();}
  function install(){if(document.getElementById('exportExcelBtn'))return;loadSheetJS();const dashboard=document.getElementById('dashboard');const bar=document.createElement('div');bar.style.cssText='display:flex;justify-content:flex-end;margin:0 0 14px';bar.innerHTML='<button id="exportExcelBtn" class="secondary">导出 Excel</button>';dashboard.insertBefore(bar,dashboard.firstChild);document.getElementById('exportExcelBtn').onclick=exportExcel;}
  function loadSheetJS(){if(window.XLSX||document.getElementById('sheetJsLib'))return;const s=document.createElement('script');s.id='sheetJsLib';s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';document.head.appendChild(s);}
  function dateOf(r){return r.operation_date||new Date(r.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
  async function exportExcel(){const btn=document.getElementById('exportExcelBtn');if(!window.XLSX)return alert('Excel 模块正在加载，请稍后重试。');btn.disabled=true;btn.textContent='导出中...';try{
    const [logRes,comRes]=await Promise.all([sb.from('inventory_logs').select('*').order('operation_date',{ascending:true}).order('created_at',{ascending:true}),sb.from('commission_logs').select('*').order('operation_date',{ascending:true}).order('created_at',{ascending:true})]);
    if(logRes.error)throw logRes.error;if(comRes.error)throw comRes.error;
    const inventory=[...items].sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(x=>({'名称':x.name,'类别':x.category||'','规格':x.spec||'','单位':x.unit||'','冰箱库存':Number(x.fridge_quantity||0),'仓库库存':Number(x.warehouse_quantity||0),'总库存':Number(x.fridge_quantity||0)+Number(x.warehouse_quantity||0),'最低库存':Number(x.min_quantity||0),'成本价 SGD':Number(x.cost_price||0),'单位提成 SGD':Number(x.commission_per_unit||0)}));
    const actions={IN:'入库',OUT:'出库',TRANSFER:'移库',ADJUST:'盘点',CREATE:'新增',EDIT:'编辑'};
    const logs=(logRes.data||[]).map(r=>({'日期':dateOf(r),'饮料':r.item_name||'','操作':actions[r.action]||r.action,'数量':Number(r.quantity||0),'备注':r.note||'','操作账号':r.user_email||''}));
    const commission=(comRes.data||[]).map(r=>({'日期':dateOf(r),'员工':r.seller_name||'','饮料':r.item_name||'','销售数量':Number(r.quantity||0),'单位提成 SGD':Number(r.commission_per_unit||0),'提成金额 SGD':Number(r.commission_amount||0),'备注':r.note||'','录入账号':r.user_email||''}));
    const wb=XLSX.utils.book_new();addSheet(wb,'当前库存',inventory);addSheet(wb,'库存记录',logs);addSheet(wb,'销售提成',commission);const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});XLSX.writeFile(wb,`饮料库存数据_${today}.xlsx`);
  }catch(e){alert('导出失败：'+String(e.message||e));}finally{btn.disabled=false;btn.textContent='导出 Excel';}}
  function addSheet(wb,name,rows){const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{'暂无数据':''}]);const range=XLSX.utils.decode_range(ws['!ref']);const widths=[];for(let c=range.s.c;c<=range.e.c;c++){let max=10;for(let r=range.s.r;r<=range.e.r;r++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell&&cell.v!=null)max=Math.max(max,String(cell.v).length+2);}widths.push({wch:Math.min(max,35)});}ws['!cols']=widths;ws['!autofilter']={ref:ws['!ref']};XLSX.utils.book_append_sheet(wb,ws,name);}
  wait();
})();