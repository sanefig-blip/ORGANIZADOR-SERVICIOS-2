const CACHE_NAME = 'fire-dept-organizer-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/metadata.json',
  '/components/icons.tsx',
  '/components/ScheduleDisplay.tsx',
  '/components/AssignmentCard.tsx',
  '/components/TimeGroupedScheduleDisplay.tsx',
  '/components/Nomenclador.tsx',
  '/components/HelpModal.tsx',
  '/components/RosterImportModal.tsx',
  '/components/ServiceTemplateModal.tsx',
  '/components/ExportTemplateModal.tsx',
  '/services/geminiService.ts',
  '/services/exportService.ts',
  '/services/wordImportService.ts',
  '/data/scheduleData.ts',
  '/data/rosterData.ts',
  '/data/commandPersonnelData.ts',
  '/data/servicePersonnelData.ts',
  '/data/personnelData.ts',
  '/data/unitData.ts',
  '/data/serviceTemplates.ts',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/docx@8.5.0',
  'https://esm.sh/xlsx@0.18.5',
  'https://esm.sh/mammoth@1.8.0'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return the cached response if it exists.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check for a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response to put it in the cache.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            // Return the network response.
            return networkResponse;
          }
        ).catch(error => {
          // This will be triggered if the network fails.
          console.error('Service Worker failed to fetch:', error);
          throw error;
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});