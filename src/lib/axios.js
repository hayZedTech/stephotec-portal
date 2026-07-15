import axios from "axios";

import {
    getAccessToken,
    getRefreshToken,
    saveSession,
    clearSession,
    getUser,
} from "@/utils/storage";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

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

        // Don't try to refresh on login endpoint
        if (originalRequest.url?.includes("/auth/login/")) {
            return Promise.reject(error);
        }

        if (
            error.response?.status !== 401 ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve,
                    reject,
                });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refresh = getRefreshToken();

            if (!refresh) {
                throw new Error("No refresh token");
            }

            // ✅ FIXED: correct refresh endpoint
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`,
                {
                    refresh,
                }
            );

            saveSession({
                access: data.access,
                refresh,
                user: getUser(),
            });

            api.defaults.headers.common.Authorization = `Bearer ${data.access}`;

            processQueue(null, data.access);

            originalRequest.headers.Authorization = `Bearer ${data.access}`;

            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);

            clearSession();

            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;