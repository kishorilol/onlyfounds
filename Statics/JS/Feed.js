const CATEGORIES = ["📱 Electronics","🔑 Keys","👜 Bag","🐶 Pet","📄 Documents","💍 Jewelry","👕 Clothing","🚲 Bike","📦 Other"];

const POSTS = [
  {id:"LF-2291",status:"lost",name:"Black leather wallet",cat:"👜 Bag",loc:"Ratna Park, Kathmandu",date:"2026-08-14",desc:"Brown stitching, has a bus pass and student ID inside."},
  {id:"LF-2288",status:"found",name:"Silver house keys",cat:"🔑 Keys",loc:"Thamel, near Fire & Ice",date:"2026-08-15",desc:"Three keys on a red carabiner, small owl charm."},
  {id:"LF-2285",status:"lost",name:"Golden retriever — Bruno",cat:"🐶 Pet",loc:"Baneshwor park",date:"2026-08-13",desc:"Answers to Bruno, blue collar, very friendly."},
  {id:"LF-2279",status:"found",name:"iPhone 13, crashed case",cat:"📱 Electronics",loc:"Pulchowk bus stop",date:"2026-08-12",desc:"Locked, purple case, found on the bench."},
  {id:"LF-2274",status:"lost",name:"Passport & folder",cat:"📄 Documents",loc:"Tribhuvan Airport",date:"2026-08-10",desc:"Blue folder with passport and boarding pass copies."},
  {id:"LF-2270",status:"found",name:"Silver necklace",cat:"💍 Jewelry",loc:"New Road jewelry lane",date:"2026-08-09",desc:"Thin chain with a small pendant, found near a shop entrance."},
  {id:"LF-2266",status:"lost",name:"Grey hoodie",cat:"👕 Clothing",loc:"Patan Durbar Square",date:"2026-08-08",desc:"Left on a bench, has a small tear on the left sleeve."},
  {id:"LF-2261",status:"found",name:"Mountain bike, red frame",cat:"🚲 Bike",loc:"Budhanilkantha trail",date:"2026-08-07",desc:"Chained but unlocked, left near the trailhead sign."},
  {id:"LF-2258",status:"lost",name:"AirPods case",cat:"📱 Electronics",loc:"Jawalakhel bus park",date:"2026-08-05",desc:"White case, small dent on the lid, no earbuds inside."},
  {id:"LF-2250",status:"found",name:"Kids' backpack",cat:"👜 Bag",loc:"Bhaktapur Durbar Square",date:"2026-08-03",desc:"Cartoon print, contains a water bottle and pencil case."},
];

let activeStatus = "all";
let activeCats = new Set();
let searchTerm = "";
let locTerm = "";
let dateFilter = "all";
let sortOrder = "newest";

function daysAgo(dateStr){
  const d = new Date(dateStr); const now = new Date("2026-08-17");
  return Math.floor((now-d)/(1000*60*60*24));
}

function buildCategoryChips(){
  const wrap = document.getElementById('categoryChips');
  if(!wrap) return;
  wrap.innerHTML = CATEGORIES.map(c=>`<button class="chip" data-cat="${c}">${c}</button>`).join('');
  wrap.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click',()=>{
      const c = chip.dataset.cat;
      if(activeCats.has(c)){ activeCats.delete(c); chip.classList.remove('on'); }
      else { activeCats.add(c); chip.classList.add('on'); }
      render();
    });
  });
}

const statusToggleEl = document.getElementById('statusToggle');
if(statusToggleEl){
  statusToggleEl.addEventListener('click',(e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    activeStatus = btn.dataset.s;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    render();
  });
}

const searchEl = document.getElementById('searchInput');
if(searchEl){
  searchEl.addEventListener('input',(e)=>{ searchTerm = e.target.value.toLowerCase(); render(); });
}

const locationEl = document.getElementById('locationInput');
if(locationEl){
  locationEl.addEventListener('input',(e)=>{ locTerm = e.target.value.toLowerCase(); render(); });
}

const dateEl = document.getElementById('dateSelect');
if(dateEl){
  dateEl.addEventListener('change',(e)=>{ dateFilter = e.target.value; render(); });
}

const sortEl = document.getElementById('sortSelect');
if(sortEl){
  sortEl.addEventListener('change',(e)=>{ sortOrder = e.target.value; render(); });
}

const clearEl = document.getElementById('clearFilters');
if(clearEl){
  clearEl.addEventListener('click',()=>{
    activeStatus="all"; activeCats.clear(); searchTerm=""; locTerm=""; dateFilter="all";
    if(searchEl) searchEl.value="";
    if(locationEl) locationEl.value="";
    if(dateEl) dateEl.value="all";
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
    document.querySelectorAll('#statusToggle button').forEach(b=>b.classList.remove('on'));
    const allBtn = document.querySelector('#statusToggle button[data-s="all"]');
    if(allBtn) allBtn.classList.add('on');
    render();
  });
}

function render(){
  const board = document.getElementById('board');
  const resultCount = document.getElementById('resultCount');
  if(!board) return;
  let items = POSTS.filter(p=>{
    if(activeStatus!=="all" && p.status!==activeStatus) return false;
    if(activeCats.size>0 && !activeCats.has(p.cat)) return false;
    if(searchTerm && !(p.name.toLowerCase().includes(searchTerm)||p.desc.toLowerCase().includes(searchTerm)||p.loc.toLowerCase().includes(searchTerm))) return false;
    if(locTerm && !p.loc.toLowerCase().includes(locTerm)) return false;
    if(dateFilter==="today" && daysAgo(p.date)>0) return false;
    if(dateFilter==="week" && daysAgo(p.date)>7) return false;
    if(dateFilter==="month" && daysAgo(p.date)>30) return false;
    return true;
  });
  items.sort((a,b)=> sortOrder==="newest" ? new Date(b.date)-new Date(a.date) : new Date(a.date)-new Date(b.date));

  if(resultCount) resultCount.textContent = `${items.length} post${items.length!==1?'s':''}`;
  if(items.length===0){
    board.innerHTML = `<div class="empty-state">Nothing pinned here yet.<br>Try clearing a filter, or be the first to post.</div>`;
    return;
  }
  board.innerHTML = items.map((p,i)=>{
    const rot = (i%5===0?-2:i%5===1?1.5:i%5===2?-1:i%5===3?2:0.5);
    return `
    <div class="tag-card" data-status="${p.status}" style="--rot:${rot}deg;">
      <div class="pin"></div>
      <div class="stamp">${p.status}</div>
      <div class="tag-icon">${p.cat.split(' ')[0]}</div>
      <h3>${p.name}</h3>
      <div class="tag-meta">
        <span>📍 ${p.loc}</span>
        <span>📅 ${p.date}</span>
      </div>
      <div class="tag-desc">${p.desc}</div>
      <div class="perforation">
        <span class="ticket-id">#${p.id}</span>
        <button class="claim-btn" onclick="openChat('${p.id}','${p.name.replace(/'/g,"\\'")}','${p.status}')">${p.status==='lost'?'I found this':'This is mine'}</button>
      </div>
    </div>`;
  }).join('');
}

// Initialize feed on page load
buildCategoryChips();
render();
updateUnreadBadge();
updateHeaderAuth();