function renderInbox(){
  const list = document.getElementById('convoList');
  if(!list) return;
  const entries = Object.entries(CONVERSATIONS);
  if(entries.length===0){
    list.innerHTML = `<p style="color:var(--ink-soft);font-family:var(--font-mono);font-size:0.85rem;">No conversations yet. Message someone from a post on the board.</p>`;
    updateUnreadBadge();
    return;
  }
  list.innerHTML = entries.map(([id,c])=>{
    const last = c.thread[c.thread.length-1];
    return `<div class="convo-row" onclick="openChat('${id}','${c.name.replace(/'/g,"\\'")}','${c.status}')">
      <div class="convo-icon">${c.status==='lost'?'🔴':'🟢'}</div>
      <div class="convo-info">
        <div class="top"><h4>${c.name}</h4><span class="time">${c.time}</span></div>
        <p>${last.from==='you'?'You: ':''}${last.text}</p>
      </div>
      ${c.unread?'<div class="unread-dot"></div>':''}
    </div>`;
  }).join('');
  updateUnreadBadge();
}

// Initialize inbox on page load
renderInbox();
updateUnreadBadge();
updateHeaderAuth();