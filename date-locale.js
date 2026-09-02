// 统一日期输入为 YYYY-MM-DD，避免 Chromium / Windows 原生日期框出现“yyyy/mm/日”等混合语言。
(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('standardDateInputStyle'))return;
    const s=document.createElement('style');
    s.id='standardDateInputStyle';
    s.textContent=`
.standard-date-wrap{position:relative;width:100%;display:block}
.standard-date-wrap>.standard-date-input{width:100%;padding-right:44px!important}
.standard-date-picker-btn{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:32px;height:32px;padding:0!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#344054!important;display:flex;align-items:center;justify-content:center;cursor:pointer}
.standard-date-picker-btn:hover{background:#f1f5f9!important}
.standard-date-picker-btn svg{width:18px;height:18px;pointer-events:none}
.standard-date-native-picker{position:absolute!important;width:1px!important;height:1px!important;right:10px!important;top:50%!important;opacity:0!important;pointer-events:none!important;padding:0!important;border:0!important}
`;
    document.head.appendChild(s);
  }

  function normalize(value){
    const v=String(value||'').trim().replace(/[./]/g,'-');
    const m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(!m)return value;
    const y=m[1],mo=String(Number(m[2])).padStart(2,'0'),d=String(Number(m[3])).padStart(2,'0');
    const iso=`${y}-${mo}-${d}`;
    const test=new Date(`${iso}T00:00:00`);
    if(Number.isNaN(test.getTime())||test.getFullYear()!==Number(y)||test.getMonth()+1!==Number(mo)||test.getDate()!==Number(d))return value;
    return iso;
  }

  function enhance(input){
    if(!input||input.dataset.standardDate==='1'||input.dataset.dateNativePicker==='1')return;
    input.dataset.standardDate='1';
    const initial=input.value;
    input.type='text';
    input.classList.add('standard-date-input');
    input.placeholder='YYYY-MM-DD';
    input.inputMode='numeric';
    input.autocomplete='off';
    input.setAttribute('aria-label',input.getAttribute('aria-label')||'日期 YYYY-MM-DD');
    if(initial)input.value=initial;

    const parent=input.parentNode;
    const wrap=document.createElement('div');
    wrap.className='standard-date-wrap';
    parent.insertBefore(wrap,input);
    wrap.appendChild(input);

    const picker=document.createElement('input');
    picker.type='date';
    picker.className='standard-date-native-picker';
    picker.dataset.dateNativePicker='1';
    picker.tabIndex=-1;
    picker.setAttribute('aria-hidden','true');
    wrap.appendChild(picker);

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='standard-date-picker-btn';
    btn.setAttribute('aria-label','选择日期');
    btn.title='选择日期';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path></svg>';
    wrap.appendChild(btn);

    function syncPicker(){
      const v=normalize(input.value);
      if(/^\d{4}-\d{2}-\d{2}$/.test(v))picker.value=v;
      else picker.value='';
      if(input.getAttribute('min'))picker.min=input.getAttribute('min');
      if(input.getAttribute('max'))picker.max=input.getAttribute('max');
    }

    btn.addEventListener('click',()=>{
      syncPicker();
      try{if(typeof picker.showPicker==='function')picker.showPicker();else{picker.focus();picker.click();}}catch(e){picker.focus();picker.click();}
    });
    picker.addEventListener('change',()=>{
      if(!picker.value)return;
      input.value=picker.value;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    input.addEventListener('blur',()=>{const v=normalize(input.value);if(v!==input.value)input.value=v;});
    input.addEventListener('change',()=>{const v=normalize(input.value);if(v!==input.value)input.value=v;});
  }

  function apply(root){
    if(root?.matches?.('input[type="date"]')&&root.dataset.dateNativePicker!=='1')enhance(root);
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('input[type="date"]:not([data-date-native-picker="1"])').forEach(enhance);
  }

  function install(){
    addStyle();
    apply(document);
    const observer=new MutationObserver(mutations=>{
      mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1)apply(node);}));
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
