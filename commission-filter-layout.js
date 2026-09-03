// 员工提成筛选栏布局：缩短筛选框，并让“确定 / 重置 / 导出 Excel”保持横向排列。
(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('commissionFilterLayoutStyle'))return;
    const s=document.createElement('style');
    s.id='commissionFilterLayoutStyle';
    s.textContent=`
#manualCommissionFilterPanel{
  grid-template-columns:185px 185px 190px 190px minmax(330px,1fr)!important;
  align-items:end!important;
}
#manualCommissionFilterPanel>label{min-width:0!important}
#manualCommissionFilterPanel>label select,
#manualCommissionFilterPanel>label input,
#manualCommissionFilterPanel .standard-date-wrap{width:100%!important;min-width:0!important}
#manualCommissionFilterPanel>div:last-child{
  display:flex!important;
  align-items:flex-end!important;
  gap:8px!important;
  min-width:330px!important;
  width:100%!important;
}
#manualCommissionFilterPanel>div:last-child button{
  flex:1 1 0!important;
  min-width:96px!important;
  min-height:42px!important;
  padding:9px 12px!important;
  white-space:nowrap!important;
  line-height:1.2!important;
  word-break:keep-all!important;
}
@media(max-width:1250px){
  #manualCommissionFilterPanel{grid-template-columns:repeat(4,minmax(150px,1fr))!important}
  #manualCommissionFilterPanel>div:last-child{grid-column:1/-1;min-width:0!important;max-width:430px}
}
@media(max-width:820px){
  #manualCommissionFilterPanel{grid-template-columns:1fr 1fr!important}
  #manualCommissionFilterPanel>div:last-child{grid-column:1/-1;max-width:none}
}
@media(max-width:540px){
  #manualCommissionFilterPanel{grid-template-columns:1fr!important}
  #manualCommissionFilterPanel>div:last-child{grid-column:1;flex-wrap:wrap}
  #manualCommissionFilterPanel>div:last-child button{min-width:110px!important}
}
`;
    document.head.appendChild(s);
  }

  function wait(){
    if(!document.getElementById('manualCommissionFilterPanel')){setTimeout(wait,120);return;}
    addStyle();
  }
  wait();
})();
