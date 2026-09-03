// 统一日期输入为 YYYY-MM-DD，并使用原生日期控件作为可点击日历层，保证 Windows / Chromium 可以正常选日期。
(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('standardDateInputStyle'))return;
    const s=document.createElement('style');
    s.id='standardDateInputStyle';
    s.textContent=`
.standard-date-wrap{position:relative;width:100%;display:block}
.standard-date-wrap>.standard-date-input{width:100%;padding-right:44px!important}
.standard-date-icon{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:8px;color:#344054;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2}
.standard-date-icon svg{width:18px;height:18px}
.standard-date-native-picker{position:absolute!important;right:0!important;top:0!important;width:48px!important;height:100%!important;opacity:0!important;cursor:pointer!important;z-index:3!important;padding:0!important;border:0!important;pointer-events:auto!important}
.standard-date-wrap:focus-within .standard-date-icon{background:#f1f5f9}
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
    const min=input.getAttribute('min')||'';
    const max=input.getAttribute('max')||'';

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

    const icon=document.createElement('span');
    icon.className='standard-date-icon';
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path></svg>';
    wrap.appendChild(icon);

    const picker=document.createElement('input');
    picker.type='date';
    picker.className='standard-date-native-picker';
    picker.dataset.dateNativePicker='1';
    picker.setAttribute('aria-label','选择日期');
    if(min)picker.min=min;
    if(max)picker.max=max;
    wrap.appendChild(picker);

    function syncPicker(){
      const v=normalize(input.value);
      picker.value=/^\d{4}-\d{2}-\d{2}$/.test(v)?v:'';
      const currentMin=input.getAttribute('min');
      const currentMax=input.getAttribute('max');
      if(currentMin)picker.min=currentMin;
      if(currentMax)picker.max=currentMax;
    }

    function applyPickerValue(){
      if(!picker.value)return;
      if(input.value===picker.value)return;
      input.value=picker.value;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }

    // 点击透明的原生日期层前，先把当前文本日期同步进去。
    picker.addEventListener('pointerdown',syncPicker);
    picker.addEventListener('mousedown',syncPicker);
    picker.addEventListener('focus',syncPicker);
    picker.addEventListener('input',applyPickerValue);
    picker.addEventListener('change',applyPickerValue);

    input.addEventListener('blur',()=>{
      const v=normalize(input.value);
      if(v!==input.value)input.value=v;
      syncPicker();
    });
    input.addEventListener('change',()=>{
      const v=normalize(input.value);
      if(v!==input.value)input.value=v;
      syncPicker();
    });
    syncPicker();
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
