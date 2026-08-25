// 界面文案与视觉细节优化：使用简洁、正式的后台管理用语。
(function(){
  function text(sel,value){const el=document.querySelector(sel);if(el)el.textContent=value;}
  function attr(sel,name,value){const el=document.querySelector(sel);if(el)el.setAttribute(name,value);}
  function polish(){
    document.title='饮料库存管理系统';text('header h1','饮料库存管理系统');text('header .subtitle','库存 · 调拨 · 销售提成');text('#loginView h2','系统登录');
    const loginP=document.querySelector('#loginView p:not(.msg)');if(loginP)loginP.textContent='请输入授权账号信息。';attr('#email','placeholder','账号 Email');attr('#search','placeholder','搜索名称、类别或规格');text('#inventory .section-head h2','库存明细');
    const commissionTitle=document.querySelector('#commission .section-head h2');if(commissionTitle)commissionTitle.textContent='销售提成';const status=document.getElementById('commissionStatus');if(status)status.textContent='';
    const sideBrand=document.querySelector('.side-brand b');if(sideBrand)sideBrand.textContent='库存管理';const sideSmall=document.querySelector('.side-brand small');if(sideSmall)sideSmall.textContent='BEVERAGE INVENTORY';document.querySelectorAll('.side-label').forEach(el=>{if(el.textContent.trim()==='员工提成')el.textContent='销售提成';});const note=document.querySelector('.side-note');if(note)note.remove();
    const itemHint=document.querySelector('#itemDialog .full.hint');if(itemHint)itemHint.textContent='总库存由冰箱库存与仓库库存自动汇总。';attr('#itemName','placeholder','饮料名称');attr('#itemSpec','placeholder','例如：320ml');attr('#stockNote','placeholder','填写备注（选填）');const seller=document.getElementById('stockSeller');if(seller)seller.placeholder='员工姓名';
    text('.danger-zone h3','删除饮料');const dangerP=document.querySelector('.danger-zone p');if(dangerP)dangerP.remove();text('#drawerDeleteBtn','删除');
    document.querySelectorAll('.hint').forEach(el=>{el.textContent=el.textContent.replace('可以选择以前的日期补录数据','支持历史日期补录').replace('点击展开管理类别','展开类别管理').replace('点击收起产品类别','收起类别管理').replace('新增或管理饮料类别','类别管理').replace('可修改权限、停用、启用或删除名单记录','账号权限与状态管理').replace('Admin 可修改权限','账号权限管理');});
  }
  function addStyle(){if(document.getElementById('uiPolishStyle'))return;const s=document.createElement('style');s.id='uiPolishStyle';s.textContent='body{letter-spacing:.01em}header{box-shadow:0 1px 0 rgba(255,255,255,.08)}.card{box-shadow:0 1px 3px rgba(15,23,42,.04)}.section-head h2{font-weight:700;letter-spacing:.01em}button{font-weight:600}button.secondary{font-weight:500}.sidebar{box-shadow:0 8px 24px rgba(0,0,0,.08)}.side-nav a{font-weight:500}.side-nav a.active{font-weight:700}th{font-weight:600;letter-spacing:.02em}.hint{line-height:1.45}dialog .modal h3,.drawer-head h2{font-weight:700}';document.head.appendChild(s);}
  function run(){addStyle();polish();setTimeout(polish,400);setTimeout(polish,1200);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();