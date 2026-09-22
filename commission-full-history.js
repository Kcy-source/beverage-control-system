// 员工提成记录完整读取：移除 app.js 只取最近 100 条的限制，按分页加载全部历史记录。
(function(){
  'use strict';
  let installed=false;
  let loading=false;

  async function fetchAllCommissions(){
    const all=[];
    const pageSize=1000;
    let from=0;
    while(true){
      const {data,error}=await sb
        .from('commission_logs')
        .select('*')
        .order('operation_date',{ascending:false})
        .order('created_at',{ascending:false})
        .range(from,from+pageSize-1);
      if(error)throw error;
      const page=data||[];
      all.push(...page);
      if(page.length<pageSize)break;
      from+=pageSize;
    }
    return all;
  }

  async function reloadCompleteCommissions(){
    if(loading||typeof sb==='undefined'||typeof commissions==='undefined')return;
    loading=true;
    try{
      commissions=await fetchAllCommissions();
      if(typeof render==='function')render();
    }catch(e){
      console.error('读取完整提成记录失败',e);
    }finally{
      loading=false;
    }
  }

  function install(){
    if(installed)return;
    installed=true;

    const originalLoadAll=window.loadAll;
    if(typeof originalLoadAll==='function'){
      window.loadAll=async function(){
        const result=await originalLoadAll.apply(this,arguments);
        await reloadCompleteCommissions();
        return result;
      };
    }

    // 首次打开页面时，app.js 已经可能只载入了最近 100 条，所以立即补齐全部记录。
    reloadCompleteCommissions();
  }

  function wait(){
    if(typeof sb==='undefined'||typeof commissions==='undefined'||typeof render!=='function'){
      setTimeout(wait,120);
      return;
    }
    install();
  }

  wait();
})();