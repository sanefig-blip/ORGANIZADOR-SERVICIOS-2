const CACHE_NAME = 'fire-dept-organizer-cache-v5';
const urlsToCache = [
  './',
  './index.html',
  './favicon.svg',
  './index.js',
  './App.js',
  './types.js',
  './metadata.json',
  './components/icons.js',
  './components/ScheduleDisplay.js',
  './components/AssignmentCard.js',
  './components/TimeGroupedScheduleDisplay.js',
  './components/Nomenclador.js',
  './components/HelpModal.js',
  './components/RosterImportModal.js',
  './components/ServiceTemplateModal.js',
  './components/ExportTemplateModal.js',
  './components/UnitReportDisplay.js',
  './components/UnitStatusView.js',
  './components/CommandPostView.js',
  './components/EraReportDisplay.js',
  './services/geminiService.js',
  './services/exportService.js',
  './services/wordImportService.js',
  './data/scheduleData.js',
  './data/rosterData.js',
  './data/commandPersonnelData.js',
  './data/servicePersonnelData.js',
  './data/unitData.js',
  './data/serviceTemplates.js',
  './data/unitReportData.js',
  './data/eraData.js',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/docx@8.5.0',
  'https://esm.sh/xlsx@0.18.5',
  'https://esm.sh/mammoth@1.8.0',
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react-dom@^19.1.1/client',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(urlsToCache).catch(err => {
          console.error('Failed to cache some resources:', err);
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            if(networkResponse.type !== 'opaque') {
                return networkResponse;
            }
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});