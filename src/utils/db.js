const DB_NAME = "PokedexCache";
const STORE_NAME = "pokemonDetails";

let db = null;

export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME))
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = () => reject(request.error);
    });
}

const generateKey = (type, id) => `${type}-${id}`;

export async function getCachedDetails(type, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const key = generateKey(type, id);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result?.data);
        request.onerror = () => reject(null);
    });
}

export async function storeCacheDetails(type, id, details = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const key = generateKey(type, id);
        const request = store.put({ id: key, data: details });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
