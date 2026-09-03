// 日期输入：保留浏览器原生 date 控件保证可正常选择，同时用覆盖文字统一显示 YYYY-MM-DD。
(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('standardDateInputStyle'))return;
    const s=document.createElement('style');
    s.id='standardDateInputStyle';
    s.textContent=`
.standard-date-wrap{position:relative;width:100%;display:block}
.standard-date-wrap>.standard-native-date{width:100%!important;color:transparent!important;-webkit-text-fill-color:transparent!important;caret-color:transparent!important}
.standard-date-wrap>.standard-native-date::-webkit-datetime-edit{color:transparent!important}
.standard-date-wrap>.standard-native-date::-webkit-calendar-picker-indicator{opacity:1!important;cursor:pointer!important;position:relative;z-index:4}
.standard-date-display{position:absolute;left:12px;right:46px;top:50%;transform:translateY(-50%);z-index:2;pointer-events:none;background:#fff;color:#172033;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:inherit;line-height:1.2}
.standard-date-display.placeholder{color:#7a7f86}
.standard-date-wrap:focus-within .standard-date-display{background:#fff}
`;
    document.head.appendChild(s);
  }

  function updateDisplay(input,display){
    const value=String(input.value||'').trim();
    display.textContent=value||'YYYY-MM-DD';
    display.classList.toggle('placeholder',!value);
  }

  function enhance(input){
    if(!input||input.dataset.standardDateNative==='1')return;
    input.dataset.standardDateNative='1';
    input.classList.add('standard-native-date');
    input.setAttribute('lang','en-CA');

    const parent=input.parentNode;
    if(!parent)return;
    const wrap=document.createElement('div');
    wrap.className='standard-date-wrap';
    parent.insertBefore(wrap,input);
    wrap.appendChild(input);

    const display=document.createElement('span');
    display.className='standard-date-display';
    wrap.appendChild(display);
    updateDisplay(input,display);

    input.addEventListener('input',()=>updateDisplay(input,display));
    input.addEventListener('change',()=>updateDisplay(input,display));
  }

  function apply(root){
    if(root?.matches?.('input[type="date"]'))enhance(root);
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('input[type="date"]:not([data-standard-date-native="1"])').forEach(enhance);
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
