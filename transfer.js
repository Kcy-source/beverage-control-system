// 冰箱 <-> 仓库移库功能。等待主程序加载后再安装。
(function(){
  let transferItemId=null;

  function waitForApp(){
    if(typeof loadAll!=="function" || typeof render!=="function" || typeof renderDrawer!=="function" || typeof sb==="undefined" || typeof items==="undefined"){
      setTimeout(waitForApp,120);
      return;
    }
    installTransferUI();
  }

  function installTransferUI(){
    if(document.getElementById("transferDialog")) return;

    const dialog=document.createElement("dialog");
    dialog.id="transferDialog";
    dialog.innerHTML=`<div class="modal">
      <h3 id="transferTitle">移库</h3>
      <div class="grid2">
        <label class="full">移库方向
          <select id="transferDirection">
            <option value="warehouse_to_fridge">仓库 → 冰箱</option>
            <option value="fridge_to_warehouse">冰箱 → 仓库</option>
          </select>
        </label>
        <label class="full">数量
          <input id="transferQty" type="number" min="0.01" step="0.01" placeholder="输入移库数量">
        </label>
        <label class="full">备注
          <input id="transferNote" placeholder="例如：补充前台冰箱">
        </label>
        <div id="transferStockHint" class="full hint"></div>
      </div>
      <div class="modalfooter">
        <button class="secondary" id="cancelTransferBtn">取消</button>
        <button id="saveTransferBtn">确认移库</button>
      </div>
    </div>`;
    document.body.appendChild(dialog);

    document.getElementById("cancelTransferBtn").onclick=()=>dialog.close();
    document.getElementById("saveTransferBtn").onclick=saveTransfer;
    document.getElementById("transferDirection").onchange=refreshHint;

    const originalRender=render;
    render=function(){originalRender();decorateTransferButtons();};

    const originalDrawer=renderDrawer;
    renderDrawer=function(x){originalDrawer(x);addDrawerTransferButton(x.id);};

    window.openTransfer=openTransfer;
    decorateTransferButtons();
  }

  function findIdFromRow(row){
    const b=row.querySelector(".linkbtn");
    if(!b) return null;
    const attr=b.getAttribute("onclick")||"";
    const m=attr.match(/openItemDrawer\('([^']+)'\)/);
    return m?m[1]:null;
  }

  function decorateTransferButtons(){
    const body=document.getElementById("inventoryBody");
    if(body){
      body.querySelectorAll("tr").forEach(row=>{
        const id=findIdFromRow(row);
        if(!id) return;
        const cell=row.querySelector("td.actions");
        if(!cell || cell.querySelector(".transfer-btn")) return;
        const btn=document.createElement("button");
        btn.className="secondary transfer-btn";
        btn.textContent="移库";
        btn.onclick=()=>openTransfer(id);
        const viewBtn=cell.querySelector("button:last-child");
        cell.insertBefore(btn,viewBtn||null);
      });
    }
    const logBody=document.getElementById("logBody");
    if(logBody){
      logBody.querySelectorAll("tr").forEach(tr=>{
        const td=tr.children[2];
        if(td && td.textContent.trim()==="TRANSFER") td.textContent="移库";
      });
    }
  }

  function addDrawerTransferButton(id){
    const actions=document.querySelector("#itemDrawer .drawer-actions");
    if(!actions) return;
    let btn=actions.querySelector(".drawer-transfer-btn");
    if(!btn){
      btn=document.createElement("button");
      btn.className="secondary drawer-transfer-btn";
      btn.textContent="移库";
      const edit=document.getElementById("drawerEditBtn");
      actions.insertBefore(btn,edit||null);
    }
    btn.onclick=()=>{if(typeof closeItemDrawer==="function")closeItemDrawer();openTransfer(id);};
  }

  function openTransfer(id){
    const x=items.find(i=>i.id===id);
    if(!x) return;
    transferItemId=id;
    document.getElementById("transferTitle").textContent=x.name+" · 移库";
    document.getElementById("transferDirection").value="warehouse_to_fridge";
    document.getElementById("transferQty").value="";
    document.getElementById("transferNote").value="";
    refreshHint();
    document.getElementById("transferDialog").showModal();
  }

  function refreshHint(){
    const x=items.find(i=>i.id===transferItemId);
    if(!x) return;
    const direction=document.getElementById("transferDirection").value;
    const from=direction==="warehouse_to_fridge"?"仓库":"冰箱";
    const to=direction==="warehouse_to_fridge"?"冰箱":"仓库";
    const sourceQty=direction==="warehouse_to_fridge"?warehouse(x):fridge(x);
    document.getElementById("transferStockHint").textContent=`${from}当前库存：${sourceQty} ${x.unit||""}。移到${to}后，总库存不会改变，也不会产生提成。`;
  }

  async function saveTransfer(){
    const x=items.find(i=>i.id===transferItemId);
    if(!x) return;
    const direction=document.getElementById("transferDirection").value;
    const qty=Number(document.getElementById("transferQty").value);
    const note=document.getElementById("transferNote").value.trim();
    if(!Number.isFinite(qty)||qty<=0) return alert("请输入大于 0 的移库数量");

    const fq=fridge(x),wq=warehouse(x);
    let nextF=fq,nextW=wq,from,to;
    if(direction==="warehouse_to_fridge"){
      from="仓库";to="冰箱";
      if(qty>wq) return alert("仓库库存不足，当前只有 "+wq);
      nextW=wq-qty;nextF=fq+qty;
    }else{
      from="冰箱";to="仓库";
      if(qty>fq) return alert("冰箱库存不足，当前只有 "+fq);
      nextF=fq-qty;nextW=wq+qty;
    }

    const r=await sb.from("inventory_items").update({
      fridge_quantity:nextF,
      warehouse_quantity:nextW,
      quantity:nextF+nextW,
      updated_at:new Date().toISOString()
    }).eq("id",x.id);
    if(r.error) return alert("移库失败："+r.error.message);

    const detail=`${from} → ${to}${note?"｜"+note:""}`;
    const log=await sb.from("inventory_logs").insert({
      item_id:x.id,item_name:x.name,action:"TRANSFER",quantity:qty,note:detail,user_email:userEmail()
    });
    if(log.error){
      alert("移库已完成，但操作记录暂时无法写入。请在 Supabase 运行 transfer-log-upgrade.sql 后再试。");
    }

    document.getElementById("transferDialog").close();
    await loadAll();
  }

  waitForApp();
})();