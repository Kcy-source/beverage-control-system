// 员工提成：直接导出已点击“确定”后的筛选结果，支持跨月份日期范围。
(function(){
'use strict';
let installed=false;

function el(id){return document.getElementById(id);}
function currentMonth(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'}).slice(0,7);}
function recordDate(r){return r.operation_date||new Date(r.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
function monthBounds(month){
  const [y,m]=String(month).split('-').map(Number);
  const start=`${y}-${String(m).padStart(2,'0')}-01`;
  const ny=m===12?y+1:y,nm=m===12?1:m+1;
  const next=`${ny}-${String(nm).padStart(2,'0')}-01`;
  return {start,next};
}
function selectedArchiveMonth(){
  const old=document.querySelector('#commissionOtherMonthList .commission-month-option.month-active[data-month]');
  return old?.dataset.month||currentMonth();
}
function appliedFilters(){
  if(typeof window.getAppliedCommissionFilters==='function')return window.getAppliedCommissionFilters();
  return {seller:el('commissionSellerFilter')?.value||'',item:el('commissionItemFilter')?.value||'',from:el('commissionDateFrom')?.value||'',to:el('commissionDateTo')?.value||''};
}
function loadXLSX(){
  if(window.XLSX)return Promise.resolve(window.XLSX);
  return new Promise((resolve,reject)=>{
    let script=el('sheetJsLib');
    if(script){
      script.addEventListener('load',()=>resolve(window.XLSX),{once:true});
      script.addEventListener('error',()=>reject(new Error('Excel 模块加载失败')),{once:true});
      setTimeout(()=>window.XLSX&&resolve(window.XLSX),100);
      return;
    }
    script=document.createElement('script');script.id='sheetJsLib';script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload=()=>resolve(window.XLSX);script.onerror=()=>reject(new Error('Excel 模块加载失败'));document.head.appendChild(script);
  });
}
async function fetchRows(filters){
  const useRange=!!(filters.from||filters.to);
  const month=useRange?'':selectedArchiveMonth();
  const bounds=month?monthBounds(month):null;
  const all=[];let offset=0;const pageSize=1000;
  while(true){
    let q=sb.from('commission_logs').select('*').order('operation_date',{ascending:false}).order('created_at',{ascending:false});
    if(filters.seller)q=q.eq('seller_name',filters.seller);
    if(filters.item)q=q.eq('item_name',filters.item);
    if(filters.from)q=q.gte('operation_date',filters.from);
    if(filters.to)q=q.lte('operation_date',filters.to);
    if(!useRange&&bounds){q=q.gte('operation_date',bounds.start).lt('operation_date',bounds.next);}
    const {data,error}=await q.range(offset,offset+pageSize-1);
    if(error)throw error;
    const page=data||[];all.push(...page);
    if(page.length<pageSize)break;
    offset+=pageSize;
  }
  return {rows:all,month,useRange};
}
function safeFilePart(v){return String(v||'').replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim();}
function autoWidth(ws){
  if(!ws['!ref'])return;const range=XLSX.utils.decode_range(ws['!ref']),cols=[];
  for(let c=range.s.c;c<=range.e.c;c++){
    let max=10;
    for(let r=range.s.r;r<=range.e.r;r++){
      const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell?.v!=null)max=Math.max(max,String(cell.v).length+2);
    }
    cols.push({wch:Math.min(max,38)});
  }
  ws['!cols']=cols;ws['!autofilter']={ref:ws['!ref']};
}
async function exportFiltered(){
  const btn=el('exportCommissionFiltersBtn');if(!btn)return;
  const filters=appliedFilters();
  if(filters.from&&filters.to&&filters.from>filters.to)return alert('开始日期不能晚于结束日期');
  btn.disabled=true;const oldText=btn.textContent;btn.textContent='导出中...';
  try{
    await loadXLSX();
    const result=await fetchRows(filters),rows=result.rows;
    const data=rows.map(r=>({
      '日期':recordDate(r),
      '员工':r.seller_name||'',
      '饮料':r.item_name||'',
      '数量':Number(r.quantity||0),
      '单位提成 SGD':Number(r.commission_per_unit||0),
      '提成金额 SGD':Number(r.commission_amount||0),
      '备注':r.note||'',
      '录入账号':r.user_email||''
    }));
    const qty=rows.reduce((s,r)=>s+Number(r.quantity||0),0),amount=rows.reduce((s,r)=>s+Number(r.commission_amount||0),0);
    const rangeText=filters.from||filters.to
      ?`${filters.from||'最早'} 至 ${filters.to||'最新'}`
      :`${result.month} 整月`;
    const summary=[
      {'项目':'日期范围','内容':rangeText},
      {'项目':'员工','内容':filters.seller||'全部员工'},
      {'项目':'饮料','内容':filters.item||'全部饮料'},
      {'项目':'记录数','内容':rows.length},
      {'项目':'销售数量','内容':qty},
      {'项目':'提成总额 SGD','内容':Number(amount.toFixed(2))}
    ];
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.json_to_sheet(data.length?data:[{'暂无数据':''}]);autoWidth(ws);XLSX.utils.book_append_sheet(wb,ws,'销售提成');
    const sumWs=XLSX.utils.json_to_sheet(summary);autoWidth(sumWs);XLSX.utils.book_append_sheet(wb,sumWs,'汇总');
    const datePart=filters.from||filters.to?`${filters.from||'最早'}_至_${filters.to||'最新'}`:result.month;
    const itemPart=filters.item?'_'+safeFilePart(filters.item):'';
    const sellerPart=filters.seller?'_'+safeFilePart(filters.seller):'';
    XLSX.writeFile(wb,`销售提成_${safeFilePart(datePart)}${itemPart}${sellerPart}.xlsx`);
  }catch(e){alert('导出失败：'+String(e.message||e));}
  finally{btn.disabled=false;btn.textContent=oldText;}
}
function install(){
  if(installed||el('exportCommissionFiltersBtn'))return;installed=true;
  const confirm=el('applyCommissionFiltersBtn'),reset=el('clearCommissionFiltersBtn');
  const actions=confirm?.parentElement||reset?.parentElement;if(!actions){installed=false;return;}
  const btn=document.createElement('button');btn.id='exportCommissionFiltersBtn';btn.type='button';btn.className='secondary';btn.textContent='导出 Excel';btn.style.minHeight='42px';btn.style.flex='1';btn.onclick=exportFiltered;
  actions.appendChild(btn);
}
function wait(){
  if(typeof sb==='undefined'||!el('manualCommissionFilterPanel')||!el('applyCommissionFiltersBtn')){setTimeout(wait,120);return;}
  install();
}
wait();
})();
