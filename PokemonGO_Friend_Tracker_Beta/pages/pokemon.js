
let pokemonUi={search:"",friendship:"all",vivillon:"all",inactivity:"all",page:1,view:"friends",editing:null,openCard:null};
let pokemonSearchTimer=null;
const POKE_PAGE_SIZE=40;
const FRIENDSHIP_LEVELS=["Good Friend","Great Friend","Ultra Friend","Best Friend","Forever Friend"];
const VIVILLON_PATTERNS=["Unknown","Archipelago","Continental","Elegant","Garden","High Plains","Icy Snow","Jungle","Marine","Meadow","Modern","Monsoon","Ocean","Polar","River","Sandstorm","Savanna","Sun","Tundra"];
function pokeEmoji(level){return ({"Good Friend":"💚","Great Friend":"💙","Ultra Friend":"💜","Best Friend":"⭐","Forever Friend":"✨"})[level]||"🤝"}
function pokeDate(value){return value?formatDate(value):"Never"}
function pokeDaysSince(value){if(!value)return null;return Math.max(0,Math.floor((new Date(today()+"T12:00:00")-new Date(value+"T12:00:00"))/86400000))}
function pokeInactiveLabel(f){const d=pokeDaysSince(f.lastInteraction);return d===null?"No interaction logged":d===0?"Active today":d===1?"1 day inactive":`${d} days inactive`}
function giftLoggedToday(f,type){return (type==="sent"?(f.giftSentDates||[]):(f.giftReceivedDates||[])).includes(today())}
function logPokemonGift(id,type,date=today()){
  const f=data.pokemonFriends.find(x=>x.id===id);if(!f)return;
  const datesKey=type==="sent"?"giftSentDates":"giftReceivedDates",countKey=type==="sent"?"giftsSent":"giftsReceived",lastKey=type==="sent"?"lastGiftSent":"lastGiftReceived";
  f[datesKey]=Array.isArray(f[datesKey])?f[datesKey]:[];
  if(f[datesKey].includes(date)){f[datesKey]=f[datesKey].filter(d=>d!==date);f[countKey]=Math.max(0,(Number(f[countKey])||0)-1);toast(type==="sent"?"Sent gift removed":"Received gift removed");}
  else{f[datesKey].push(date);f[datesKey].sort();f[countKey]=(Number(f[countKey])||0)+1;toast(type==="sent"?"Gift sent recorded 🎁":"Gift received recorded 💌");}
  f[lastKey]=f[datesKey][f[datesKey].length-1]||"";
  const all=[...(f.giftSentDates||[]),...(f.giftReceivedDates||[])].sort();f.lastInteraction=all[all.length-1]||f.lastInteraction||"";
  saveData();render();
}

