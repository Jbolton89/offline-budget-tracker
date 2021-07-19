const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/styles.css",
    "/db.js",
    "/manifest.webmanifest"
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// Install lifecycle
self.addEventListener("install", function (evt) {
    // waitUntil function to allow the custom code in to run first
    // Waiting lifecycle
    evt.waitUntil(
        // 'caches' is a global variable that serviceworker has access to
        // open cache and add files to it
        caches.open(CACHE_NAME).then(cache => {
            console.log("Files successfully loaded...");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    // self being our serviceworker instance variable. Skipping waiting cycle to install new serviceworker
    self.skipWaiting();

});



// Activation lifecycle
self.addEventListener("activate", function (evt) {
    // // Waiting lifecycle
    evt.waitUntil(
        caches.keys().then(keyList => {
            // Promise.all is mapping all cache keys to promises that is 
            // delete (way to map set of strings to set of promises and then 
            // running promises so we delete all caches )
            return Promise.all(
                keyList.map(key => {
                    // Deleting any old caches that dont match the latest
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    // Activates our serviceworker. Clients will now use serviceworker
    self.clients.claim();
});

// end of static cache
// start of synamic cache

// fetch 
self.addEventListener("fetch", function (evt) {
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        // If the response is fine, clone it and store it in the cache
                        if (response.status === 200) {
                            // if we recieve the fetch, we will clone and add it to cache
                            cache.put(evt.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        // Network request failed, try and get it from the cache
                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );

        return;
    }
    // If the request is not for the API, serve statis assets using "offline-first" approach. 
    evt.respondWith(
        caches.match(evt.request).then(function (response) {
            // either return cached file, OR actually do a fetch request as we dont have it cached already
            return response || fetch(evt.request);
        })
    );
});