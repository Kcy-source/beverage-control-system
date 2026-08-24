// 把产品类别管理从“管理设置”移动到工作台；管理设置保留账号管理。
(function(){
  let installed=false;
  function wait(){
    if(typeof ensureManagementUI!=='function'||!document.getElementById('dashboard')){setTimeout(wait,120);return;}
    const panel=document.getElementById('managementPanel');
    if(!panel){setTimeout(wait,120);return;}
    install();
  }
  function install(){
    if(installed)return;installed=true;
    const panel=document.getElementById('managementPanel');
    const dashboard=document.getElementById('dashboard');
    if(!panel||!dashboard)return;

    // 管理面板目前有两个子卡片：产品类别、账号管理。
    const grid=panel.querySelector('div[style*="grid-template-columns"]');
    if(!grid)return;
    const cards=[...grid.children];
    const categoryCard=cards.find(card=>card.textContent.includes('产品类别'));
    if(!categoryCard)return;

    let section=document.getElementById('dashboardCategoryPanel');
    if(!section){
      section=document.createElement('div');
      section.id='dashboardCategoryPanel';
      section.className='card';
      section.style.marginTop='14px';
      section.innerHTML='<div class="section-head"><h2>产品类别</h2><span class="hint">新增或管理饮料类别</span></div>';
      dashboard.appendChild(section);
    }
    section.appendChild(categoryCard);
    categoryCard.style.border='0';
    categoryCard.style.padding='0';
    const innerTitle=categoryCard.querySelector('h3');if(innerTitle)innerTitle.style.display='none';

    // 管理设置只保留账号相关功能。
    const managementTitle=panel.querySelector('.section-head h2');
    if(managementTitle)managementTitle.textContent='账号管理';
  }
  wait();
})();