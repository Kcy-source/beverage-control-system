// 工作台“本月总提成”：按 operation_date 统计当前月份全部提成记录。
(function(){
  'use strict';
  let installed=false;

  function monthRange(){
    const now=new Date();
    const y=Number(now.toLocaleString('en-US',{timeZone:'Asia/Singapore',year:'numeric'}));
    const m=Number(now.toLocaleString('en-US',{timeZone:'Asia/Singapore',month:'2-digit'}));
    const start=`${y}-${String(m).padStart(2,'0')}-01`;
    const ny=m===12?y+1:y;
    const nm=m===12?1:m+1;
    const next=`${ny}-${String(nm).padStart(2,'0')}-01`;
    return {start,next};
  }

  async function refreshMonthlyCommission(){
    const stat=document.getElementById('statCommission');
    if(!stat||typeof sb==='undefined')return;
    const label=stat.closest('.stat')?.querySelector('small');
    if(label)label.textContent='本月总提成';
    const {start,next}=monthRange();
    const {data,error}=await sb.from('commission_logs')
      .select('commission_amount,operation_date,created_at')
      .gte('operation_date',start)
      .lt('operation_date',next);
    if(error){console.error('读取本月总提成失败',error);return;}
    const total=(data||[]).reduce((sum,r)=>sum+Number(r.commission_amount||0),0);
    stat.textContent='$'+total.toFixed(2);
  }

  function install(){
    if(installed)return;installed=true;
    const originalLoadAll=window.loadAll;
    if(typeof originalLoadAll==='function'){
      window.loadAll=async function(){
        const result=await originalLoadAll.apply(this,arguments);
        await refreshMonthlyCommission();
        return result;
      };
    }
    refreshMonthlyCommission();
    setInterval(refreshMonthlyCommission,60000);
  }

  function wait(){
    if(typeof sb==='undefined'||!document.getElementById('statCommission')){setTimeout(wait,150);return;}
    install();
  }
  wait();
})();