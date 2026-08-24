// 为新增/编辑、入库/出库/盘点增加必选“日期”，允许补录以前日期的数据。
(function(){
  function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
  function wait(){if(typeof saveItem!=='function'||typeof saveStock!=='function'||typeof render!=='function'||typeof sb==='undefined'){setTimeout(wait,120);return;}install();}
  function addDate(dialogId,inputId){const dialog=document.getElementById(dialogId);if(!dialog||document.getElementById(inputId))return;const grid=dialog.querySelector('.grid2');if(!grid)return;const label=document.createElement('label');label.className='full';label.innerHTML=`日期<input id="${inputId}" type="date" required><span class="hint">可以选择以前的日期补录数据</span>`;grid.insertBefore(label,grid.firstChild);}
  function setToday(id){const e=document.getElementById(id);if(e)e.value=today();}
  function install(){
    addDate('itemDialog','itemOperationDate');addDate('stockDialog','stockOperationDate');
    const oldNew=newItem;newItem=function(){oldNew();setToday('itemOperationDate');};
    const oldEdit=editItem;editItem=function(id){oldEdit(id);setToday('itemOperationDate');};
    const oldOpenStock=openStock;openStock=function(id,action){oldOpenStock(id,action);setToday('stockOperationDate');};
    const oldSaveItem=saveItem;saveItem=async function(){const d=document.getElementById('itemOperationDate')?.value;if(!d)return alert('请选择日期');window.__operationDate=d;return oldSaveItem();};
    const oldSaveStock=saveStock;saveStock=async function(){const d=document.getElementById('stockOperationDate')?.value;if(!d)return alert('请选择日期');window.__operationDate=d;return oldSaveStock();};
    const originalFrom=sb.from.bind(sb);sb.from=function(table){const q=originalFrom(table);if(table!=='inventory_logs'&&table!=='commission_logs')return q;const originalInsert=q.insert.bind(q);q.insert=function(values,...args){const d=window.__operationDate;if(d){if(Array.isArray(values))values=values.map(v=>({...v,operation_date:v.operation_date||d}));else if(values&&typeof values==='object')values={...values,operation_date:values.operation_date||d};}return originalInsert(values,...args);};return q;};
    const oldRender=render;render=function(){oldRender();const body=document.getElementById('logBody');if(body){[...body.rows].forEach((tr,i)=>{const x=logs[i];if(x?.operation_date&&tr.cells[0])tr.cells[0].textContent=x.operation_date;});}const cb=document.getElementById('commissionBody');if(cb){[...cb.rows].forEach((tr,i)=>{const x=commissions[i];if(x?.operation_date&&tr.cells[0])tr.cells[0].textContent=x.operation_date;});}};
  }
  wait();
})();