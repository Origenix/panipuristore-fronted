import axios from './axios';

// Public catalog responses are read-only for customers, so a short in-memory cache
// avoids duplicate requests when navigating between catalog screens.
const CACHE_TTL_MS = 60_000;
const responseCache = new Map();
const inFlightRequests = new Map();
const STORAGE_PREFIX = 'panipuri:public-catalog:';

const buildCacheKey = (path, params) => {
    const sortedParams = Object.entries(params || {})
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b));
    return `${path}?${JSON.stringify(sortedParams)}`;
};

const readCache = (key) => {
    const memoryEntry = responseCache.get(key);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) return memoryEntry;
    if (typeof window !== 'undefined') {
        try {
            const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
            if (raw) {
                const storedEntry = JSON.parse(raw);
                if (storedEntry.expiresAt > Date.now() && Array.isArray(storedEntry.data)) {
                    responseCache.set(key, storedEntry);
                    return storedEntry;
                }
                window.sessionStorage.removeItem(STORAGE_PREFIX + key);
            }
        } catch {
            // Storage can be unavailable in private browsing or restricted contexts.
        }
    }
    return null;
};

const writeCache = (key, entry) => {
    responseCache.set(key, entry);
    if (typeof window !== 'undefined') {
        try {
            window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
        } catch {
            // In-memory caching still works when session storage is unavailable.
        }
    }
};

const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.content)) return payload.content;
    if (payload && Array.isArray(payload.items)) return payload.items;
    if (payload && Array.isArray(payload.results)) return payload.results;
    if (payload && Array.isArray(payload.data)) return payload.data;
    throw new Error('The catalog service returned an unexpected response.');
};

export const getPublicList = async (path, params = {}, options = {}) => {
    const { forceRefresh = false, ttl = CACHE_TTL_MS } = options;
    const key = buildCacheKey(path, params);
    const cached = readCache(key);

    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    if (!forceRefresh && inFlightRequests.has(key)) {
        return inFlightRequests.get(key);
    }

    if (forceRefresh) {
        responseCache.delete(key);
        if (typeof window !== 'undefined') {
            try { window.sessionStorage.removeItem(STORAGE_PREFIX + key); } catch { /* Ignore unavailable storage. */ }
        }
    }

    const request = axios.get(path, { params })
        .then(({ data }) => {
            const list = normalizeList(data);
            writeCache(key, { data: list, expiresAt: Date.now() + ttl });
            return list;
        })
        .finally(() => {
            if (inFlightRequests.get(key) === request) {
                inFlightRequests.delete(key);
            }
        });

    inFlightRequests.set(key, request);
    return request;
};
