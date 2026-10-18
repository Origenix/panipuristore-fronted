import axios from './axios';

// Public catalog responses are read-only for customers, so a short in-memory cache
// avoids duplicate requests when navigating between catalog screens.
const CACHE_TTL_MS = 60_000;
const responseCache = new Map();
const inFlightRequests = new Map();

const buildCacheKey = (path, params) => {
    const sortedParams = Object.entries(params || {})
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b));
    return `${path}?${JSON.stringify(sortedParams)}`;
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
    const cached = responseCache.get(key);

    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    if (!forceRefresh && inFlightRequests.has(key)) {
        return inFlightRequests.get(key);
    }

    if (forceRefresh) responseCache.delete(key);

    const request = axios.get(path, { params })
        .then(({ data }) => {
            const list = normalizeList(data);
            responseCache.set(key, { data: list, expiresAt: Date.now() + ttl });
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
