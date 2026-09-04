function updatePreview(type){
  const nameField = document.getElementById(type+'Name');
  if(!nameField) return;
  const name = nameField.value || (type==='lost'?'Your lost item':'Your found item');
  const cat = document.getElementById(type+'Category').value;
  const loc = document.getElementById(type+'Location').value || 'Location…';
  const date = document.getElementById(type+'Date').value || '—';
  const desc = document.getElementById(type+'Desc').value || 'Add a description so people can recognize it.';
  const el = document.getElementById('preview'+(type==='lost'?'Lost':'Found'));
  if(!el) return;
  el.innerHTML = `
    <div class="pin"></div>
    <div class="stamp">${type}</div>
    <div class="tag-icon">${cat.split(' ')[0]}</div>
    <h3>${name}</h3>
    <div class="tag-meta"><span>📍 ${loc}</span><span>📅 ${date}</span></div>
    <div class="tag-desc">${desc}</div>
    <div class="perforation"><span class="ticket-id">#PREVIEW</span><button class="claim-btn" type="button">${type==='lost'?'I found this':'This is mine'}</button></div>
  `;
}

function submitPost(e,type){
  e.preventDefault();
  alert((type==='lost'?'Lost':'Found')+' item posted to the board! (demo only)');
  window.location.href='Homepage.html';
  return false;
}

updatePreview('lost');
updatePreview('found');