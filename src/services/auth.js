import api from "@/lib/axios";

/**
 * Login user (username/email + password)
 */
export const loginUser = async (credentials) => {
    const { data } = await api.post("/auth/login/", credentials);
    return data;
};

/**
 * Refresh JWT access token
 * (used internally by axios interceptor, but kept here for manual use if needed)
 */
export const refreshToken = async (refresh) => {
    const { data } = await api.post("/token/refresh/", {
        refresh,
    });

    return data;
};

/**
 * Optional: fetch current authenticated user
 */
export const getCurrentUser = async () => {
    const { data } = await api.get("/auth/me/");
    return data;
};