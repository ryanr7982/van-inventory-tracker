self.addEventListener('install', event => {
  console.log('🛠️ Service worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  console.log('✅ Service worker activated')
})
const CACHE_NAME = 'van-inventory-cache-v1'
const OFFLINE_URL = '/offline.html'

const ASSETS_TO_CACHE = [
  '/',
  '/van',
  '/icon.png',
  '/manifest.json',
  OFFLINE_URL
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request)
      })
    )
  }
})
