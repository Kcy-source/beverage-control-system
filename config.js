// Supabase > Project Settings > API
// 只放 Project URL 和 anon/public key。不要把 service_role key 放在这里。
window.APP_CONFIG = {
  SUPABASE_URL: "https://rudszzkodkchdasteboq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_yHnU5ACbwLvpLt3h3OJpTw_Cd0OqiES"
};

// 额外功能：仓库与冰箱之间移库
const transferScript = document.createElement("script");
transferScript.src = "./transfer.js";
transferScript.defer = true;
document.head.appendChild(transferScript);
