// 出库备注页面：用户照常在库存“出库”时填写备注，本页面集中统计所有有备注的非销售/用途出库记录。
(function(){
  'use strict';
  let installed=false;
  let rows=[];

  function h(v=''){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function dateOf(r){return r.operation_date||new Date(r.created_at).toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});}
  function parseNote(raw){
    const s=String(raw||'').trim();
    if(!s)return {location:'',note:''};
    const parts=s.split('｜');
    if(parts.length>1){
      const first=parts.shift().trim();
      return {location:(first==='冰箱'||first==='仓库')?first:'',note:parts.join('｜').trim()};
    }
    return {location:'',note:s};
  }
  function meaningful(r){
    if(String(r.action||'')!=='OUT')return false;
    if(r.correction_ref)return false;
    const p=parseNote(r.note);
    if(!p.note)return false;
    if(p.note.includes('错单更正'))return false;
    return true;
  }

  function wait(){
    if(typeof sb==='undefined'||typeof showPage!=='function'||!document.querySelector('.side-nav')||!document.querySelector('.content-area')){setTimeout(wait,150);return;}
    install();
  }

  function install(){
    if(installed)return;installed=true;
    buildPage();
    extendNavigation();
    addStyle();
    loadRows();
  }

  function buildPage(){
    const content=document.querySelector('.content-area');
    if(!content||document.getElementById('outNotes'))return;
    const section=document.createElement('div');
    section.id='outNotes';
    section.className='panel-anchor';
    section.style.display='none';
    section.innerHTML=`
      <div class="out-note-head"><div><h2>出库备注</h2><div class="hint">出库时填写的备注会自动汇总到这里，例如 FOC、厨房使用或其他非销售用途。</div></div><span id="outNoteCount"></span></div>
      <div id="outNoteFilters" class="card">
        <label>饮料<select id="outNoteItemFilter"><option value="">全部饮料</option></select></label>
        <label>开始日期<input id="outNoteDateFrom" type="date"></label>
        <label>结束日期<input id="outNoteDateTo" type="date"></label>
        <label>备注关键词<input id="outNoteKeyword" placeholder="例如：FOC / 厨房"></label>
        <div class="out-note-actions"><button id="applyOutNoteFilter">查询</button><button id="resetOutNoteFilter" class="secondary">重置</button></div>
      </div>
      <div id="outNoteSummary" class="out-note-summary"></div>
      <div class="card out-note-card">
        <div class="section-head"><h3>备注汇总</h3><span class="hint">按相同备注合计</span></div>
        <div class="tablewrap out-note-summary-wrap"><table><thead><tr><th>备注</th><th>记录数</th><th>出库数量</th></tr></thead><tbody id="outNoteGroupBody"></tbody></table></div>
      </div>
      <div class="card out-note-card">
        <div class="section-head"><h3>出库明细</h3></div>
        <div class="tablewrap out-note-detail-wrap"><table><thead><tr><th>日期</th><th>饮料</th><th>数量</th><th>位置</th><th>备注</th><th>操作人</th></tr></thead><tbody id="outNoteBody"><tr><td colspan="6">读取中...</td></tr></tbody></table></div>
      </div>`;
    content.appendChild(section);

    document.getElementById('applyOutNoteFilter').onclick=renderRows;
    document.getElementById('resetOutNoteFilter').onclick=()=>{
      ['outNoteItemFilter','outNoteDateFrom','outNoteDateTo','outNoteKeyword'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      renderRows();
    };
    document.getElementById('outNoteKeyword').addEventListener('keydown',e=>{if(e.key==='Enter')renderRows();});
  }

  function extendNavigation(){
    const nav=document.querySelector('.side-nav');if(!nav)return;
    if(!nav.querySelector('a[href="#outNotes"]')){
      const a=document.createElement('a');
      a.href='#outNotes';
      a.innerHTML='<span class="side-icon">▧</span><span class="side-label">出库备注</span>';
      const corrections=nav.querySelector('a[href="#corrections"]');
      const settings=nav.querySelector('a[href="#settings"]');
      nav.insertBefore(a,corrections||settings||null);
      a.onclick=e=>{e.preventDefault();showPage('outNotes');};
    }

    const oldShowPage=showPage;
    showPage=function(page){
      const own=document.getElementById('outNotes');
      if(page==='outNotes'){
        ['dashboard','inventory','commission','logs','settings','corrections'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
        if(own)own.style.display='block';
        document.querySelectorAll('.side-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#outNotes'));
        window.scrollTo({top:0,behavior:'smooth'});
        loadRows();
        return;
      }
      if(own)own.style.display='none';
      oldShowPage(page);
    };
  }

  async function fetchAllOutLogs(){
    const all=[];let from=0;const size=1000;
    while(true){
      const {data,error}=await sb.from('inventory_logs').select('*').eq('action','OUT').order('operation_date',{ascending:false}).order('created_at',{ascending:false}).range(from,from+size-1);
      if(error)throw error;
      const page=data||[];all.push(...page);
      if(page.length<size)break;
      from+=size;
    }
    return all;
  }

  async function loadRows(){
    const body=document.getElementById('outNoteBody');if(!body)return;
    body.innerHTML='<tr><td colspan="6">读取中...</td></tr>';
    try{
      const data=await fetchAllOutLogs();
      rows=data.filter(meaningful).map(r=>{const p=parseNote(r.note);return {...r,_date:dateOf(r),_location:p.location,_businessNote:p.note};});
      rows.sort((a,b)=>String(b._date).localeCompare(String(a._date))||String(b.created_at||'').localeCompare(String(a.created_at||'')));
      populateItems();
      renderRows();
    }catch(e){
      body.innerHTML=`<tr><td colspan="6">读取失败：${h(e.message||e)}</td></tr>`;
    }
  }

  function populateItems(){
    const sel=document.getElementById('outNoteItemFilter');if(!sel)return;
    const current=sel.value;
    const names=[...new Set(rows.map(r=>r.item_name).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
    sel.innerHTML='<option value="">全部饮料</option>'+names.map(n=>`<option value="${h(n)}">${h(n)}</option>`).join('');
    if(names.includes(current))sel.value=current;
  }

  function filteredRows(){
    const item=document.getElementById('outNoteItemFilter')?.value||'';
    const from=document.getElementById('outNoteDateFrom')?.value||'';
    const to=document.getElementById('outNoteDateTo')?.value||'';
    const kw=(document.getElementById('outNoteKeyword')?.value||'').trim().toLowerCase();
    return rows.filter(r=>{
      if(item&&r.item_name!==item)return false;
      if(from&&r._date<from)return false;
      if(to&&r._date>to)return false;
      if(kw&&!`${r.item_name||''} ${r._businessNote||''} ${r.user_email||''}`.toLowerCase().includes(kw))return false;
      return true;
    });
  }

  function renderRows(){
    const body=document.getElementById('outNoteBody'),groupBody=document.getElementById('outNoteGroupBody'),summary=document.getElementById('outNoteSummary'),count=document.getElementById('outNoteCount');
    if(!body||!groupBody||!summary)return;
    const filtered=filteredRows();
    const totalQty=filtered.reduce((s,r)=>s+Number(r.quantity||0),0);
    summary.innerHTML=`<span>记录 <b>${filtered.length}</b></span><span>出库数量 <b>${Number(totalQty.toFixed(2))}</b></span>`;
    if(count)count.textContent=`显示 ${filtered.length} 条`;

    const groups=new Map();
    filtered.forEach(r=>{
      const key=r._businessNote||'未填写';
      const g=groups.get(key)||{note:key,count:0,qty:0};
      g.count++;g.qty+=Number(r.quantity||0);groups.set(key,g);
    });
    const grouped=[...groups.values()].sort((a,b)=>b.qty-a.qty||b.count-a.count||a.note.localeCompare(b.note));
    groupBody.innerHTML=grouped.map(g=>`<tr><td><b>${h(g.note)}</b></td><td>${g.count}</td><td>${Number(g.qty.toFixed(2))}</td></tr>`).join('')||'<tr><td colspan="3">暂无有备注的出库记录</td></tr>';

    body.innerHTML=filtered.map(r=>`<tr><td>${h(r._date)}</td><td><b>${h(r.item_name||'')}</b></td><td>${Number(r.quantity||0)}</td><td>${h(r._location||'')}</td><td>${h(r._businessNote||'')}</td><td>${h(r.user_email||'')}</td></tr>`).join('')||'<tr><td colspan="6">暂无有备注的出库记录</td></tr>';
  }

  function addStyle(){
    if(document.getElementById('outNoteStyle'))return;
    const s=document.createElement('style');s.id='outNoteStyle';s.textContent=`
#outNotes{padding:0 2px 20px}.out-note-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin:4px 0 14px}.out-note-head h2{margin:0 0 4px;font-size:22px;color:#102a43}.out-note-head>span{font-size:13px;color:#667085;padding-top:5px}
#outNoteFilters{display:grid;grid-template-columns:minmax(180px,1.1fr) minmax(150px,.8fr) minmax(150px,.8fr) minmax(220px,1.3fr) auto;gap:10px;align-items:end;padding:14px;margin-bottom:12px;background:#f8fafc}
#outNoteFilters label{font-size:12px;color:#667085;font-weight:600;display:flex;flex-direction:column;gap:6px;min-width:0}#outNoteFilters input,#outNoteFilters select{width:100%;min-height:42px}.out-note-actions{display:flex;gap:8px;align-items:end}.out-note-actions button{min-height:42px;white-space:nowrap}
.out-note-summary{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 12px}.out-note-summary span{display:inline-flex;gap:6px;align-items:center;background:#edf3f8;color:#475467;border-radius:10px;padding:8px 12px;font-size:13px}.out-note-summary b{color:#173b5e;font-size:15px}
.out-note-card{margin-top:12px;padding:14px}.out-note-card .section-head h3{margin:0;font-size:17px}.out-note-summary-wrap{max-height:260px;overflow:auto}.out-note-detail-wrap{max-height:62vh;overflow:auto}#outNotes table{min-width:760px}#outNotes thead th{position:sticky;top:0;z-index:3;background:#f8fafc!important}
@media(max-width:1150px){#outNoteFilters{grid-template-columns:1fr 1fr}.out-note-actions{grid-column:1/-1}}
@media(max-width:620px){#outNoteFilters{grid-template-columns:1fr}.out-note-actions{grid-column:1}.out-note-actions button{flex:1}}
`;document.head.appendChild(s);
  }

  window.refreshOutNoteHistory=loadRows;
  wait();
})();