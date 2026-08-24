// Supabase > Project Settings > API
// 只放 Project URL 和 anon/public key。不要把 service_role key 放在这里。
window.APP_CONFIG = {
  SUPABASE_URL: "https://rudszzkodkchdasteboq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_yHnU5ACbwLvpLt3h3OJpTw_Cd0OqiES"
};

// 饮料查看详情：居中并放大
const centerViewStyle = document.createElement("link");
centerViewStyle.rel = "stylesheet";
centerViewStyle.href = "./center-view.css";
document.head.appendChild(centerViewStyle);

// 额外功能：仓库与冰箱之间移库
const transferScript = document.createElement("script");
transferScript.src = "./transfer.js";
transferScript.defer = true;
document.head.appendChild(transferScript);

// 额外功能：每次操作选择日期
const operationDateScript = document.createElement("script");
operationDateScript.src = "./operation-date.js";
operationDateScript.defer = true;
document.head.appendChild(operationDateScript);

// 工作台显示所有已录入饮料
const dashboardProductsScript = document.createElement("script");
dashboardProductsScript.src = "./dashboard-products.js";
dashboardProductsScript.defer = true;
document.head.appendChild(dashboardProductsScript);

// 点开饮料显示该饮料的库存历史
const productHistoryScript = document.createElement("script");
productHistoryScript.src = "./product-history.js";
productHistoryScript.defer = true;
document.head.appendChild(productHistoryScript);

// 员工销售与提成：改为手动录入
const manualCommissionScript = document.createElement("script");
manualCommissionScript.src = "./manual-commission.js";
manualCommissionScript.defer = true;
document.head.appendChild(manualCommissionScript);

// 精简菜单，并把管理设置独立出来
const navigationCleanupScript = document.createElement("script");
navigationCleanupScript.src = "./navigation-cleanup.js";
navigationCleanupScript.defer = true;
document.head.appendChild(navigationCleanupScript);
