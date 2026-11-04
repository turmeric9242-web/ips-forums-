import { list, put, del } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export default async function handler(req, res) {
  const method = req.method || 'GET';
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Vercel Blob is not connected yet. Connect a Blob store to this project.' });
    if (method === 'GET') {
      let cursor;
      const records = [];
      const imageBlobs = [];
      let imageCursor;
      do {
        const imagePage = await list({ prefix: 'forum/images/', cursor: imageCursor, limit: 1000, token: process.env.BLOB_READ_WRITE_TOKEN });
        imageBlobs.push(...imagePage.blobs);
        imageCursor = imagePage.hasMore ? imagePage.cursor : undefined;
      } while (imageCursor);
      do {
        const page = await list({ prefix: 'forum/posts/', cursor, limit: 1000, token: process.env.BLOB_READ_WRITE_TOKEN });
        for (const blob of page.blobs) {
          try {
            const response = await fetch(blob.url, { cache: 'no-store' });
            if (response.ok) {
              const post = await response.json();
              if (post.id) {
                const matchingImage = imageBlobs.find(image =>
                  image.pathname?.includes(post.id) || image.url?.includes(post.id)
                );
                // Prefer the live URL returned by Blob. Keep the URL already saved
                // in the post as a fallback for older uploads with different names.
                if (matchingImage) post.imageUrl = matchingImage.url;
              }
              records.push(post);
            }
          } catch {}
        }
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ posts: records.slice(0, 200) });
    }
    if (method === 'POST') {
      const expected = process.env.FORUM_ADMIN_PASSWORD;
      const supplied = req.headers['x-forum-admin-password'];
      if (!expected || typeof supplied !== 'string' || supplied !== expected) return res.status(401).json({ error: 'Admin password is incorrect. Only admins can publish posts.' });
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      if (clean(body.website, 200)) return res.status(201).json({ ok: true }); // honeypot
      const author = clean(body.author, 40);
      const title = clean(body.title, 100);
      const message = clean(body.body, 2000);
      if (!author || !title || !message) return res.status(400).json({ error: 'Name, title and message are required.' });
      if (author.length < 2 || title.length < 4 || message.length < 8) return res.status(400).json({ error: 'Please add a little more detail.' });
      const postId = randomUUID();
      let imageUrl = '';
      if (body.image) {
        const match = typeof body.image === 'string' && body.image.match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/);
        if (!match) return res.status(400).json({ error: 'Image must be compressed to WebP before upload.' });
        const imageBuffer = Buffer.from(match[1], 'base64');
        if (imageBuffer.length > 1500000 || imageBuffer.length < 16 || imageBuffer.subarray(0, 4).toString() !== 'RIFF' || imageBuffer.subarray(8, 12).toString() !== 'WEBP') {
          return res.status(400).json({ error: 'WebP image is invalid or larger than 1.5 MB.' });
        }
        const imageBlob = await put('forum/images/' + postId + '.webp', imageBuffer, {
          access: 'public', addRandomSuffix: false, contentType: 'image/webp',
          token: process.env.BLOB_READ_WRITE_TOKEN
        });
        imageUrl = imageBlob.url;
      }
      const post = { id: postId, author, title, body: message, imageUrl, createdAt: new Date().toISOString() };
      await put('forum/posts/' + post.id + '.json', JSON.stringify(post), {
        access: 'public', addRandomSuffix: false, contentType: 'application/json',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return res.status(201).json({ post });
    }
    if (method === 'DELETE') {
      const expected = process.env.FORUM_ADMIN_PASSWORD;
      const supplied = req.headers['x-forum-admin-password'];
      if (!expected || typeof supplied !== 'string' || supplied !== expected) return res.status(401).json({ error: 'Admin password is incorrect.' });
      const id = clean(req.body?.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Invalid post ID.' });
      const page = await list({ prefix: 'forum/posts/' + id + '.json', limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
      if (!page.blobs.length) return res.status(404).json({ error: 'Post not found.' });
      await del(page.blobs[0].url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      const imagePage = await list({ prefix: 'forum/images/' + id + '.webp', limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
      if (imagePage.blobs.length) await del(imagePage.blobs[0].url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Forum API error:', error);
    return res.status(500).json({ error: 'Could not complete the forum request. Please try again.' });
  }
}