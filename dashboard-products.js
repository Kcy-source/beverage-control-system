// 工作台显示所有饮料；表格样式与库存管理一致。
(function(){
  function wait(){if(typeof render!=='function'||typeof items==='undefined'){setTimeout(wait,120);return;}install();}
  function install(){const dashboard=document.getElementById('dashboard');if(!dashboard)return;if(!document.getElementById('dashboardProducts')){const card=document.createElement('div');card.id='dashboardProducts';card.className='card';card.style.marginTop='14px';card.innerHTML=`<div class="section-head"><h2>所有饮料</h2><span id="dashboardProductCount" style="font-size:12px;color:#6b7280"></span></div><div id="dashboardProductsScroll" class="tablewrap"><table><thead><tr><th>名称</th><th>类别</th><th>规格</th><th>单位</th><th>冰箱</th><th>仓库</th><th>总库存</th><th>状态</th></tr></thead><tbody id="dashboardProductsBody"></tbody></table></div>`;dashboard.appendChild(card);addStyle();}const oldRender=render;render=function(){oldRender();renderDashboardProducts();};renderDashboardProducts();}
  function addStyle(){if(document.getElementById('dashboardStickyStyle'))return;const s=document.createElement('style');s.id='dashboardStickyStyle';s.textContent=`
    #dashboardProducts{padding:0;overflow:hidden}
    #dashboardProducts>.section-head{padding:18px 20px 12px;margin:0;background:#fff}
    #dashboardProductsScroll{height:70vh;max-height:70vh;overflow:auto;position:relative;padding:0 20px 14px;background:#fff;scrollbar-gutter:stable}
    #dashboardProductsScroll table{border-collapse:separate;border-spacing:0;width:100%;min-width:760px}
    #dashboardProductsScroll table thead{position:sticky;top:0;z-index:20}
    #dashboardProductsScroll table thead th{position:sticky;top:0;z-index:21;background:#f8fafc!important;color:#667085;font-weight:600;padding:14px 12px;border-bottom:1px solid #e5e7eb;box-shadow:none;white-space:nowrap}
    #dashboardProductsScroll table tbody td{padding:14px 12px;border-bottom:1px solid #e5e7eb;background:#fff}
    #dashboardProductsScroll table th:first-child,#dashboardProductsScroll table td:first-child{position:sticky;left:0;min-width:190px;background:#fff!important;box-shadow:2px 0 0 #e5e7eb}
    #dashboardProductsScroll table tbody td:first-child{z-index:10}
    #dashboardProductsScroll table thead th:first-child{z-index:30;background:#f8fafc!important}
  `;document.head.appendChild(s);}
  function renderDashboardProducts(){const body=document.getElementById('dashboardProductsBody');if(!body)return;document.getElementById('dashboardProductCount').textContent=`${items.length} 个品项`;body.innerHTML=items.map(x=>{const f=Number(x.fridge_quantity||0),w=Number(x.warehouse_quantity||0),t=f+w,low=t<=Number(x.min_quantity||0);return `<tr><td><button class="linkbtn" onclick="openItemDrawer('${x.id}')">${esc(x.name)}</button></td><td><span class="pill">${esc(x.category||'')}</span></td><td>${esc(x.spec||'')}</td><td>${esc(x.unit||'')}</td><td>${f}</td><td>${w}</td><td class="${low?'low':'ok'}">${t}</td><td class="${low?'low':'ok'}">${low?'低库存':'正常'}</td></tr>`;}).join('')||'<tr><td colspan="8">暂无饮料</td></tr>';}
  wait();
})();