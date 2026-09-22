// 销售提成：只固定“汇总栏 + 表头”的显示副本；不改动筛选栏、原表格结构或页面布局。
(function(){
  'use strict';

  let overlay=null;
  let summaryCopy=null;
  let headerViewport=null;
  let headerTable=null;
  let section=null;
  let summary=null;
  let table=null;

  function build(){
    if(document.getElementById('commissionSummaryHeaderOverlay'))return;
    overlay=document.createElement('div');
    overlay.id='commissionSummaryHeaderOverlay';
    overlay.innerHTML='<div class="commission-fixed-summary-copy"></div><div class="commission-fixed-head-viewport"><table><thead></thead></table></div>';
    document.body.appendChild(overlay);
    summaryCopy=overlay.querySelector('.commission-fixed-summary-copy');
    headerViewport=overlay.querySelector('.commission-fixed-head-viewport');
    headerTable=overlay.querySelector('table');

    const style=document.createElement('style');
    style.id='commissionSummaryHeaderOverlayStyle';
    style.textContent=`
#commissionSummaryHeaderOverlay{
  position:fixed;
  top:0;
  z-index:5000;
  display:none;
  box-sizing:border-box;
  background:#fff;
  box-shadow:0 2px 8px rgba(15,23,42,.08);
  pointer-events:none;
  padding-top:8px;
}
#commissionSummaryHeaderOverlay .commission-fixed-summary-copy{
  display:inline-flex;
  align-items:center;
  min-height:34px;
  padding:7px 11px;
  margin:0 0 10px 0;
  border-radius:9px;
  background:#f1f5f9;
  color:#475467;
  font-weight:600;
  white-space:nowrap;
}
#commissionSummaryHeaderOverlay .commission-fixed-head-viewport{
  width:100%;
  overflow:hidden;
  background:#f8fafc;
  border-bottom:1px solid #e5e7eb;
}
#commissionSummaryHeaderOverlay table{
  border-collapse:collapse;
  table-layout:fixed;
  margin:0;
}
#commissionSummaryHeaderOverlay th{
  background:#f8fafc!important;
  color:#6b7280;
  font-size:12px;
  text-align:left;
  border-bottom:1px solid #e5e7eb;
  padding:10px 8px;
  white-space:nowrap;
  box-sizing:border-box;
}
`;
    document.head.appendChild(style);
  }

  function bindTargets(){
    section=document.getElementById('commission');
    summary=document.getElementById('manualCommissionSummary');
    table=section?.querySelector('table')||null;
    return !!(section&&summary&&table&&table.tHead);
  }

  function syncHeader(){
    if(!bindTargets())return false;
    summaryCopy.textContent=summary.textContent||'';

    const originalRow=table.tHead.rows[0];
    if(!originalRow)return false;
    const clone=originalRow.cloneNode(true);
    clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    const thead=headerTable.tHead;
    thead.innerHTML='';
    thead.appendChild(clone);

    const originalCells=[...originalRow.cells];
    const cloneCells=[...clone.cells];
    originalCells.forEach((cell,i)=>{
      const width=cell.getBoundingClientRect().width;
      if(cloneCells[i]){
        cloneCells[i].style.width=width+'px';
        cloneCells[i].style.minWidth=width+'px';
        cloneCells[i].style.maxWidth=width+'px';
      }
    });
    headerTable.style.width=Math.max(table.scrollWidth,table.getBoundingClientRect().width)+'px';
    return true;
  }

  function update(){
    if(!overlay||!bindTargets())return;
    const sectionStyle=getComputedStyle(section);
    if(sectionStyle.display==='none'||section.closest('.hidden')){
      overlay.style.display='none';
      return;
    }

    const summaryRect=summary.getBoundingClientRect();
    const tableRect=table.getBoundingClientRect();
    const sectionRect=section.getBoundingClientRect();

    // 只有原汇总栏已经滚出顶部，且表格仍在视窗中时才显示固定副本。
    const shouldShow=summaryRect.top<0 && tableRect.bottom>70 && sectionRect.bottom>70;
    if(!shouldShow){
      overlay.style.display='none';
      return;
    }

    if(!syncHeader()){
      overlay.style.display='none';
      return;
    }

    const left=Math.max(0,sectionRect.left);
    const right=Math.min(window.innerWidth,sectionRect.right);
    const width=Math.max(0,right-left);
    overlay.style.left=left+'px';
    overlay.style.width=width+'px';
    overlay.style.display='block';

    const scrollLeft=section.scrollLeft||0;
    headerTable.style.transform='translateX('+(-scrollLeft)+'px)';
  }

  function install(){
    build();
    if(!bindTargets()){setTimeout(install,150);return;}

    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update,{passive:true});
    section.addEventListener('scroll',update,{passive:true});

    const observer=new MutationObserver(()=>requestAnimationFrame(update));
    observer.observe(section,{childList:true,subtree:true,characterData:true});

    update();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();