function friendshipCard(f){
  const currentIndex=Math.max(0,FRIENDSHIP_LEVELS.indexOf(f.friendship));
  return `<div class="friendship-card">
    <div class="friendship-card-header">
      <div class="friendship-card-icon">${pokeEmoji(f.friendship)}</div>
      <div><small>Friendship level</small><strong>${esc(f.friendship)}</strong></div>
    </div>
    <div class="friendship-path">
      ${FRIENDSHIP_LEVELS.map((level,index)=>`
        <div class="friendship-step ${index<currentIndex?"complete":""} ${index===currentIndex?"current":""}">
          <span>${pokeEmoji(level)}</span><small>${level.replace(" Friend","")}</small>
        </div>`).join("")}
    </div>
  </div>`;
}
function PokemonFriendDetail(f){
  return `<div class="poke-detail-backdrop" data-close-friend-card>
    <section class="poke-detail-card" role="dialog" aria-modal="true">
      <button class="poke-detail-close" data-close-friend-card>×</button>
      <div class="poke-detail-trainer">
        <div class="poke-detail-avatar">${pokeEmoji(f.friendship)}</div>
        <div><small>Trainer</small><h2>${esc(f.name)}</h2>${f.nickname?`<p>${esc(f.nickname)}</p>`:""}</div>
      </div>
      ${friendshipCard(f)}
      <div class="poke-detail-grid">
        <div><small>Vivillon</small><strong>🦋 ${esc(f.vivillon||"Unknown")}</strong></div>
        <div><small>Country</small><strong>${f.country?`🌍 ${esc(f.country)}`:"—"}</strong></div>
        <div><small>Gifts sent</small><strong>${f.giftsSent||0}</strong><span>${pokeDate(f.lastGiftSent)}</span></div>
        <div><small>Gifts received</small><strong>${f.giftsReceived||0}</strong><span>${pokeDate(f.lastGiftReceived)}</span></div>
        <div class="poke-inactive-stat"><small>Last interaction</small><strong>${pokeDate(f.lastInteraction)}</strong><span>${pokeInactiveLabel(f)}</span></div>
      </div>
      ${f.notes?`<div class="poke-detail-notes"><small>Notes</small><p>${esc(f.notes)}</p></div>`:""}
      <div class="gift-date-tools"><label><span>Choose date</span><input id="detailGiftDate" type="date" value="${today()}" max="${today()}"></label></div>
      <div class="gift-buttons">
        <button class="${giftLoggedToday(f,"sent")?"gift-done":""}" data-detail-gift-sent="${f.id}"><b>${giftLoggedToday(f,"sent")?"✓ Gift sent today":"🎁 I sent a gift"}</b><small>Tap again to undo that date</small></button>
        <button class="${giftLoggedToday(f,"received")?"gift-done":""}" data-detail-gift-received="${f.id}"><b>${giftLoggedToday(f,"received")?"✓ Gift received today":"💌 They sent me a gift"}</b><small>Tap again to undo that date</small></button>
      </div>
      <button class="secondary poke-detail-edit" data-detail-edit="${f.id}">Edit friend</button>
    </section>
  </div>`;
}

