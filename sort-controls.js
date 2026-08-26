// 饮料排序：可按名称或类别排序，工作台与库存管理同步。
(function(){
  let installed=false;
  function wait(){if(typeof render!=='function'||!document.getElementById('inventory')||!document.getElementById('dashboardProducts')){setTimeout(wait,150);return;}install();}
  function install(){if(installed)return;installed=true;buildControls();const oldRender=render;render=function(){oldRender();setTimeout(applySort,0);};applySort();}
  function buildControls(){
    const saved=localStorage.getItem('beverageSortMode')||'name';
    const toolbar=document.querySelector('#inventory .toolbar');
    if(toolbar&&!document.getElementById('inventorySortMode')){
      const sel=document.createElement('select');sel.id='inventorySortMode';sel.innerHTML='<option value="name">按名称排序</option><option value="category">按类别排序</option>';sel.value=saved;sel.onchange=syncSort;toolbar.insertBefore(sel,document.getElementById('addBtn'));
    }
    const head=document.querySelector('#dashboardProducts>.section-head');
    if(head&&!document.getElementById('dashboardSortMode')){
      const right=document.createElement('div');right.style.cssText='display:flex;align-items:center;gap:10px';
      const count=document.getElementById('dashboardProductCount');if(count)right.appendChild(count);
      const sel=document.createElement('select');sel.id='dashboardSortMode';sel.style.cssText='padding:7px 10px;border-radius:8px';sel.innerHTML='<option value="name">按名称排序</option><option value="category">按类别排序</option>';sel.value=saved;sel.onchange=syncSort;right.appendChild(sel);head.appendChild(right);
    }
  }
  function syncSort(e){const mode=e.target.value;localStorage.setItem('beverageSortMode',mode);const a=document.getElementById('inventorySortMode'),b=document.getElementById('dashboardSortMode');if(a)a.value=mode;if(b)b.value=mode;applySort();}
  function applySort(){const mode=localStorage.getItem('beverageSortMode')||'name';sortTable(document.getElementById('inventoryBody'),mode,0,1);sortTable(document.getElementById('dashboardProductsBody'),mode,0,1);}
  function sortTable(body,mode,nameIndex,catIndex){if(!body)return;const rows=[...body.querySelectorAll('tr')];if(rows.length<2)return;rows.sort((a,b)=>{const an=(a.children[nameIndex]?.textContent||'').trim(),bn=(b.children[nameIndex]?.textContent||'').trim(),ac=(a.children[catIndex]?.textContent||'').trim(),bc=(b.children[catIndex]?.textContent||'').trim();if(mode==='category'){const c=ac.localeCompare(bc,'zh-CN',{numeric:true,sensitivity:'base'});if(c!==0)return c;}return an.localeCompare(bn,'zh-CN',{numeric:true,sensitivity:'base'});});rows.forEach(r=>body.appendChild(r));}
  wait();
})();