// Minimal JS with client-side persistence: registration, avatar upload, edit/delete
const postsEl = document.getElementById('posts');
const postBtn = document.getElementById('postBtn');
const composeInput = document.getElementById('composeInput');
const accountArea = document.getElementById('accountArea');

const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');
const pfName = document.getElementById('pfName');
const pfHandle = document.getElementById('pfHandle');
const pfAvatarInput = document.getElementById('pfAvatarInput');
const pfAvatarPreview = document.getElementById('pfAvatarPreview');
const pfClose = document.getElementById('pfClose');

const editModal = document.getElementById('editModal');
const editTextarea = document.getElementById('editTextarea');
const saveEdit = document.getElementById('saveEdit');
const cancelEdit = document.getElementById('cancelEdit');

const STORAGE_USER = '3d_user';
const STORAGE_POSTS = '3d_posts';

let currentUser = loadUser();
let posts = loadPosts();
let editingPostId = null;

function loadUser(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_USER)) || null;
  }catch(e){return null}
}
function saveUser(u){
  localStorage.setItem(STORAGE_USER, JSON.stringify(u));
}
function loadPosts(){
  try{return JSON.parse(localStorage.getItem(STORAGE_POSTS)) || []}catch(e){return []}
}
function savePosts(){
  localStorage.setItem(STORAGE_POSTS, JSON.stringify(posts));
}

function renderAccountArea(){
  accountArea.innerHTML='';
  if(!currentUser){
    const btn = document.createElement('button');
    btn.className='reg-btn';
    btn.textContent='Register / Login';
    btn.addEventListener('click', ()=>openProfileModal());
    accountArea.appendChild(btn);
    return;
  }
  const div = document.createElement('div');
  div.className='user';
  const avatarWrap = document.createElement('div');
  avatarWrap.className='mini-avatar';
  const img = document.createElement('img');
  img.src = currentUser.avatar || 'assets/logo.svg';
  avatarWrap.appendChild(img);
  const name = document.createElement('div');
  name.innerHTML = `<strong>${escapeHtml(currentUser.name)}</strong>`;
  div.appendChild(avatarWrap);
  div.appendChild(name);
  div.addEventListener('click', ()=>openProfileModal());
  accountArea.appendChild(div);
}

// render the sidebar profile card from current user
function renderSidebarProfile(){
  const sideName = document.getElementById('sideName');
  const sideHandle = document.getElementById('sideHandle');
  const sideAvatarImg = document.getElementById('sideAvatarImg');
  const sideBadges = document.getElementById('sideBadges');
  const sideAdminInfo = document.getElementById('sideAdminInfo');
  if(!sideName || !sideHandle || !sideAvatarImg) return;
  if(!currentUser){
    sideName.textContent = 'Guest';
    sideHandle.textContent = '@guest';
    sideAvatarImg.src = 'assets/logo.svg';
    sideBadges.innerHTML = '';
    sideAdminInfo.style.display = 'none';
    return;
  }
  sideName.textContent = currentUser.name || currentUser.handle || 'User';
  sideHandle.textContent = currentUser.handle || '';
  sideAvatarImg.src = currentUser.avatar || 'assets/logo.svg';
  sideBadges.innerHTML = renderBadges(currentUser);
  if(currentUser.admin){ sideAdminInfo.style.display = 'block'; } else { sideAdminInfo.style.display = 'none'; }
}

function openProfileModal(){
  if(currentUser){
    pfName.value = currentUser.name || '';
    pfHandle.value = currentUser.handle || '';
    pfAvatarPreview.src = currentUser.avatar || 'assets/logo.svg';
  } else {
    pfName.value = '';
    pfHandle.value = '';
    pfAvatarPreview.src = 'assets/logo.svg';
  }
  profileModal.classList.remove('hidden');
}

pfClose.addEventListener('click', ()=>profileModal.classList.add('hidden'));

pfAvatarInput.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    pfAvatarPreview.src = reader.result;
  };
  reader.readAsDataURL(f);
});

