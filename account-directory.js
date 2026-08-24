// 新增账号后，在账号管理页面持续显示账号名单。
(function(){
  let installed=false;
  function wait(){
    if(typeof sb==='undefined'||typeof createAccount!=='function'||!document.getElementById('managementPanel')){setTimeout(wait,150);return;}
    install();
  }
  function install(){
    if(installed)return;installed=true;
    const panel=document.getElementById('managementPanel');
    const accountCard=[...panel.querySelectorAll('div')].find(x=>x.querySelector(':scope > h3')?.textContent.includes('新增登录账号'));
    if(accountCard&&!document.getElementById('accountDirectory')){
      const box=document.createElement('div');box.id='accountDirectory';box.style.marginTop='16px';box.innerHTML='<h3 style="margin:0 0 10px;font-size:16px">已建立账号</h3><div id="accountDirectoryList" class="hint">读取中...</div>';accountCard.appendChild(box);
    }

    createAccount=async function(){
      const email=document.getElementById('newAccountEmail').value.trim();
      const password=document.getElementById('newAccountPassword').value;
      const msg=document.getElementById('accountCreateMsg');
      if(!email)return alert('请输入 Email');
      if(password.length<6)return alert('密码至少 6 位');
      msg.textContent='建立中...';
      const {data,error}=await accountClient.auth.signUp({email,password});
      if(error){msg.textContent='建立失败：'+error.message;return;}
      const saved=await sb.from('app_accounts').upsert({email,created_by:userEmail()},{onConflict:'email'});
      if(saved.error){msg.textContent='登录账号已建立，但账号名单保存失败。请先运行 account-directory-upgrade.sql。';return;}
      document.getElementById('newAccountEmail').value='';document.getElementById('newAccountPassword').value='';
      msg.textContent=data.user?'账号已建立。':'已提交账号建立请求。';
      await loadAccounts();
    };
    const btn=document.getElementById('createAccountBtn');if(btn)btn.onclick=createAccount;
    loadAccounts();
  }
  async function loadAccounts(){
    const list=document.getElementById('accountDirectoryList');if(!list)return;
    const {data,error}=await sb.from('app_accounts').select('*').order('created_at',{ascending:false});
    if(error){list.innerHTML='请先运行 account-directory-upgrade.sql，之后新建的账号会显示在这里。';return;}
    const rows=data||[];
    list.innerHTML=rows.map(x=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #eee"><b style="color:#172033">${esc(x.email)}</b><span>${new Date(x.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'})}</span></div>`).join('')||'还没有通过这个页面建立的账号。';
  }
  wait();
})();