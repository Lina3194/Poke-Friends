function head(title,subtitle){return `<header class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div></header>`;}
function shell(content){return `<main class="shell pokemon-standalone">${content}</main>`;}
function render(){document.body.classList.add("dark");document.body.dataset.colorTheme="floral";document.body.dataset.route="pokemon";document.querySelector("#app").innerHTML=PokemonPage();bindPokemon();bindBetaTools();}
function bindBetaTools(){
  document.querySelector("#exportBetaData")?.addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),pokemonFriends:data.pokemonFriends},null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`pokemon-tracker-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Backup downloaded");
  });
  document.querySelector("#importBetaData")?.addEventListener("change",e=>{
    const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.pokemonFriends))throw new Error();data.pokemonFriends=x.pokemonFriends.map(normalizePokemonFriend);saveData();render();toast("Backup restored");}catch{toast("That backup file is not valid")}};r.readAsText(file);
  });
  document.querySelector("#resetBetaData")?.addEventListener("click",()=>{if(confirm("Delete all Pokémon tracker data on this device?")){data={pokemonFriends:[]};saveData();render();toast("Tracker reset")}});
}
const originalPokemonPage=PokemonPage;
PokemonPage=function(){
  const html=originalPokemonPage();
  return html.replace('<section class="pokemon-hero">',`<section class="beta-tools card"><div><strong>Beta tools <em class="beta-version">v1.2</em></strong><small>Your data stays only on this device.</small></div><div class="beta-tool-buttons"><button class="secondary" id="exportBetaData">Export backup</button><label class="secondary beta-import">Import backup<input id="importBetaData" type="file" accept="application/json,.json"></label><button class="mini danger" id="resetBetaData">Reset</button></div></section><section class="pokemon-hero">`);
};
render();
