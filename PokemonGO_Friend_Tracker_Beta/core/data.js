const STORAGE_KEY="pokemon-go-friend-tracker-beta-v1";
const POKEMON_FRIEND_SEED=[];
function normalizePokemonFriend(f={},i=0){
  return {
    id:f.id||`poke-${Date.now()}-${i}`,
    name:String(f.name||"").trim(), nickname:String(f.nickname||"").trim(),
    friendship:f.friendship||"Good Friend", vivillon:f.vivillon||"Unknown",
    country:String(f.country||"").trim(),
    lastGiftReceived:f.lastGiftReceived||"", lastGiftSent:f.lastGiftSent||"",
    giftsReceived:Number(f.giftsReceived)||0, giftsSent:Number(f.giftsSent)||0,
    giftReceivedDates:Array.isArray(f.giftReceivedDates)?f.giftReceivedDates:[],
    giftSentDates:Array.isArray(f.giftSentDates)?f.giftSentDates:[],
    lastInteraction:f.lastInteraction||"", active:f.active!==false,
    notes:String(f.notes||"").trim()
  };
}
function loadData(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(saved&&Array.isArray(saved.pokemonFriends)) return {pokemonFriends:saved.pokemonFriends.map(normalizePokemonFriend)};
  }catch(e){console.warn(e)}
  return {pokemonFriends:[]};
}
let data=loadData();
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function formatDate(value){return new Date(value+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(text){const el=document.querySelector("#toast");el.textContent=text;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800);}
