// 账号目录 + Admin/User 权限界面。
(function(){
  let installed=false;
  let currentRole='user';

  function wait(){
    if(typeof sb==='undefined'||typeof accountClient==='undefined'||typeof createAccount!=='function'||!document.getElementById('managementPanel')){setTimeout(wait,150);return;}
    install();
  }

  async function install(){
    if(installed)return;installed=true;
    await ensureCurrentAccount();
    await loadCurrentRole();
    buildAccountUI();
    applyRoleUI();
    if(currentRole==='admin')await loadAccounts();
  }

  async function ensureCurrentAccount(){
    const email=userEmail();if(!email)return;
    const {data}=await sb.from('app_accounts').select('id,email,role').eq('email',email).maybeSingle();
    if(data)return;
    // 如果目录还是空的，数据库策略允许第一个登录账号把自己登记成 admin。
    await sb.from('app_accounts').insert({email,role:'admin',created_by:email});
  }

  async function loadCurrentRole(){
    const email=userEmail();if(!email)return;
    const {data}=await sb.from('app_accounts').select('role').eq('email',email).maybeSingle();
    currentRole=data?.role||'user';
    window.currentAppRole=currentRole;
  }

  function buildAccountUI(){
    const panel=document.getElementById('managementPanel');if(!panel)return;
    const accountCard=[...panel.querySelectorAll('div')].find(x=>x.querySelector(':scope > h3')?.textContent.includes('新增登录账号'));
    if(!accountCard)return;

    if(!document.getElementById('newAccountRole')){
      const pwd=document.getElementById('newAccountPassword');
      const wrap=document.createElement('label');wrap.style.cssText='display:block;font-size:12px;color:#6b7280;margin-bottom:8px';
      wrap.innerHTML='账号权限<select id="newAccountRole" style="width:100%;margin-top:5px"><option value="user">User</option><option value="admin">Admin</option></select>';
      pwd.parentElement.insertBefore(wrap,pwd.nextSibling);
    }

    if(!document.getElementById('accountDirectory')){
      const box=document.createElement('div');box.id='accountDirectory';box.style.marginTop='18px';
      box.innerHTML='<div class="section-head"><h3 style="margin:0;font-size:16px">已建立账号</h3><span class="hint">Admin 可修改权限</span></div><div id="accountDirectoryList" class="hint">读取中...</div>';
      accountCard.appendChild(box);
    }

    createAccount=async function(){
      if(currentRole!=='admin')return alert('只有 Admin 可以新增账号');
      const email=document.getElementById('newAccountEmail').value.trim();
      const password=document.getElementById('newAccountPassword').value;
      const role=document.getElementById('newAccountRole').value;
      const msg=document.getElementById('accountCreateMsg');
      if(!email)return alert('请输入 Email');
      if(password.length<6)return alert('密码至少 6 位');
      msg.textContent='建立中...';
      const {data,error}=await accountClient.auth.signUp({email,password});
      if(error){msg.textContent='建立失败：'+error.message;return;}
      const saved=await sb.from('app_accounts').upsert({email,role,created_by:userEmail()},{onConflict:'email'});
      if(saved.error){msg.textContent='登录账号已建立，但账号名单保存失败：'+saved.error.message;return;}
      document.getElementById('newAccountEmail').value='';
      document.getElementById('newAccountPassword').value='';
      document.getElementById('newAccountRole').value='user';
      msg.textContent=data.user?`账号已建立（${role==='admin'?'Admin':'User'}）。`:'已提交账号建立请求。';
      await loadAccounts();
    };
    const btn=document.getElementById('createAccountBtn');if(btn)btn.onclick=createAccount;
  }

  function applyRoleUI(){
    const isAdmin=currentRole==='admin';
    const settingsLink=document.querySelector('.side-nav a[href="#settings"]');
    if(settingsLink)settingsLink.style.display=isAdmin?'flex':'none';
    const settings=document.getElementById('settings');if(settings&&!isAdmin)settings.style.display='none';

    // 产品类别管理仅 Admin 显示；User 仍可在库存筛选里查看类别。
    const cat=document.getElementById('dashboardCategoryPanel');if(cat)cat.style.display=isAdmin?'block':'none';

    const addBtn=document.getElementById('addBtn');if(addBtn)addBtn.style.display=isAdmin?'':'none';
    const drawerEdit=document.getElementById('drawerEditBtn');if(drawerEdit)drawerEdit.style.display=isAdmin?'':'none';
    const drawerDelete=document.getElementById('drawerDeleteBtn');if(drawerDelete)drawerDelete.style.display=isAdmin?'':'none';

    // User 不显示提成删除按钮；数据库也会阻止删除。
    document.body.classList.toggle('app-user-role',!isAdmin);
    if(!document.getElementById('rolePermissionStyle')){
      const style=document.createElement('style');style.id='rolePermissionStyle';
      style.textContent='.app-user-role .commission-delete-btn{display:none!important}.app-user-role #dashboardCategoryPanel{display:none!important}';
      document.head.appendChild(style);
    }

    const emailEl=document.getElementById('userEmail');
    if(emailEl&&!document.getElementById('currentRoleBadge')){
      const badge=document.createElement('span');badge.id='currentRoleBadge';badge.className='pill';badge.style.marginLeft='6px';badge.textContent=isAdmin?'Admin':'User';emailEl.insertAdjacentElement('afterend',badge);
    }
  }

  async function loadAccounts(){
    const list=document.getElementById('accountDirectoryList');if(!list)return;
    const {data,error}=await sb.from('app_accounts').select('*').order('created_at',{ascending:false});
    if(error){list.innerHTML='请先在 Supabase 运行 account-directory-upgrade.sql。';return;}
    const rows=data||[];
    list.innerHTML=rows.map(x=>`<div style="display:grid;grid-template-columns:minmax(180px,1fr) 120px 100px;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #eee"><b style="color:#172033;overflow-wrap:anywhere">${esc(x.email)}</b><select class="account-role-select" data-id="${x.id}" data-email="${esc(x.email)}"><option value="user" ${x.role==='user'?'selected':''}>User</option><option value="admin" ${x.role==='admin'?'selected':''}>Admin</option></select><span>${new Date(x.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'})}</span></div>`).join('')||'还没有账号记录。';
    list.querySelectorAll('.account-role-select').forEach(sel=>sel.onchange=()=>changeRole(sel));
  }

  async function changeRole(sel){
    if(currentRole!=='admin')return;
    const id=sel.dataset.id,email=sel.dataset.email,role=sel.value;
    if(email.toLowerCase()===userEmail().toLowerCase()&&role==='user'){
      if(!confirm('你正在把自己的 Admin 权限改成 User。改完后你将无法进入账号管理。确定继续吗？')){await loadAccounts();return;}
    }
    const {error}=await sb.from('app_accounts').update({role}).eq('id',id);
    if(error){alert('修改权限失败：'+error.message);await loadAccounts();return;}
    if(email.toLowerCase()===userEmail().toLowerCase()){
      currentRole=role;window.currentAppRole=role;applyRoleUI();
    }
  }

  wait();
})();