profileForm.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const name = pfName.value.trim();
  let handle = pfHandle.value.trim();
  if(!handle.startsWith('@')) handle = '@'+handle;
  const avatar = pfAvatarPreview.src;
  currentUser = {name, handle, avatar, admin: true, verified: true};
  saveUser(currentUser);
  renderAccountArea();
  // update sidebar profile
  renderSidebarProfile();
  // update existing posts authored by this user to use new avatar/name
  posts = posts.map(p=>{
    if(p.author && p.author.handle === currentUser.handle){
      p.author.avatar = currentUser.avatar;
      p.author.name = currentUser.name;
      p.author.admin = currentUser.admin;
      p.author.verified = currentUser.verified;
    }
    return p;
  });
  savePosts(); renderPosts();
  profileModal.classList.add('hidden');
});

function makePostElement(post){
  const el = document.createElement('article');
  el.className = 'post card-3d';
  const isOwn = currentUser && post.author && (post.author.handle === currentUser.handle);
  const badges = renderBadges(post.author);
  el.innerHTML = `
    <div class="meta">
      <div class="avatar"><img src="${post.author.avatar || 'assets/logo.svg'}" alt="avatar" style="width:100%;height:100%;border-radius:10px;object-fit:cover"></div>
      <div class="author"><strong><span class="display-name">${escapeHtml(post.author.name)}</span>${badges}</strong> <div class="handle">${escapeHtml(post.author.handle)}</div></div>
    </div>
    <div class="content">${escapeHtml(post.text)}</div>
  `;
  if(isOwn){
    const actions = document.createElement('div');
    actions.className='post-actions';
    const editBtn = document.createElement('button'); editBtn.textContent='Edit'; editBtn.dataset.id = post.id; editBtn.className='edit-btn';
    const delBtn = document.createElement('button'); delBtn.textContent='Delete'; delBtn.dataset.id = post.id; delBtn.className='delete-btn';
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    el.appendChild(actions);
  }
  attachTilt(el);
  return el;
}

function renderBadges(author){
  if(!author) return '';
  const parts = [];
  if(author.admin){
    parts.push(`<span class="badge staff" title="Staff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" fill="currentColor"/></svg></span>`);
    parts.push(`<span class="badge admin-logo" title="Official Administrator"><img src="assets/logo.svg" alt="logo"></span>`);
  }
  if(author.verified){
    parts.push(`<span class="badge verified" title="Verified"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5858 13.4142L7.75735 10.5858L6.34314 12L10.5858 16.2427L17.6568 9.1716L16.2426 7.75739L10.5858 13.4142Z" fill="currentColor" /></svg></span>`);
  }
  if(parts.length===0) return '';
  return `<span class="badges">${parts.join('')}</span>`;
}

function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function renderPosts(){
  postsEl.innerHTML = '';
  posts.slice().reverse().forEach(post=>{
    postsEl.appendChild(makePostElement(post));
  });
}

// ensure sidebar is rendered initially
renderSidebarProfile();

// Initialize sample posts if none
if(posts.length===0){
  posts.push({id: Date.now()+1, text:'Exploring 3D transforms for a more tactile feed!', author:{name:'Admin',handle:'@admin',avatar:'assets/logo.svg',admin:true,verified:true}});
  posts.push({id: Date.now()+2, text:'CSS-only depth can feel surprisingly immersive.', author:{name:'Designer',handle:'@designer',avatar:'assets/logo.svg',admin:false,verified:false}});
  posts.push({id: Date.now()+3, text:'Micro-interactions make browsing delightful.', author:{name:'Creator',handle:'@creator',avatar:'assets/logo.svg',admin:false,verified:true}});
  savePosts();
}

renderAccountArea();
renderPosts();

const searchInput = document.getElementById('searchInput');
const allPosts = () => posts.slice().reverse();

searchInput.addEventListener('input', ()=>{
  const term = searchInput.value.trim().toLowerCase();
  if(!term){
    renderPosts();
    return;
  }
  const matched = posts.filter(p=>{
    const text = `${p.text} ${p.author.name} ${p.author.handle}`.toLowerCase();
    return text.includes(term);
  });
  postsEl.innerHTML = '';
  matched.slice().reverse().forEach(post=>postsEl.appendChild(makePostElement(post)));
});

// Sidebar menu interactions
function wireMenu(){
  const items = document.querySelectorAll('.menu a');
  items.forEach(it=>{
    it.addEventListener('click', ()=>{
      items.forEach(i=>i.classList.remove('active'));
      it.classList.add('active');
      const action = it.dataset.action;
      handleMenuAction(action);
    });
    it.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') it.click(); });
  });
}

