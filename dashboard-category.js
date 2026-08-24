// 工作台的产品类别默认缩小，点击后展开/收起。
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
    const grid=panel.querySelector('div[style*="grid-template-columns"]');if(!grid)return;
    const cards=[...grid.children];
    const categoryCard=cards.find(card=>card.textContent.includes('产品类别'));if(!categoryCard)return;

    let section=document.getElementById('dashboardCategoryPanel');
    if(!section){section=document.createElement('div');section.id='dashboardCategoryPanel';section.className='card';section.style.cssText='margin-top:14px;padding:0;overflow:hidden;';dashboard.appendChild(section);}
    section.innerHTML='';

    const head=document.createElement('button');
    head.type='button';head.id='dashboardCategoryToggle';
    head.style.cssText='width:100%;display:flex;justify-content:space-between;align-items:center;padding:15px 17px;background:#fff;color:#172033;border-radius:15px;text-align:left;';
    head.innerHTML='<span><b style="font-size:16px">产品类别</b><small style="display:block;color:#6b7280;margin-top:3px">点击展开管理类别</small></span><span id="dashboardCategoryArrow" style="font-size:20px">＋</span>';

    const content=document.createElement('div');content.id='dashboardCategoryContent';content.style.cssText='display:none;padding:0 17px 17px;';
    content.appendChild(categoryCard);categoryCard.style.border='0';categoryCard.style.padding='0';
    const innerTitle=categoryCard.querySelector('h3');if(innerTitle)innerTitle.style.display='none';
    section.appendChild(head);section.appendChild(content);

    head.onclick=()=>{const open=content.style.display==='none';content.style.display=open?'block':'none';document.getElementById('dashboardCategoryArrow').textContent=open?'−':'＋';head.querySelector('small').textContent=open?'点击收起产品类别':'点击展开管理类别';};

    const managementTitle=panel.querySelector('.section-head h2');if(managementTitle)managementTitle.textContent='账号管理';
  }
  wait();
})();