function filteredPokemonFriends(){
  const q=pokemonUi.search.trim().toLowerCase();
  return (data.pokemonFriends||[]).filter(f=>{
    const text=[f.name,f.nickname,f.country,f.vivillon].join(" ").toLowerCase();
    const inactiveDays=pokeDaysSince(f.lastInteraction);
    const inactivityMatch=pokemonUi.inactivity==="all"
      ||(pokemonUi.inactivity==="none"&&inactiveDays===null)
      ||(pokemonUi.inactivity!=="none"&&inactiveDays!==null&&inactiveDays>=Number(pokemonUi.inactivity));
    return (!q||text.includes(q))&&(pokemonUi.friendship==="all"||f.friendship===pokemonUi.friendship)&&(pokemonUi.vivillon==="all"||f.vivillon===pokemonUi.vivillon)&&inactivityMatch;
  });
}
function PokemonFriendResultsMarkup(){
  const filtered=filteredPokemonFriends();
  const pages=Math.max(1,Math.ceil(filtered.length/POKE_PAGE_SIZE));
  pokemonUi.page=Math.min(pokemonUi.page,pages);
  const shown=filtered.slice((pokemonUi.page-1)*POKE_PAGE_SIZE,pokemonUi.page*POKE_PAGE_SIZE);
  return {filtered,pages,html:`<p class="poke-results" id="pokeResultsCount">${filtered.length} friend${filtered.length===1?"":"s"} found</p></section>
      <section class="poke-friend-list" id="pokeFriendResults">${shown.length?shown.map(PokemonFriendCard).join(""):`<section class="card"><p>No friends match those filters.</p></section>`}</section>
      <div id="pokePagination">${pages>1?`<div class="poke-pagination"><button class="secondary" data-poke-page="${pokemonUi.page-1}" ${pokemonUi.page===1?"disabled":""}>← Previous</button><span>Page ${pokemonUi.page} of ${pages}</span><button class="secondary" data-poke-page="${pokemonUi.page+1}" ${pokemonUi.page===pages?"disabled":""}>Next →</button></div>`:""}</div>`};
}
function refreshPokemonFriendResults(){
  const result=PokemonFriendResultsMarkup();
  const count=document.querySelector("#pokeResultsCount");
  const list=document.querySelector("#pokeFriendResults");
  const pagination=document.querySelector("#pokePagination");
  if(count)count.textContent=`${result.filtered.length} friend${result.filtered.length===1?"":"s"} found`;
  if(list){
    const shown=result.filtered.slice((pokemonUi.page-1)*POKE_PAGE_SIZE,pokemonUi.page*POKE_PAGE_SIZE);
    list.innerHTML=shown.length?shown.map(PokemonFriendCard).join(""):`<section class="card"><p>No friends match those filters.</p></section>`;
  }
  if(pagination)pagination.innerHTML=result.pages>1?`<div class="poke-pagination"><button class="secondary" data-poke-page="${pokemonUi.page-1}" ${pokemonUi.page===1?"disabled":""}>← Previous</button><span>Page ${pokemonUi.page} of ${result.pages}</span><button class="secondary" data-poke-page="${pokemonUi.page+1}" ${pokemonUi.page===result.pages?"disabled":""}>Next →</button></div>`:"";
  bindPokemonFriendControls();
}
function PokemonPage(){
  const friends=data.pokemonFriends||[],filtered=filteredPokemonFriends();
  const pages=Math.max(1,Math.ceil(filtered.length/POKE_PAGE_SIZE));
  pokemonUi.page=Math.min(pokemonUi.page,pages);
  const shown=filtered.slice((pokemonUi.page-1)*POKE_PAGE_SIZE,pokemonUi.page*POKE_PAGE_SIZE);
  const sent=friends.reduce((n,f)=>n+(Number(f.giftsSent)||0),0),received=friends.reduce((n,f)=>n+(Number(f.giftsReceived)||0),0);
  const vivCounts={},friendshipCounts={};
  friends.forEach(f=>{const v=f.vivillon||"Unknown";vivCounts[v]=(vivCounts[v]||0)+1;friendshipCounts[f.friendship]=(friendshipCounts[f.friendship]||0)+1});
  const vivillons=Object.keys(vivCounts).sort((a,b)=>a.localeCompare(b));
  const openFriend=pokemonUi.openCard?friends.find(f=>f.id===pokemonUi.openCard):null;
  return shell(`${head("Pokémon GO","Your complete friend and gift tracker")}
    <section class="pokemon-hero"><div class="poke-metrics">
      <div class="metric-card"><span>Total friends</span><strong>${friends.length}</strong></div>
      <div class="metric-card"><span>Gifts sent</span><strong>${sent}</strong></div>
      <div class="metric-card"><span>Gifts received</span><strong>${received}</strong></div>
      <div class="metric-card"><span>Vivillon patterns</span><strong>${Object.keys(vivCounts).filter(v=>v!=="Unknown").length}</strong></div>
    </div></section>
    <div class="poke-tabs poke-tabs-five">
      <button class="${pokemonUi.view==="friends"?"active":""}" data-poke-view="friends">👥 Friends</button>
      <button class="${pokemonUi.view==="add"?"active":""}" data-poke-view="add">➕ Add friend</button>
      <button class="${pokemonUi.view==="vivillon"?"active":""}" data-poke-view="vivillon">🦋 Vivillon</button>
      <button class="${pokemonUi.view==="stats"?"active":""}" data-poke-view="stats">📊 Stats</button><button class="${pokemonUi.view==="import"?"active":""}" data-poke-view="import">📥 Import</button>
    </div>
    ${pokemonUi.view==="add"?`<section class="card"><h2>Add a new friend</h2><div class="form-grid">
      <input class="field" id="pokeName" placeholder="Trainer name"><input class="field" id="pokeNickname" placeholder="Nickname (optional)">
      <div class="two-col"><select class="field" id="pokeFriendship">${FRIENDSHIP_LEVELS.map(x=>`<option>${x}</option>`).join("")}</select>
      <select class="field" id="pokeVivillon">${VIVILLON_PATTERNS.map(x=>`<option>${x}</option>`).join("")}</select></div>
      <input class="field" id="pokeCountry" placeholder="Country"><textarea class="field" id="pokeNotes" placeholder="Notes"></textarea>
      <button class="primary" id="addPokemonFriend">Add friend</button></div></section>`:""}
    ${pokemonUi.view==="friends"?`<section class="card poke-filters">
      <input class="field" id="pokeSearch" value="${esc(pokemonUi.search)}" placeholder="Search trainer, country or Vivillon">
      <div class="two-col"><select class="field" id="pokeFriendshipFilter"><option value="all">All friendship levels</option>${FRIENDSHIP_LEVELS.map(x=>`<option value="${x}" ${pokemonUi.friendship===x?"selected":""}>${x}</option>`).join("")}</select>
      <select class="field" id="pokeVivillonFilter"><option value="all">All Vivillon patterns</option>${vivillons.map(x=>`<option value="${esc(x)}" ${pokemonUi.vivillon===x?"selected":""}>${esc(x)} (${vivCounts[x]})</option>`).join("")}</select></div>
      <select class="field" id="pokeInactivityFilter">
        <option value="all" ${pokemonUi.inactivity==="all"?"selected":""}>All interaction activity</option>
        <option value="none" ${pokemonUi.inactivity==="none"?"selected":""}>No interaction logged</option>
        <option value="30" ${pokemonUi.inactivity==="30"?"selected":""}>30+ days inactive</option>
        <option value="15" ${pokemonUi.inactivity==="15"?"selected":""}>15+ days inactive</option>
        <option value="7" ${pokemonUi.inactivity==="7"?"selected":""}>7+ days inactive</option>
        <option value="3" ${pokemonUi.inactivity==="3"?"selected":""}>3+ days inactive</option>
      </select>
      <p class="poke-results" id="pokeResultsCount">${filtered.length} friend${filtered.length===1?"":"s"} found</p></section>
      <section class="poke-friend-list" id="pokeFriendResults">${shown.length?shown.map(PokemonFriendCard).join(""):`<section class="card"><p>No friends match those filters.</p></section>`}</section>
      <div id="pokePagination">${pages>1?`<div class="poke-pagination"><button class="secondary" data-poke-page="${pokemonUi.page-1}" ${pokemonUi.page===1?"disabled":""}>← Previous</button><span>Page ${pokemonUi.page} of ${pages}</span><button class="secondary" data-poke-page="${pokemonUi.page+1}" ${pokemonUi.page===pages?"disabled":""}>Next →</button></div>`:""}</div>`:""}
    ${pokemonUi.view==="vivillon"?`<section class="card"><h2>🦋 Vivillon collection</h2><div class="vivillon-grid">${Object.entries(vivCounts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>`<button class="vivillon-tile" data-vivillon-jump="${esc(name)}"><strong>${count}</strong><span>${esc(name)}</span></button>`).join("")}</div></section>`:""}

    ${pokemonUi.view==="import"?`<section class="card"><h2>📥 Import Excel tracker</h2><p class="muted">Choose an .xlsx file with a sheet named <b>Friends</b>. Every populated trainer row is read automatically—there is no row limit.</p><label class="excel-import-drop"><span>📄 Choose Excel file</span><small>.xlsx only</small><input id="pokemonExcelImport" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label><div class="import-options"><label><input type="radio" name="pokeImportMode" value="merge" checked><span><b>Merge safely</b><small>Add new trainers and update details while keeping gift totals.</small></span></label><label><input type="radio" name="pokeImportMode" value="replace"><span><b>Replace list</b><small>Replace all friends, preserving gift totals for matching trainer names.</small></span></label></div><div id="pokemonImportPreview"></div></section>`:""}
    ${pokemonUi.view==="stats"?`<section class="card"><h2>Friendship levels</h2><div class="poke-stat-list">${FRIENDSHIP_LEVELS.map(level=>`<button class="poke-stat-row" data-friendship-jump="${level}"><span>${pokeEmoji(level)} ${level}</span><strong>${friendshipCounts[level]||0}</strong></button>`).join("")}</div></section>
      <section class="card"><h2>Gift totals</h2><div class="stat-grid"><div class="stat"><strong>${sent}</strong><span>You sent</span></div><div class="stat"><strong>${received}</strong><span>They sent</span></div><div class="stat"><strong>${sentToday}</strong><span>Sent today</span></div><div class="stat"><strong>${receivedToday}</strong><span>Received today</span></div></div></section>`:""}
  ${openFriend?PokemonFriendDetail(openFriend):""}
  `,"pokemon");
}
function PokemonFriendCard(f){
  if(pokemonUi.editing===f.id)return `<section class="card poke-friend-card editing"><div class="form-grid">
    <input class="field" data-edit-field="name" value="${esc(f.name)}"><input class="field" data-edit-field="nickname" value="${esc(f.nickname)}" placeholder="Nickname">
    <div class="two-col"><select class="field" data-edit-field="friendship">${FRIENDSHIP_LEVELS.map(x=>`<option ${f.friendship===x?"selected":""}>${x}</option>`).join("")}</select><select class="field" data-edit-field="vivillon">${VIVILLON_PATTERNS.map(x=>`<option ${f.vivillon===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <input class="field" data-edit-field="country" value="${esc(f.country)}" placeholder="Country"><textarea class="field" data-edit-field="notes" placeholder="Notes">${esc(f.notes)}</textarea>
    <div class="item-actions"><button class="primary" data-poke-save="${f.id}">Save changes</button><button class="secondary" data-poke-cancel="${f.id}">Cancel</button><button class="mini danger" data-poke-delete="${f.id}">Delete</button></div>
  </div></section>`;
  return `<section class="card poke-friend-card">
    <button class="poke-friend-open" data-open-friend-card="${f.id}">
      <div class="poke-friend-top"><div class="poke-avatar">${pokeEmoji(f.friendship)}</div><div class="poke-main"><h2>${esc(f.name)}</h2><p>${esc(f.nickname||f.country||"No nickname or country")}</p></div><span class="poke-open-arrow">›</span></div>
      ${friendshipCard(f)}
      <div class="poke-chips"><span>🦋 ${esc(f.vivillon||"Unknown")}</span>${f.country?`<span>🌍 ${esc(f.country)}</span>`:""}<span class="${(pokeDaysSince(f.lastInteraction)??999)>=14?"inactive-chip":""}">🕒 ${pokeInactiveLabel(f)}</span></div>
    </button>
    <div class="gift-buttons"><button class="${giftLoggedToday(f,"sent")?"gift-done":""}" data-gift-sent="${f.id}"><b>${giftLoggedToday(f,"sent")?"✓ Sent today":"🎁 I sent a gift"}</b><small>${f.giftsSent||0} total · ${pokeDate(f.lastGiftSent)}</small></button><button class="${giftLoggedToday(f,"received")?"gift-done":""}" data-gift-received="${f.id}"><b>${giftLoggedToday(f,"received")?"✓ Received today":"💌 They sent me a gift"}</b><small>${f.giftsReceived||0} total · ${pokeDate(f.lastGiftReceived)}</small></button></div>
    <button class="mini poke-card-edit" data-poke-edit="${f.id}">Edit details</button>
    ${f.notes?`<p class="poke-notes">${esc(f.notes)}</p>`:""}</section>`;
}

function excelCellDate(v){if(!v)return"";if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);if(typeof v==="number"){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return isNaN(d)?"":d.toISOString().slice(0,10)}const d=new Date(String(v).trim());return isNaN(d)?"":d.toISOString().slice(0,10)}
function importPokemonWorkbook(file){if(typeof XLSX==="undefined"){toast("Excel importer could not load");return}const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:"array",cellDates:true}),sheet=wb.Sheets["Friends"];if(!sheet){toast('No sheet named "Friends" found');return}const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:"",raw:true}).slice(1).filter(x=>String(x[0]??"").trim()),seen=new Set(),clean=[];rows.forEach(x=>{const k=String(x[0]).trim().toLowerCase();if(k&&!seen.has(k)){seen.add(k);clean.push(x)}});const box=document.querySelector("#pokemonImportPreview");box.innerHTML=`<div class="import-preview"><strong>${clean.length} unique trainers found</strong><span>${rows.length-clean.length} duplicate rows ignored</span><button class="primary" id="confirmPokemonImport">Import now</button></div>`;document.querySelector("#confirmPokemonImport").onclick=()=>{const mode=document.querySelector('input[name="pokeImportMode"]:checked')?.value||"merge",old=new Map((data.pokemonFriends||[]).map(f=>[(f.name||"").trim().toLowerCase(),f])),imported=clean.map((x,i)=>{const name=String(x[0]).trim(),base=old.get(name.toLowerCase())||{};return normalizePokemonFriend({...base,id:base.id||`poke-import-${Date.now()}-${i}`,name,friendship:String(x[1]||base.friendship||"Good Friend").trim(),vivillon:String(x[2]||base.vivillon||"Unknown").trim(),country:String(x[3]||base.country||"").trim(),lastGiftReceived:excelCellDate(x[4])||base.lastGiftReceived||"",lastGiftSent:excelCellDate(x[5])||base.lastGiftSent||"",lastInteraction:excelCellDate(x[6])||base.lastInteraction||"",notes:String(x[9]||base.notes||"").trim(),giftsReceived:Number(base.giftsReceived)||0,giftsSent:Number(base.giftsSent)||0},i)});if(mode==="replace")data.pokemonFriends=imported;else{const im=new Map(imported.map(f=>[f.name.trim().toLowerCase(),f]));data.pokemonFriends=(data.pokemonFriends||[]).map(f=>im.get(f.name.trim().toLowerCase())||f);const names=new Set(data.pokemonFriends.map(f=>f.name.trim().toLowerCase()));imported.forEach(f=>{if(!names.has(f.name.trim().toLowerCase()))data.pokemonFriends.push(f)})}data.pokemonSeededVersion=2;saveData();pokemonUi.view="friends";pokemonUi.page=1;render();toast(`${clean.length} trainers imported ✨`)}}catch(err){console.error(err);toast("That Excel file could not be imported")}};r.readAsArrayBuffer(file)}

function bindPokemonFriendControls(){
  document.querySelectorAll("[data-open-friend-card]").forEach(b=>b.onclick=()=>{pokemonUi.openCard=b.dataset.openFriendCard;render()});
  document.querySelectorAll("[data-poke-page]").forEach(b=>b.onclick=()=>{pokemonUi.page=Number(b.dataset.pokePage);refreshPokemonFriendResults();document.querySelector("#pokeSearch")?.scrollIntoView({block:"nearest"})});
  document.querySelectorAll("[data-gift-sent]").forEach(b=>b.onclick=()=>logPokemonGift(b.dataset.giftSent,"sent"));
  document.querySelectorAll("[data-gift-received]").forEach(b=>b.onclick=()=>logPokemonGift(b.dataset.giftReceived,"received"));
  document.querySelectorAll("[data-poke-edit]").forEach(b=>b.onclick=()=>{pokemonUi.openCard=null;pokemonUi.editing=b.dataset.pokeEdit;render()});
  document.querySelectorAll("[data-poke-cancel]").forEach(b=>b.onclick=()=>{pokemonUi.editing=null;render()});
  document.querySelectorAll("[data-poke-save]").forEach(b=>b.onclick=()=>{const card=b.closest(".poke-friend-card"),f=data.pokemonFriends.find(x=>x.id===b.dataset.pokeSave);if(!f||!card)return;card.querySelectorAll("[data-edit-field]").forEach(i=>f[i.dataset.editField]=i.value.trim());saveData();pokemonUi.editing=null;render();toast("Friend updated ✨")});
  document.querySelectorAll("[data-poke-delete]").forEach(b=>b.onclick=()=>{const f=data.pokemonFriends.find(x=>x.id===b.dataset.pokeDelete);if(!f||!confirm(`Delete ${f.name}?`))return;data.pokemonFriends=data.pokemonFriends.filter(x=>x.id!==f.id);saveData();pokemonUi.editing=null;render()});
}
function bindPokemon(){
  bindPokemonFriendControls();
  document.querySelectorAll("[data-poke-view]").forEach(b=>b.onclick=()=>{pokemonUi.view=b.dataset.pokeView;pokemonUi.editing=null;render()});
  document.querySelectorAll("[data-close-friend-card]").forEach(b=>b.onclick=e=>{if(e.target===b||b.classList.contains("poke-detail-close")){pokemonUi.openCard=null;render()}});
  document.querySelectorAll("[data-detail-gift-sent]").forEach(b=>b.onclick=()=>logPokemonGift(b.dataset.detailGiftSent,"sent",document.querySelector("#detailGiftDate")?.value||today()));
  document.querySelectorAll("[data-detail-gift-received]").forEach(b=>b.onclick=()=>logPokemonGift(b.dataset.detailGiftReceived,"received",document.querySelector("#detailGiftDate")?.value||today()));
  document.querySelectorAll("[data-detail-edit]").forEach(b=>b.onclick=()=>{pokemonUi.openCard=null;pokemonUi.editing=b.dataset.detailEdit;render()});

  document.querySelector("#pokemonExcelImport")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)importPokemonWorkbook(f)});
  document.querySelector("#pokeSearch")?.addEventListener("input",e=>{
    pokemonUi.search=e.target.value;
    pokemonUi.page=1;
    clearTimeout(pokemonSearchTimer);
    pokemonSearchTimer=setTimeout(refreshPokemonFriendResults,90);
  });
  document.querySelector("#pokeFriendshipFilter")?.addEventListener("change",e=>{pokemonUi.friendship=e.target.value;pokemonUi.page=1;saveData();render()});
  document.querySelector("#pokeVivillonFilter")?.addEventListener("change",e=>{pokemonUi.vivillon=e.target.value;pokemonUi.page=1;render()});
  document.querySelector("#pokeInactivityFilter")?.addEventListener("change",e=>{pokemonUi.inactivity=e.target.value;pokemonUi.page=1;render()});
  document.querySelector("#addPokemonFriend")?.addEventListener("click",()=>{const name=document.querySelector("#pokeName").value.trim();if(!name){toast("Add a trainer name");return}data.pokemonFriends.unshift(normalizePokemonFriend({id:`poke-${Date.now()}`,name,nickname:document.querySelector("#pokeNickname").value.trim(),friendship:document.querySelector("#pokeFriendship").value,vivillon:document.querySelector("#pokeVivillon").value,country:document.querySelector("#pokeCountry").value.trim(),notes:document.querySelector("#pokeNotes").value.trim()},0));saveData();pokemonUi.view="friends";pokemonUi.page=1;render();toast("Friend added 🎉")});
  document.querySelectorAll("[data-vivillon-jump]").forEach(b=>b.onclick=()=>{pokemonUi.vivillon=b.dataset.vivillonJump;pokemonUi.friendship="all";pokemonUi.search="";pokemonUi.page=1;pokemonUi.view="friends";render()});
  document.querySelectorAll("[data-friendship-jump]").forEach(b=>b.onclick=()=>{pokemonUi.friendship=b.dataset.friendshipJump;pokemonUi.vivillon="all";pokemonUi.search="";pokemonUi.page=1;pokemonUi.view="friends";render()});
}
