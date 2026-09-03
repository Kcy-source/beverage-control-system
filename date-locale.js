// 统一日期输入为 YYYY-MM-DD，并使用自定义日历；兼容普通页面和 dialog，所有账号使用同一套日期选择逻辑。
(function(){
  'use strict';

  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;
  let popup=null;

  function pad(n){return String(n).padStart(2,'0');}
  function iso(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
  function parseISO(v){
    const m=String(v||'').trim().replace(/[./]/g,'-').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(!m)return null;
    const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);
    const dt=new Date(y,mo-1,d);
    if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d)return null;
    return {y,m:mo-1,d};
  }
  function todayParts(){return parseISO(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'}));}
  function normalize(input){const p=parseISO(input.value);if(p)input.value=iso(p.y,p.m,p.d);}

  function addStyle(){
    if(document.getElementById('standardDateInputStyle'))return;
    const s=document.createElement('style');
    s.id='standardDateInputStyle';
    s.textContent=`
.standard-date-wrap{position:relative;width:100%;display:block}
.standard-date-wrap>.standard-date-input{width:100%!important;padding-right:42px!important;cursor:pointer}
.standard-date-picker-btn{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:30px;height:30px;padding:0!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#344054!important;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3}
.standard-date-picker-btn:hover{background:#eef2f6!important}
.standard-date-picker-btn svg{width:18px;height:18px;pointer-events:none}
#standardDateCalendar{position:fixed;z-index:2147483647;width:300px;background:#fff;border:1px solid #d9e0e8;border-radius:12px;box-shadow:0 16px 40px rgba(15,23,42,.22);padding:12px;color:#172033;font-family:Arial,"Microsoft YaHei",sans-serif}
#standardDateCalendar .cal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
#standardDateCalendar .cal-title{font-weight:700;font-size:14px}
#standardDateCalendar .cal-nav{display:flex;gap:4px}
#standardDateCalendar .cal-nav button{width:32px;height:32px;padding:0!important;border:0!important;background:#fff!important;color:#172033!important;border-radius:7px!important;font-size:20px;line-height:1}
#standardDateCalendar .cal-nav button:hover{background:#f1f5f9!important}
#standardDateCalendar .cal-week,#standardDateCalendar .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
#standardDateCalendar .cal-week span{text-align:center;font-size:12px;font-weight:700;color:#667085;padding:5px 0}
#standardDateCalendar .cal-day{height:34px;padding:0!important;border:0!important;border-radius:7px!important;background:#fff!important;color:#172033!important;font-size:13px}
#standardDateCalendar .cal-day:hover{background:#edf3f8!important}
#standardDateCalendar .cal-day.other{color:#98a2b3!important}
#standardDateCalendar .cal-day.today{outline:1px solid #98a2b3}
#standardDateCalendar .cal-day.selected{background:#173b5e!important;color:#fff!important;outline:none}
#standardDateCalendar .cal-day:disabled{opacity:.35;cursor:not-allowed}
#standardDateCalendar .cal-footer{display:flex;justify-content:space-between;gap:8px;margin-top:9px;padding-top:8px;border-top:1px solid #edf0f3}
#standardDateCalendar .cal-footer button{padding:6px 9px!important;background:transparent!important;color:#1565c0!important;font-size:12px;font-weight:700}
`;
    document.head.appendChild(s);
  }

  function buildPopup(){
    if(popup&&popup.isConnected)return popup;
    popup=document.getElementById('standardDateCalendar');
    if(popup)return popup;
    popup=document.createElement('div');
    popup.id='standardDateCalendar';
    popup.hidden=true;
    popup.addEventListener('mousedown',e=>e.stopPropagation());
    document.body.appendChild(popup);
    return popup;
  }

  function movePopupToActiveLayer(){
    const p=buildPopup();
    const dialog=activeInput?.closest('dialog');
    const target=dialog||document.body;
    if(p.parentElement!==target)target.appendChild(p);
  }

  function withinLimits(value,input){
    const min=input.getAttribute('min')||'',max=input.getAttribute('max')||'';
    return (!min||value>=min)&&(!max||value<=max);
  }

  function renderCalendar(){
    if(!activeInput)return;
    const p=buildPopup();
    const selected=parseISO(activeInput.value),today=todayParts();
    const first=new Date(viewYear,viewMonth,1),start=new Date(viewYear,viewMonth,1-first.getDay());
    const weekdays=['日','一','二','三','四','五','六'];
    let days='';
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      const y=d.getFullYear(),m=d.getMonth(),day=d.getDate(),value=iso(y,m,day);
      const other=m!==viewMonth,isToday=today&&today.y===y&&today.m===m&&today.d===day,isSelected=selected&&selected.y===y&&selected.m===m&&selected.d===day,disabled=!withinLimits(value,activeInput);
      days+=`<button type="button" class="cal-day${other?' other':''}${isToday?' today':''}${isSelected?' selected':''}" data-date="${value}" ${disabled?'disabled':''}>${day}</button>`;
    }
    p.innerHTML=`<div class="cal-head"><div class="cal-title">${viewYear}年${pad(viewMonth+1)}月</div><div class="cal-nav"><button type="button" data-nav="prev" aria-label="上个月">‹</button><button type="button" data-nav="next" aria-label="下个月">›</button></div></div><div class="cal-week">${weekdays.map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-grid">${days}</div><div class="cal-footer"><button type="button" data-action="clear">清除</button><button type="button" data-action="today">今天</button></div>`;
    p.querySelector('[data-nav="prev"]').onclick=()=>{viewMonth--;if(viewMonth<0){viewMonth=11;viewYear--;}renderCalendar();positionPopup();};
    p.querySelector('[data-nav="next"]').onclick=()=>{viewMonth++;if(viewMonth>11){viewMonth=0;viewYear++;}renderCalendar();positionPopup();};
    p.querySelectorAll('[data-date]').forEach(btn=>btn.onclick=()=>selectDate(btn.dataset.date));
    p.querySelector('[data-action="clear"]').onclick=()=>selectDate('');
    p.querySelector('[data-action="today"]').onclick=()=>{const t=todayParts();if(t){const v=iso(t.y,t.m,t.d);if(withinLimits(v,activeInput))selectDate(v);}};
  }

  function positionPopup(){
    if(!popup||popup.hidden||!activeInput)return;
    const wrap=activeInput.closest('.standard-date-wrap')||activeInput;
    const r=wrap.getBoundingClientRect(),width=300;
    let left=r.left;
    if(left+width>window.innerWidth-8)left=Math.max(8,window.innerWidth-width-8);
    let top=r.bottom+6;
    const estimated=360;
    if(top+estimated>window.innerHeight-8&&r.top>estimated+8)top=Math.max(8,r.top-estimated-6);
    popup.style.left=`${Math.round(left)}px`;
    popup.style.top=`${Math.round(top)}px`;
  }

  function openCalendar(input){
    if(!input)return;
    activeInput=input;
    movePopupToActiveLayer();
    const selected=parseISO(input.value)||todayParts()||{y:new Date().getFullYear(),m:new Date().getMonth(),d:1};
    viewYear=selected.y;viewMonth=selected.m;
    renderCalendar();
    popup.hidden=false;
    positionPopup();
  }

  function closeCalendar(){if(popup)popup.hidden=true;activeInput=null;}

  function selectDate(value){
    if(!activeInput)return;
    const input=activeInput;
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    closeCalendar();
    input.focus();
  }

  function bindInput(input){
    if(!input||input.dataset.datePickerBound==='20260903m')return;
    input.dataset.datePickerBound='20260903m';
    input.addEventListener('click',e=>{e.stopPropagation();openCalendar(input);});
    input.addEventListener('focus',()=>{if(input.dataset.openCalendarOnFocus==='1')openCalendar(input);});
    input.addEventListener('blur',()=>normalize(input));
    input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'&&e.altKey){e.preventDefault();openCalendar(input);}if(e.key==='Escape')closeCalendar();});
    const wrap=input.closest('.standard-date-wrap');
    const btn=wrap?.querySelector('.standard-date-picker-btn');
    if(btn&&!btn.dataset.datePickerBound){
      btn.dataset.datePickerBound='1';
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();openCalendar(input);};
    }
  }

  function enhance(input){
    if(!input)return;
    if(input.dataset.standardDate==='1'){
      bindInput(input);
      return;
    }
    input.dataset.standardDate='1';
    const initial=input.value;
    input.type='text';input.classList.add('standard-date-input');input.placeholder='YYYY-MM-DD';input.inputMode='numeric';input.autocomplete='off';
    input.setAttribute('aria-label',input.getAttribute('aria-label')||'日期 YYYY-MM-DD');if(initial)input.value=initial;
    const parent=input.parentNode;if(!parent)return;
    const wrap=document.createElement('div');wrap.className='standard-date-wrap';parent.insertBefore(wrap,input);wrap.appendChild(input);
    const btn=document.createElement('button');btn.type='button';btn.className='standard-date-picker-btn';btn.title='选择日期';btn.setAttribute('aria-label','选择日期');
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path></svg>';
    wrap.appendChild(btn);
    bindInput(input);
  }

  function apply(root){
    if(root?.matches?.('input[type="date"],input.standard-date-input'))enhance(root);
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('input[type="date"],input.standard-date-input').forEach(enhance);
  }

  function install(){
    addStyle();buildPopup();apply(document);
    const observer=new MutationObserver(mutations=>mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1)apply(node);})));observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('mousedown',e=>{if(popup&&!popup.hidden&&!e.target.closest('#standardDateCalendar')&&!e.target.closest('.standard-date-wrap'))closeCalendar();});
    document.addEventListener('click',e=>{
      const wrap=e.target.closest?.('.standard-date-wrap');
      const input=wrap?.querySelector('input.standard-date-input');
      if(input&&e.target.closest('.standard-date-picker-btn'))openCalendar(input);
    });
    window.addEventListener('resize',positionPopup);window.addEventListener('scroll',positionPopup,true);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCalendar();});
    setInterval(()=>apply(document),1500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
