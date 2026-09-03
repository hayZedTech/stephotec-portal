import api from "@/lib/axios";

const CACHE_KEYS = {
    STUDENTS: "cached_admin_students_v1",
    GROUPS: "cached_admin_groups_v1",
};

// In-memory cache for sub-millisecond access within the same session
const memoryCache = {
    students: null,
    studentsTimestamp: 0,
    groups: null,
    groupsTimestamp: 0,
};

// In-flight promises to deduplicate simultaneous requests
const inFlight = {
    students: null,
    groups: null,
};

// 10 minutes cache TTL
const DEFAULT_TTL_MS = 10 * 60 * 1000;

/**
 * Read data from sessionStorage if still valid
 */
function readStorage(key, ttlMs) {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < ttlMs) {
            return parsed.data;
        }
        sessionStorage.removeItem(key);
    } catch {
        // Storage disabled or quota error
    }
    return null;
}

/**
 * Safely persist data to sessionStorage
 */
function writeStorage(key, data) {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(
            key,
            JSON.stringify({
                data,
                timestamp: Date.now(),
            })
        );
    } catch {
        // Gracefully ignore storage quota limits
    }
}

/**
 * Fetch students using multi-tier cache (In-memory -> SessionStorage -> Network)
 * Prevents redundant fetches of 1000+ student records.
 */
export async function getCachedStudents({ forceRefresh = false, ttlMs = DEFAULT_TTL_MS } = {}) {
    const now = Date.now();

    // 1. In-memory cache (0ms)
    if (!forceRefresh && memoryCache.students && (now - memoryCache.studentsTimestamp < ttlMs)) {
        return memoryCache.students;
    }

    // 2. SessionStorage cache (<5ms, persists across route transitions & reloads)
    if (!forceRefresh) {
        const stored = readStorage(CACHE_KEYS.STUDENTS, ttlMs);
        if (stored && Array.isArray(stored)) {
            memoryCache.students = stored;
            memoryCache.studentsTimestamp = now;
            return stored;
        }
    }

    // 3. In-flight deduplication (reuse active promise if fetch already started)
    if (inFlight.students) {
        return inFlight.students;
    }

    inFlight.students = (async () => {
        try {
            const res = await api.get("/admin/students/?page_size=1000");
            const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);

            memoryCache.students = list;
            memoryCache.studentsTimestamp = Date.now();
            writeStorage(CACHE_KEYS.STUDENTS, list);
            return list;
        } catch (error) {
            if (memoryCache.students) return memoryCache.students;
            throw error;
        } finally {
            inFlight.students = null;
        }
    })();

    return inFlight.students;
}

/**
 * Fetch study groups using multi-tier cache (In-memory -> SessionStorage -> Network)
 */
export async function getCachedGroups({ forceRefresh = false, ttlMs = DEFAULT_TTL_MS } = {}) {
    const now = Date.now();

    // 1. In-memory cache (0ms)
    if (!forceRefresh && memoryCache.groups && (now - memoryCache.groupsTimestamp < ttlMs)) {
        return memoryCache.groups;
    }

    // 2. SessionStorage cache (<5ms)
    if (!forceRefresh) {
        const stored = readStorage(CACHE_KEYS.GROUPS, ttlMs);
        if (stored && Array.isArray(stored)) {
            memoryCache.groups = stored;
            memoryCache.groupsTimestamp = now;
            return stored;
        }
    }

    // 3. In-flight deduplication
    if (inFlight.groups) {
        return inFlight.groups;
    }

    inFlight.groups = (async () => {
        try {
            const res = await api.get("/admin/groups/");
            const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);

            memoryCache.groups = list;
            memoryCache.groupsTimestamp = Date.now();
            writeStorage(CACHE_KEYS.GROUPS, list);
            return list;
        } catch (error) {
            if (memoryCache.groups) return memoryCache.groups;
            throw error;
        } finally {
            inFlight.groups = null;
        }
    })();

    return inFlight.groups;
}

/**
 * Invalidate cached students or groups
 * @param {"all" | "students" | "groups"} type
 */
export function invalidateAdminTargetCache(type = "all") {
    if (type === "all" || type === "students") {
        memoryCache.students = null;
        memoryCache.studentsTimestamp = 0;
        if (typeof window !== "undefined") {
            try {
                sessionStorage.removeItem(CACHE_KEYS.STUDENTS);
            } catch {}
        }
    }
    if (type === "all" || type === "groups") {
        memoryCache.groups = null;
        memoryCache.groupsTimestamp = 0;
        if (typeof window !== "undefined") {
            try {
                sessionStorage.removeItem(CACHE_KEYS.GROUPS);
            } catch {}
        }
    }
}

/**
 * Pre-warm the cache in the background non-blocking
 */
export function prefetchAdminTargets() {
    getCachedStudents().catch(() => {});
    getCachedGroups().catch(() => {});
}
