/*
 * 极简的离线缓存（Service Worker）。
 * 作用有两个：让站点满足“可安装为应用”的条件；以及第二次打开时直接从本地读取脚本和字体，几乎不用等。
 * 策略：
 *   页面本身（index.html 与清单）  先联网取，取不到再用缓存 —— 所以发布新版本后，下次打开就是新的；
 *   assets 里带哈希的文件           先看缓存 —— 内容变了文件名就变，不会拿到旧的；
 *   其余同源文件（图标等）         先用缓存，同时在后台更新。
 */
const CACHE = 'algo-notebook-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function networkFirst(req) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch {
    return (await cache.match(req)) || (await cache.match('./')) || Response.error()
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) cache.put(req, res.clone())
  return res
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  const update = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => hit)
  return hit || update
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.webmanifest')) {
    e.respondWith(networkFirst(req))
  } else if (url.pathname.includes('/assets/')) {
    e.respondWith(cacheFirst(req))
  } else {
    e.respondWith(staleWhileRevalidate(req))
  }
})
