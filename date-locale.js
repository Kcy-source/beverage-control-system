// 统一所有日期输入框的显示语言为英文日期格式，避免出现“yyyy/mm/日”这类中英混合格式。
(function(){
  'use strict';

  function applyDateLocale(root){
    const scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('input[type="date"]').forEach(input=>{
      input.setAttribute('lang','en-CA');
    });
    if(root&&root.matches&&root.matches('input[type="date"]')){
      root.setAttribute('lang','en-CA');
    }
  }

  function install(){
    applyDateLocale(document);
    const observer=new MutationObserver(mutations=>{
      mutations.forEach(m=>m.addedNodes.forEach(node=>{
        if(node.nodeType===1)applyDateLocale(node);
      }));
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
