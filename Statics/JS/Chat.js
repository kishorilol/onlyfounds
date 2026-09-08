/* chat.js — index.html + messages.html */
// Handles: opening chat modal, rendering message thread, sending/receiving messages

const CONVERSATIONS = {
  "LF-2291":{name:"Black leather wallet",status:"lost",time:"2h ago",unread:true,
    thread:[{from:"them",text:"Hi! I think I found your wallet near Ratna Park. It has a student ID inside?"}]},
  "LF-2279":{name:"iPhone 13, crashed case",status:"found",time:"1d ago",unread:true,
    thread:[{from:"you",text:"Hey, I saw your found post — that might be my phone, purple case?"},{from:"them",text:"Yes! Purple case with a crack on top right corner. Where did you lose it?"}]},
};
const AUTO_REPLIES = [
  "Sounds right — can you describe it a bit more so I can be sure?",
  "Got it, thanks for the details. When are you free to meet up?",
  "That matches what I have. I can meet near the original location tomorrow.",
  "Perfect, I'll bring it with me. See you there!"
];

function openChat(postId, postName, status){
  if(!CONVERSATIONS[postId]){
    CONVERSATIONS[postId] = {name:postName, status:status, time:'just now', unread:false,
      thread:[{from:'them', text: status==='lost'
        ? `Hi! Thanks for reaching out about "${postName}". Where did you find it?`
        : `Hi! I think "${postName}" might be mine. Can you tell me more about where you found it?`}]};
  } else {
    CONVERSATIONS[postId].unread = false;
  }
  const c = CONVERSATIONS[postId];
  const chatWho = document.getElementById('chatWho');
  const chatSub = document.getElementById('chatSub');
  const chatPanel = document.getElementById('chatPanel');
  const chatOverlay = document.getElementById('chatOverlay');
  if(!chatOverlay) return;
  if(chatWho) chatWho.textContent = postName;
  if(chatSub) chatSub.textContent = 're: ' + (status==='lost' ? 'Lost post' : 'Found post') + ' #' + postId;
  if(chatPanel){
    chatPanel.dataset.status = status;
    chatPanel.dataset.postId = postId;
  }
  renderThread();
  chatOverlay.classList.add('open');
  const chatInput = document.getElementById('chatInput');
  if(chatInput) chatInput.focus();
  updateUnreadBadge();
}

function renderThread(){
  const threadEl = document.getElementById('chatThread');
  const postId = document.getElementById('chatPanel')?.dataset.postId;
  if(!threadEl || !postId) return;
  const c = CONVERSATIONS[postId];
  if(!c) return;
  threadEl.innerHTML = c.thread.map(m=>`<div class="bubble ${m.from}">${m.text}</div>`).join('');
  threadEl.scrollTop = threadEl.scrollHeight;
}

function closeChat(){
  const el = document.getElementById('chatOverlay');
  if(el) el.classList.remove('open');
}

function sendMessage(){
  const input = document.getElementById('chatInput');
  const text = input ? input.value.trim() : '';
  if(!text) return;
  const postId = document.getElementById('chatPanel')?.dataset.postId;
  if(!postId) return;
  const c = CONVERSATIONS[postId];
  if(!c) return;
  c.thread.push({from:'you', text});
  input.value = '';
  renderThread();

  const threadEl = document.getElementById('chatThread');
  const typing = document.createElement('div');
  typing.className = 'bubble typing';
  typing.textContent = '•••';
  threadEl.appendChild(typing);
  threadEl.scrollTop = threadEl.scrollHeight;

  setTimeout(()=>{
    typing.remove();
    const reply = AUTO_REPLIES[Math.floor(Math.random()*AUTO_REPLIES.length)];
    c.thread.push({from:'them', text: reply});
    renderThread();
  }, 1000 + Math.random()*700);
}
