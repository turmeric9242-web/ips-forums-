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
  const photoLabel = document.createElement('label');
  photoLabel.className = 'photo-picker';
  photoLabel.textContent = 'Add a photo (optional)';
  const photo = document.createElement('input');
  photo.type = 'file'; photo.accept = 'image/jpeg,image/png,image/webp'; photo.id = 'postPhoto';
  photoLabel.append(photo);
  const photoHint = document.createElement('small');
  photoHint.className = 'photo-hint'; photoHint.textContent = 'Photos are resized and compressed to WebP before upload (max 1.5 MB).';
  photoLabel.append(photoHint);
  const preview = document.createElement('img');
  preview.className = 'photo-preview'; preview.alt = 'Selected photo preview'; preview.hidden = true;
  photoLabel.append(preview);
  form.insertBefore(photoLabel, form.querySelector('.form-actions'));
  let compressedImage = '';
  photo.addEventListener('change', async () => {
    compressedImage = ''; preview.hidden = true; preview.removeAttribute('src');
    const file = photo.files && photo.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { msg.textContent = 'Choose a JPG, PNG or WebP image.'; photo.value = ''; return; }
    if (file.size > 12 * 1024 * 1024) { msg.textContent = 'Choose an image smaller than 12 MB.'; photo.value = ''; return; }
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let quality = 0.82, blob;
      do {
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
        quality -= 0.08;
      } while (blob && blob.size > 1500000 && quality >= 0.5);
      if (!blob || blob.size > 1500000) throw new Error('This photo could not be compressed below 1.5 MB. Choose another.');
      compressedImage = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      preview.src = compressedImage; preview.hidden = false;
      msg.textContent = 'Photo ready · compressed WebP';
    } catch (error) { msg.textContent = error.message || 'Could not process this photo.'; photo.value = ''; }
  });
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
      if (post.imageUrl) { const image = document.createElement('img'); image.className = 'post-image'; image.src = post.imageUrl; image.alt = 'Photo shared with this community post'; image.loading = 'lazy'; card.append(image); }
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
    const payload = {author:author.value.trim(),title:$('postTitle').value.trim(),body:$('postBody').value.trim(),website:trap.value,image:compressedImage};
    if (!payload.author || !payload.title || !payload.body) { msg.textContent = 'Please complete your name, title and message.'; return; }
    const password = prompt('Admin password required to publish:');
    if (!password) { msg.textContent = 'Publishing cancelled. Admin access is required.'; return; }
    submit.disabled = true; msg.textContent = 'Verifying admin access…';
    try {
      const response = await fetch('/api/posts', {method:'POST',headers:{'Content-Type':'application/json','x-forum-admin-password':password},body:JSON.stringify(payload)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not publish');
      form.reset(); compressedImage = ''; preview.hidden = true; preview.removeAttribute('src'); msg.textContent = 'Published. Everyone can now see your post.';
      await load();
    } catch (e) { msg.textContent = e.message; }
    finally { submit.disabled = false; }
  });
  $('year') && ($('year').textContent = new Date().getFullYear());
  load();
  setInterval(load, 30000);
})();
document.querySelectorAll('p').forEach(p => {
  if (p.textContent.includes('locally saved community notes')) p.textContent = 'An independent Howrah community guide to publicly listed campus references, official school links and shared community discussions.';
  if (p.textContent.includes('Posts are saved only in this browser')) p.textContent = 'Posts are stored on Vercel and shared with everyone who visits this site.';
});
document.querySelectorAll('.storage-note').forEach(p => p.textContent = 'SHARED SERVER STORAGE · Vercel Blob · Posts are visible to all visitors');
