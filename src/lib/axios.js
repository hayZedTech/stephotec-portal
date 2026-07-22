import axios from "axios";

import {
    getAccessToken,
    getRefreshToken,
    saveSession,
    clearSession,
    getUser,
} from "@/utils/storage";
import { isTokenExpired } from "@/utils/token";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
    },
});

const safeGetRefreshToken = () => {
    try {
        return getRefreshToken();
    } catch {
        return null;
    }
};

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });

    failedQueue = [];
}

export function resetRefreshState() {
    if (failedQueue.length) {
        processQueue(new Error("Session refresh reset"));
    }

    isRefreshing = false;
}

async function performTokenRefresh() {
    const refresh = safeGetRefreshToken();

    if (!refresh) {
        throw new Error("No refresh token");
    }

    const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`,
        { refresh },
        { timeout: 30000 }
    );

    if (!data?.access) {
        throw new Error("Refresh response missing access token");
    }

    saveSession({
        access: data.access,
        refresh,
        user: getUser(),
    });

    api.defaults.headers.common.Authorization = `Bearer ${data.access}`;

    return data.access;
}

export async function ensureValidAccessToken() {
    const accessToken = getAccessToken();

    if (accessToken && !isTokenExpired(accessToken)) {
        return accessToken;
    }

    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    try {
        const newToken = await performTokenRefresh();
        processQueue(null, newToken);
        return newToken;
    } catch (error) {
        processQueue(error);
        throw error;
    } finally {
        isRefreshing = false;
    }
}

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest || originalRequest.url?.includes("/auth/login/")) {
            return Promise.reject(error);
        }

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const token = await ensureValidAccessToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
        } catch (refreshError) {
            clearSession();

            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }

            return Promise.reject(refreshError);
        }
    }
);

export default api;
