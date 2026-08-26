// 界面优化：库存管理使用更大的屏幕空间，名称列可调整宽度。
(function(){
  let inventoryNameWidth=Number(localStorage.getItem('inventoryNameWidth')||260),resizeReady=false;
  function text(sel,value){const el=document.querySelector(sel);if(el)el.textContent=value;}
  function hideInventorySpec(){const table=document.querySelector('#inventory table');if(!table)return;const head=table.querySelector('thead tr');if(head&&head.children[2])head.children[2].style.display='none';table.querySelectorAll('tbody tr').forEach(tr=>{if(tr.children[2])tr.children[2].style.display='none';});applyWidth();setupResize();}
  function applyWidth(){inventoryNameWidth=Math.max(160,Math.min(650,inventoryNameWidth));document.querySelector('#inventory .tablewrap')?.style.setProperty('--inventory-name-width',inventoryNameWidth+'px');}
  function setupResize(){if(resizeReady)return;const th=document.querySelector('#inventory table thead th:first-child');if(!th)return;resizeReady=true;const h=document.createElement('span');h.className='inventory-col-resizer';h.title='拖动调整宽度';th.appendChild(h);h.onmousedown=e=>{e.preventDefault();const sx=e.clientX,sw=inventoryNameWidth;document.body.classList.add('resizing-column');const move=ev=>{inventoryNameWidth=sw+ev.clientX-sx;applyWidth();};const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);document.body.classList.remove('resizing-column');localStorage.setItem('inventoryNameWidth',inventoryNameWidth);};document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);};}
  function polish(){document.title='饮料库存管理系统';text('header h1','饮料库存管理系统');text('header .subtitle','库存 · 调拨 · 销售提成');text('#inventory .section-head h2','库存明细');const commissionStat=document.getElementById('statCommission');if(commissionStat){const label=commissionStat.closest('.stat')?.querySelector('small');if(label)label.textContent='总提成';}hideInventorySpec();}
  function addStyle(){if(document.getElementById('uiPolishStyle'))return;const s=document.createElement('style');s.id='uiPolishStyle';s.textContent=`
    body{letter-spacing:.01em}main{max-width:none;width:100%;padding:0 18px}.content-area{min-width:0}
    #inventory{width:calc(100vw - 290px);max-width:none;margin-left:0}
    #inventory .toolbar{margin-bottom:12px}
    #inventory>.card{padding:14px 16px;border-radius:14px}
    #inventory .tablewrap{height:calc(100vh - 190px);max-height:calc(100vh - 190px);overflow:auto;position:relative;padding-top:0}
    #inventory table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;table-layout:fixed}
    #inventory table thead th{position:sticky;top:0;z-index:21;background:#f8fafc!important;padding:14px 10px;min-width:90px}
    #inventory table td{padding:13px 10px}
    #inventory table th:first-child,#inventory table td:first-child{position:sticky;left:0;width:var(--inventory-name-width);min-width:var(--inventory-name-width);max-width:var(--inventory-name-width);background:#fff!important;box-shadow:2px 0 0 #e5e7eb}
    #inventory table tbody td:first-child{z-index:10;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #inventory table thead th:first-child{z-index:30;background:#f8fafc!important;overflow:visible}
    .inventory-col-resizer{position:absolute;right:-4px;top:0;width:9px;height:100%;cursor:col-resize;z-index:50}.inventory-col-resizer:hover{background:rgba(24,57,87,.18)}body.resizing-column{cursor:col-resize;user-select:none}
    @media(max-width:900px){#inventory{width:calc(100vw - 110px)}}@media(max-width:620px){main{padding:0 8px}#inventory{width:100%}#inventory .tablewrap{height:65vh;max-height:65vh}}
  `;document.head.appendChild(s);}
  function run(){addStyle();polish();setInterval(hideInventorySpec,600);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();