function handleMenuAction(action){
  if(action === 'home'){
    renderPosts();
    return;
  }
  if(action === 'explore'){
    // show trending list as temporary explore feed
    const trending = Array.from(document.querySelectorAll('.trending-list li')).map(li=>li.textContent.trim());
    postsEl.innerHTML = '';
    trending.forEach(t=>{
      const el = document.createElement('article'); el.className='post card-3d';
      el.innerHTML = `<div class="meta"><div class="avatar"><img src="assets/logo.svg" style="width:100%;height:100%;object-fit:cover;border-radius:10px"></div><div class="author"><strong><span class="display-name">OMGSocial</span>${renderBadges({admin:true,verified:false})}</strong><div class="handle">@omgsocial</div></div></div><div class="content">${escapeHtml(t)}</div>`;
      postsEl.appendChild(el);
      attachTilt(el);
    });
    return;
  }
  if(action === 'notifications'){
    postsEl.innerHTML = '';
    const el = document.createElement('div'); el.className='card-3d'; el.style.padding='18px'; el.innerHTML = '<strong>Notifications</strong><div class="muted">You have no new notifications.</div>';
    postsEl.appendChild(el);
    return;
  }
  if(action === 'messages'){
    postsEl.innerHTML = '';
    const el = document.createElement('div'); el.className='card-3d'; el.style.padding='18px'; el.innerHTML = '<strong>Messages</strong><div class="muted">No direct messages yet.</div>';
    postsEl.appendChild(el);
    return;
  }
}

wireMenu();

postBtn.addEventListener('click', ()=>{
  const v = composeInput.value.trim();
  if(!v) return;
  if(!currentUser){
    alert('Please register or login first.');
    openProfileModal();
    return;
  }
  const post = {id: Date.now(), text: v, author: {name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar, admin: currentUser.admin, verified: currentUser.verified}, createdAt: Date.now()};
  posts.push(post); savePosts(); renderPosts(); composeInput.value='';
});

// Edit / Delete via event delegation
postsEl.addEventListener('click', (e)=>{
  const id = e.target.dataset && e.target.dataset.id;
  if(!id) return;
  if(e.target.classList.contains('edit-btn')){
    openEditModal(id);
  } else if(e.target.classList.contains('delete-btn')){
    if(confirm('Delete this post?')){
      posts = posts.filter(p=>String(p.id)!==String(id)); savePosts(); renderPosts();
    }
  }
});

function openEditModal(id){
  const post = posts.find(p=>String(p.id)===String(id));
  if(!post) return;
  editingPostId = id;
  editTextarea.value = post.text;
  editModal.classList.remove('hidden');
}

saveEdit.addEventListener('click', ()=>{
  const newText = editTextarea.value.trim();
  if(!newText) return;
  posts = posts.map(p=>{ if(String(p.id)===String(editingPostId)){ p.text = newText; } return p; });
  savePosts(); renderPosts(); editingPostId = null; editModal.classList.add('hidden');
});
cancelEdit.addEventListener('click', ()=>{ editingPostId = null; editModal.classList.add('hidden'); });

function attachTilt(node){
  node.addEventListener('mousemove', e=>{
    const r = node.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const rx = Math.max(Math.min((-dy/r.height)*12,12),-12);
    const ry = Math.max(Math.min((dx/r.width)*12,12),-12);
    node.style.setProperty('--rx', rx+'deg');
    node.style.setProperty('--ry', ry+'deg');
    node.style.setProperty('--tz', '6px');
    node.classList.add('tilt');
    node.style.boxShadow = `0 20px 40px rgba(2,6,23,0.6)`;
  });
  node.addEventListener('mouseleave', ()=>{
    node.style.setProperty('--rx','0deg');
    node.style.setProperty('--ry','0deg');
    node.style.setProperty('--tz','0px');
    node.classList.remove('tilt');
    node.style.boxShadow='0 10px 30px rgba(2,6,23,0.6)';
  });
}

// Attach tilt to any pre-existing card-3d elements
document.querySelectorAll('.card-3d').forEach(attachTilt);
