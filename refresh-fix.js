// 修复库存管理刷新按钮，点击后重新读取 Supabase 数据并更新页面。
(function(){
  function wait(){
    const btn=document.getElementById('refreshBtn');
    if(!btn||typeof loadAll!=='function'){setTimeout(wait,150);return;}
    btn.onclick=async function(){
      if(btn.disabled)return;
      const old=btn.textContent;
      btn.disabled=true;
      btn.textContent='刷新中...';
      try{
        await loadAll();
      }catch(e){
        alert('刷新失败：'+String(e?.message||e));
      }finally{
        btn.disabled=false;
        btn.textContent=old||'刷新';
      }
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();