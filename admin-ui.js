document.addEventListener('DOMContentLoaded',()=>{
  const app=document.getElementById('appView');
  const login=document.getElementById('loginView');
  if(!app||!login)return;
  const header=document.querySelector('body>header');
  const main=document.querySelector('body>main');

  const sidebar=document.createElement('aside');
  sidebar.className='admin-sidebar hidden';
  sidebar.id='adminSidebar';
  sidebar.innerHTML=`<div class="admin-brand"><b>酒水管理</b><small>Beverage Control</small></div>
  <nav class="admin-nav">
    <button class="active" data-page="dashboard"><span class="admin-icon">▣</span><span class="admin-label">工作台</span></button>
    <button data-page="inventory"><span class="admin-icon">▤</span><span class="admin-label">库存管理</span></button>
    <button data-page="commission"><span class="admin-icon">$</span><span class="admin-label">员工提成</span></button>
    <button data-page="sales"><span class="admin-icon">↗</span><span class="admin-label">销售记录</span></button>
    <button data-page="logs"><span class="admin-icon">▧</span><span class="admin-label">操作记录</span></button>
    <button data-page="settings"><span class="admin-icon">⚙</span><span class="admin-label">数据设置</span></button>
  </nav><div class="admin-sidebar-foot"><span id="adminUser"></span><button id="adminLogout">退出登录</button></div>`;
  document.body.appendChild(sidebar);

  const shell=document.createElement('div');shell.className='admin-shell hidden';shell.id='adminShell';
  shell.innerHTML=`<div class="admin-topbar"><div><div class="admin-title" id="adminTitle">工作台</div><div class="admin-sub">饮料酒水库存、销售与提成管理</div></div><div class="admin-sub" id="adminUpdated"></div></div><div class="admin-body" id="adminBody"></div>`;
  document.body.appendChild(shell);
  const body=document.getElementById('adminBody');

  const dashboard=document.createElement('section');dashboard.id='admin-dashboard';dashboard.className='admin-page active';
  dashboard.innerHTML=`<div class="stats" id="adminStats"></div><div class="admin-dashboard-grid"><div class="card"><div class="section-head"><h2>快捷操作</h2></div><div class="admin-quick"><button data-go="inventory">查看库存</button><button class="green" id="adminAdd">＋ 新增酒水</button><button data-go="commission">查看员工提成</button><button class="secondary" id="adminRefresh">刷新数据</button></div></div><div class="card"><div class="section-head"><h2>系统说明</h2></div><p class="admin-settings">左侧菜单可以切换库存、员工提成、销售记录和操作记录。点击酒水名称可从右侧打开详情，并可编辑或删除错误资料。</p></div></div>`;
  body.appendChild(dashboard);

  const cards=app.querySelectorAll('.card.tablewrap');
  const toolbar=app.querySelector('.toolbar');
  const inventory=document.createElement('section');inventory.id='admin-inventory';inventory.className='admin-page';if(toolbar)inventory.appendChild(toolbar);if(cards[0])inventory.appendChild(cards[0]);body.appendChild(inventory);
  const commission=document.createElement('section');commission.id='admin-commission';commission.className='admin-page';if(cards[1])commission.appendChild(cards[1]);body.appendChild(commission);
  const logsPage=document.createElement('section');logsPage.id='admin-logs';logsPage.className='admin-page';if(cards[2])logsPage.appendChild(cards[2]);body.appendChild(logsPage);
  const sales=document.createElement('section');sales.id='admin-sales';sales.className='admin-page';sales.innerHTML=`<div class="card tablewrap"><div class="section-head"><h2>销售记录</h2><span style="font-size:12px;color:#6b7280">仅显示卖出 / 出库</span></div><table><thead><tr><th>时间</th><th>酒水</th><th>数量</th><th>备注</th><th>操作人</th></tr></thead><tbody id="salesBody"></tbody></table></div>`;body.appendChild(sales);
  const settings=document.createElement('section');settings.id='admin-settings';settings.className='admin-page';settings.innerHTML=`<div class="card"><div class="section-head"><h2>数据设置</h2></div><p class="admin-settings">这里之后可以继续加入员工名单、批量导入、库存备份、提成规则和权限设置。现有数据仍保存在 Supabase。</p></div>`;body.appendChild(settings);

  function syncDashboard(){
    const source=app.querySelector('.stats'),target=document.getElementById('adminStats');if(source&&target)target.innerHTML=source.innerHTML;
    const u=document.getElementById('userEmail'),au=document.getElementById('adminUser');if(u&&au)au.textContent=u.textContent;
    const up=document.getElementById('updatedAt'),adu=document.getElementById('adminUpdated');if(up&&adu)adu.textContent=up.textContent;
    const salesBody=document.getElementById('salesBody');if(salesBody&&typeof logs!=='undefined'){salesBody.innerHTML=logs.filter(x=>x.action==='OUT').map(x=>`<tr><td>${fmt(x.created_at)}</td><td>${esc(x.item_name)}</td><td>${Number(x.quantity||0)}</td><td>${esc(x.note||'')}</td><td>${esc(x.user_email||'')}</td></tr>`).join('')||'<tr><td colspan="5">暂无销售记录</td></tr>'}
  }
  window.syncAdminDashboard=syncDashboard;
  function go(page){document.querySelectorAll('.admin-page').forEach(x=>x.classList.toggle('active',x.id==='admin-'+page));document.querySelectorAll('.admin-nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===page));const titles={dashboard:'工作台',inventory:'库存管理',commission:'员工提成',sales:'销售记录',logs:'操作记录',settings:'数据设置'};document.getElementById('adminTitle').textContent=titles[page]||'工作台';syncDashboard()}
  document.querySelectorAll('.admin-nav button').forEach(b=>b.onclick=()=>go(b.dataset.page));dashboard.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));document.getElementById('adminAdd').onclick=()=>newItem();document.getElementById('adminRefresh').onclick=()=>loadAll();document.getElementById('adminLogout').onclick=()=>logout();window.navigateTo=(p)=>go(p);

  function applyState(){const logged=!app.classList.contains('hidden');sidebar.classList.toggle('hidden',!logged);shell.classList.toggle('hidden',!logged);if(header)header.classList.toggle('admin-hidden',logged);if(main)main.classList.toggle('admin-hidden',logged);document.body.classList.toggle('admin-ready',logged);if(logged)syncDashboard()}
  const observer=new MutationObserver(applyState);observer.observe(app,{attributes:true,attributeFilter:['class']});applyState();
});