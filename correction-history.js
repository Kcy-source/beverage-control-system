// 独立的错单更正页面：集中查看所有 POS 错单调整。
(function(){
  let installed=false,rows=[];
  function wait(){if(typeof sb==='undefined'||typeof showPage!=='function'||!document.querySelector('.side-nav')||!document.querySelector('.content-area')){setTimeout(wait,150);return;}install();}
  function install(){if(installed)return;installed=true;buildPage();extendNavigation();loadCorrections();}
  function buildPage(){
    const content=document.querySelector('.content-area');if(!content||document.getElementById('corrections'))return;
    const section=document.createElement('div');section.id='corrections';section.className='card panel-anchor';section.style.display='none';section.innerHTML=`
      <div class="section-head"><h2>错单更正</h2><span id="correctionCount" class="hint"></span></div>
      <div id="correctionFilters" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:12px;margin:8px 0 14px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc">
        <label>开始日期<input id="correctionDateFrom" type="date"></label>
        <label>结束日期<input id="correctionDateTo" type="date"></label>
        <label>查找<input id="correctionKeyword" placeholder="饮料、备注或账号"></label>
        <div style="display:flex;align-items:flex-end"><button id="resetCorrectionFilters" class="secondary" style="width:100%">重置</button></div>
      </div>
      <div class="tablewrap" style="max-height:70vh;overflow:auto"><table style="min-width:980px"><thead><tr><th>日期</th><th>POS 开成</th><th>实际饮用</th><th>数量</th><th>恢复位置</th><th>扣减位置</th><th>备注</th><th>登记账号</th></tr></thead><tbody id="correctionHistoryBody"><tr><td colspan="8">读取中...</td></tr></tbody></table></div>`;
    content.appendChild(section);
    ['correctionDateFrom','correctionDateTo'].forEach(id=>document.getElementById(id).onchange=renderRows);
    document.getElementById('correctionKeyword').oninput=renderRows;
    document.getElementById('resetCorrectionFilters').onclick=()=>{document.getElementById('correctionDateFrom').value='';document.getElementById('correctionDateTo').value='';document.getElementById('correctionKeyword').value='';renderRows();};
    addStyle();
  }
  function extendNavigation(){
    const nav=document.querySelector('.side-nav');if(!nav)return;
    if(!nav.querySelector('a[href="#corrections"]')){
      const a=document.createElement('a');a.href='#corrections';a.innerHTML='<span class="side-icon">↺</span><span class="side-label">错单更正</span>';const settings=nav.querySelector('a[href="#settings"]');nav.insertBefore(a,settings||null);
    }
    const oldShowPage=showPage;
    showPage=function(page){
      const correction=document.getElementById('corrections');
      if(page==='corrections'){
        ['dashboard','inventory','commission','logs','settings'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
        if(correction)correction.style.display='block';
        document.querySelectorAll('.side-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#corrections'));
        window.scrollTo({top:0,behavior:'smooth'});loadCorrections();return;
      }
      if(correction)correction.style.display='none';oldShowPage(page);
    };
    document.querySelectorAll('.side-nav a').forEach(a=>{a.onclick=e=>{e.preventDefault();showPage(a.getAttribute('href').slice(1));};});
  }
  function dateOf(r){return r.operation_date||new Date(r.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
  function locationOf(note){return String(note||'').startsWith('仓库｜')?'仓库':'冰箱';}
  function cleanNote(note){let s=String(note||'');const parts=s.split('｜');return parts.slice(4).join('｜').replace(/^恢复误扣｜?/,'').replace(/^补扣实际｜?/,'');}
  async function loadCorrections(){
    const body=document.getElementById('correctionHistoryBody');if(!body)return;body.innerHTML='<tr><td colspan="8">读取中...</td></tr>';
    const {data,error}=await sb.from('inventory_logs').select('*').not('correction_ref','is',null).order('operation_date',{ascending:false}).order('created_at',{ascending:false}).limit(2000);
    if(error){body.innerHTML=`<tr><td colspan="8">读取失败：${esc(error.message)}</td></tr>`;return;}
    const groups=new Map();
    (data||[]).forEach(r=>{const key=String(r.correction_ref);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);});
    rows=[...groups.entries()].map(([ref,list])=>{
      const wrong=list.find(r=>r.action==='IN'),actual=list.find(r=>r.action==='OUT'),base=wrong||actual||list[0];
      return {ref,date:dateOf(base),wrong:wrong?.item_name||'',actual:actual?.item_name||'',qty:Number((wrong||actual)?.quantity||0),wrongLocation:wrong?locationOf(wrong.note):'',actualLocation:actual?locationOf(actual.note):'',note:cleanNote(wrong?.note||actual?.note||''),user:base?.user_email||'',created_at:base?.created_at||''};
    }).sort((a,b)=>b.date.localeCompare(a.date)||String(b.created_at).localeCompare(String(a.created_at)));
    renderRows();
  }
  function renderRows(){
    const body=document.getElementById('correctionHistoryBody'),count=document.getElementById('correctionCount');if(!body)return;
    const from=document.getElementById('correctionDateFrom')?.value||'',to=document.getElementById('correctionDateTo')?.value||'',kw=(document.getElementById('correctionKeyword')?.value||'').trim().toLowerCase();
    const filtered=rows.filter(r=>{if(from&&r.date<from)return false;if(to&&r.date>to)return false;if(kw&&!([r.wrong,r.actual,r.note,r.user,r.date].join(' ').toLowerCase().includes(kw)))return false;return true;});
    if(count)count.textContent=`${filtered.length} 条记录`;
    body.innerHTML=filtered.map(r=>`<tr><td>${esc(r.date)}</td><td><b>${esc(r.wrong)}</b></td><td><b>${esc(r.actual)}</b></td><td>${r.qty}</td><td>${esc(r.wrongLocation)}</td><td>${esc(r.actualLocation)}</td><td>${esc(r.note||'')}</td><td>${esc(r.user)}</td></tr>`).join('')||'<tr><td colspan="8">暂无错单更正记录</td></tr>';
  }
  function addStyle(){if(document.getElementById('correctionHistoryStyle'))return;const s=document.createElement('style');s.id='correctionHistoryStyle';s.textContent=`#correctionFilters label{font-size:12px;color:#667085;font-weight:600;display:flex;flex-direction:column;gap:6px}#correctionFilters input{min-height:42px}#corrections table thead th{position:sticky;top:0;z-index:5;background:#f8fafc!important}#corrections tbody td{vertical-align:top}`;document.head.appendChild(s);}
  window.refreshCorrectionHistory=loadCorrections;
  wait();
})();