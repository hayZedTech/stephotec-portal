const ACCESS_TOKEN = "stephotec_access_token";
const REFRESH_TOKEN = "stephotec_refresh_token";
const USER = "stephotec_user";

export const saveSession = (data) => {
    if (data?.access) {
        localStorage.setItem(ACCESS_TOKEN, data.access);
    }

    if (data?.refresh) {
        localStorage.setItem(REFRESH_TOKEN, data.refresh);
    }

    if (data?.user) {
        localStorage.setItem(USER, JSON.stringify(data.user));
    }
};

export const saveTokens = ({ access, refresh }) => {
    if (access) localStorage.setItem(ACCESS_TOKEN, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN, refresh);
};

export const getAccessToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN);
};

export const getRefreshToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN);
};

export const getUser = () => {
    if (typeof window === "undefined") return null;

    const user = localStorage.getItem(USER);
    return user ? JSON.parse(user) : null;
};

export const clearSession = () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(USER);
};