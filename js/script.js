(() => {
  const link=document.createElement('link');link.rel='stylesheet';link.href='/css/forum.css';document.head.append(link);
  document.querySelectorAll('#community .community-head p').forEach(p=>p.textContent='A shared community space. Posts published here are stored on Vercel and visible to everyone who visits this site.');
  document.querySelectorAll('#directory-guide p').forEach(p=>{if(p.textContent.includes('Community notes are created locally'))p.textContent='Community posts are stored in shared Vercel storage and are visible to all visitors. Do not post private student information, sensitive personal details, or urgent notices.';});
})();
(() => {
  const $ = (id) => document.getElementById(id);
  const menu = $('primary-nav'), menuButton = document.querySelector('.menu-toggle');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false');
    }));
  }
  const form = $('adminPanel'), list = $('postList'), count = $('post-count'), msg = $('adminMsg');
  const toggle = $('adminBtn'), submit = $('publishBtn');
  if (!form || !list) return;
  const authorLabel = document.createElement('label');
  authorLabel.textContent = 'Your display name';
  const author = document.createElement('input');
  author.id = 'postAuthor'; author.maxLength = 40; author.required = true;
  author.placeholder = 'Name shown with your post'; author.autocomplete = 'nickname';
  authorLabel.append(author); form.insertBefore(authorLabel, form.firstChild);
  const trap = document.createElement('input');
  trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off';
  trap.setAttribute('aria-hidden', 'true'); trap.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px';
  form.append(trap);
  const info = document.createElement('p'); info.className = 'storage-note';
  info.textContent = 'SHARED COMMUNITY POSTS · Stored on Vercel Blob · Visible to all visitors';
  const community = document.querySelector('#community');
  const toolbar = document.querySelector('.forum-toolbar');
  if (toolbar && community) toolbar.after(info);
  let posts = [];
  function dateLabel(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'Recently' : d.toLocaleString(undefined, {dateStyle:'medium',timeStyle:'short'});
  }
  function render() {
    list.replaceChildren();
    count.textContent = posts.length + (posts.length === 1 ? ' COMMUNITY POST' : ' COMMUNITY POSTS');
    if (!posts.length) {
      const empty = document.createElement('article'); empty.className = 'empty-state';
      const icon = document.createElement('span'); icon.textContent = '✳';
      const h = document.createElement('h3'); h.textContent = 'Be the first to post';
      const p = document.createElement('p'); p.textContent = 'Start a conversation with the school community.';
      empty.append(icon,h,p); list.append(empty); return;
    }
    for (const post of posts) {
      const card = document.createElement('article'); card.className = 'post-card';
      const meta = document.createElement('div'); meta.className = 'post-meta';
      const by = document.createElement('strong'); by.textContent = post.author || 'Community member';
      const date = document.createElement('time'); date.dateTime = post.createdAt; date.textContent = dateLabel(post.createdAt);
      meta.append(by,date);
      const title = document.createElement('h3'); title.textContent = post.title;
      const body = document.createElement('p'); body.textContent = post.body;
      card.append(meta,title,body);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'post-delete'; remove.textContent = 'Delete (admin)';
      remove.addEventListener('click', async () => {
        const password = prompt('Enter the forum admin password to delete this post:');
        if (!password) return;
        remove.disabled = true;
        try {
          const response = await fetch('/api/posts', {method:'DELETE',headers:{'Content-Type':'application/json','x-forum-admin-password':password},body:JSON.stringify({id:post.id})});
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Delete failed');
          await load(); msg.textContent = 'Post deleted.';
        } catch (e) { msg.textContent = e.message; remove.disabled = false; }
      });
      card.append(remove); list.append(card);
    }
  }
  async function load() {
    try {
      const response = await fetch('/api/posts', {cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load posts');
      posts = Array.isArray(data.posts) ? data.posts : []; render();
    } catch (e) {
      list.replaceChildren(); const p = document.createElement('p'); p.className = 'empty-state';
      p.textContent = e.message.includes('Blob') ? 'The forum storage is not connected yet. The site owner must connect a Vercel Blob store.' : 'Could not load the shared forum. Please refresh and try again.';
      list.append(p);
    }
  }
  toggle?.addEventListener('click', () => {
    const opening = form.classList.contains('hidden'); form.classList.toggle('hidden', !opening);
    $('adminBtnText').textContent = opening ? 'Close editor' : 'Create an update';
    if (opening) author.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {author:author.value.trim(),title:$('postTitle').value.trim(),body:$('postBody').value.trim(),website:trap.value};
    if (!payload.author || !payload.title || !payload.body) { msg.textContent = 'Please complete your name, title and message.'; return; }
    submit.disabled = true; msg.textContent = 'Publishing to the shared forum…';
    try {
      const response = await fetch('/api/posts', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not publish');
      form.reset(); msg.textContent = 'Published. Everyone can now see your post.';
      await load();
    } catch (e) { msg.textContent = e.message; }
    finally { submit.disabled = false; }
  });
  $('year') && ($('year').textContent = new Date().getFullYear());
  load();
  setInterval(load, 30000);
})();