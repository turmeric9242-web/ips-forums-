(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation');
  }));
  const storageKey = 'ips-community-updates-v1';
  const form = document.getElementById('adminPanel');
  const toggle = document.getElementById('adminBtn');
  const msg = document.getElementById('adminMsg');
  const list = document.getElementById('postList');
  const count = document.getElementById('post-count');
  let posts = [];
  try { posts = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (!Array.isArray(posts)) posts = []; } catch { posts = []; }
  function renderPosts() {
    list.replaceChildren(); count.textContent = `${posts.length} ${posts.length === 1 ? 'UPDATE' : 'UPDATES'}`;
    if (!posts.length) {
      const empty = document.createElement('article'); empty.className = 'empty-state';
      const icon = document.createElement('span'); icon.textContent = '✳';
      const title = document.createElement('h3'); title.textContent = 'Your community space';
      const text = document.createElement('p'); text.textContent = 'School updates can appear here. Use “Create an update” to add a note on this device.';
      empty.append(icon, title, text); list.append(empty); return;
    }
    posts.forEach(post => {
      const card = document.createElement('article'); card.className = 'post-card';
      const date = document.createElement('time'); date.dateTime = post.createdAt; date.textContent = new Date(post.createdAt).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
      const title = document.createElement('h3'); title.textContent = post.title;
      const body = document.createElement('p'); body.textContent = post.body;
      card.append(date, title, body); list.append(card);
    });
  }
  toggle.addEventListener('click', () => {
    const opening = form.classList.contains('hidden'); form.classList.toggle('hidden', !opening);
    document.getElementById('adminBtnText').textContent = opening ? 'Close editor' : 'Create an update';
    if (opening) document.getElementById('postTitle').focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault(); const title = document.getElementById('postTitle').value.trim();
    const body = document.getElementById('postBody').value.trim();
    if (!title || !body) { msg.textContent = 'Please complete both fields.'; return; }
    posts.unshift({title, body, createdAt: new Date().toISOString()});
    try { localStorage.setItem(storageKey, JSON.stringify(posts)); }
    catch { posts.shift(); msg.textContent = 'This browser cannot save more local updates. Clear some site storage and try again.'; return; }
    form.reset(); msg.textContent = 'Saved on this device.'; renderPosts();
  });
  document.getElementById('year').textContent = new Date().getFullYear(); renderPosts();
})();
