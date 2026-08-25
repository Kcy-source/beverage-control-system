// Supabase > Project Settings > API
// 只放 Project URL 和 anon/public key。不要把 service_role key 放在这里。
window.APP_CONFIG = {
  SUPABASE_URL: "https://rudszzkodkchdasteboq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_yHnU5ACbwLvpLt3h3OJpTw_Cd0OqiES"
};

const centerViewStyle=document.createElement("link");
centerViewStyle.rel="stylesheet";
centerViewStyle.href="./center-view.css?v=20260825b";
document.head.appendChild(centerViewStyle);

[
  "transfer.js",
  "operation-date.js",
  "inventory-date-fix.js",
  "dashboard-products.js",
  "product-history.js",
  "manual-commission.js",
  "navigation-cleanup.js",
  "dashboard-category.js",
  "account-directory.js",
  "ui-polish.js"
].forEach(file=>{
  const script=document.createElement("script");
  script.src="./"+file+"?v=20260825b";
  script.defer=true;
  document.head.appendChild(script);
});
