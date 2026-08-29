"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import {
    getUser,
    getAccessToken,
    getRefreshToken,
    saveSession,
    clearSession,
} from "@/utils/storage";

import api, { ensureValidAccessToken, resetRefreshState } from "@/lib/axios";
import { loginUser } from "@/services/auth";
import { successToast } from "@/lib/toast";
import { isTokenExpired } from "@/utils/token";

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

const PUBLIC_ROUTES = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/verify",
    "/verify-certificate",
    "/verify-staff",
];

const isPublicRoute = (path) => {
    if (!path) return false;
    return PUBLIC_ROUTES.some((route) => path === route || path.startsWith(`${route}/`) || path.startsWith(`${route}?`));
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimerRef = useRef(null);
    const router = useRouter();
    const pathname = usePathname();

    const forceLogout = (showToast = false) => {
        clearSession();
        setUser(null);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (!isPublicRoute(pathname)) {
            router.push("/login");
        }
    };

    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(forceLogout, INACTIVITY_TIMEOUT);
    };

    useEffect(() => {
        async function initAuth() {
            const storedUser = getUser();
            const accessToken = getAccessToken();
            const refreshToken = getRefreshToken();

            if (!storedUser || !refreshToken || isTokenExpired(refreshToken)) {
                clearSession();
                setLoading(false);
                if (!isPublicRoute(pathname)) {
                    router.push("/login");
                }
                return;
            }

            try {
                if (isTokenExpired(accessToken)) {
                    await ensureValidAccessToken();
                }

                setUser(storedUser);
            } catch {
                clearSession();
                if (!isPublicRoute(pathname)) {
                    router.push("/login");
                }
            } finally {
                setLoading(false);
            }
        }

        initAuth();
    }, []);

    useEffect(() => {
        const handleAppResume = async () => {
            if (document.visibilityState !== "visible") return;

            resetRefreshState();

            const storedUser = getUser();
            const refreshToken = getRefreshToken();

            if (!storedUser || !refreshToken || isTokenExpired(refreshToken)) {
                if (!isPublicRoute(pathname)) {
                    forceLogout();
                }
                return;
            }

            try {
                await ensureValidAccessToken();
            } catch {
                if (!isPublicRoute(pathname)) {
                    forceLogout();
                }
            }
        };

        document.addEventListener("visibilitychange", handleAppResume);
        window.addEventListener("pageshow", handleAppResume);

        return () => {
            document.removeEventListener("visibilitychange", handleAppResume);
            window.removeEventListener("pageshow", handleAppResume);
        };
    }, [pathname]);

    useEffect(() => {
        if (!user) return;

        resetInactivityTimer();

        const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
        events.forEach((e) => window.addEventListener(e, resetInactivityTimer));

        return () => {
            events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [user]);

    const login = async (credentials) => {
        const data = await loginUser(credentials);

        const userData = {
            id: data.user_id,
            username: data.username,
            email: data.email,
            role: data.role,
            status: data.status,
            isProfileComplete: data.is_profile_complete,
            isIndustrialTraining: data.is_industrial_training,
            admissionYear: data.admission_year,
            firstName: data.first_name,
            lastName: data.last_name,
            phone: data.phone,
            additionalPhone: data.additional_phone,
            dateOfBirth: data.date_of_birth,
            gender: data.gender,
            address: data.address,
            stateOfOrigin: data.state_of_origin,
            bio: data.bio,
            profilePictureUrl: data.profile_picture_url,
            courses: data.courses || [],
        };

        saveSession({
            access: data.access,
            refresh: data.refresh,
            user: userData,
        });

        setUser(userData);

        successToast(`Welcome back, ${userData.username}!`);

        if (data.role === "ADMIN") {
            router.push("/admin");
        } else if (!data.is_profile_complete) {
            router.push("/activate-profile");
        } else {
            router.push("/dashboard");
        }
    };

    const logout = () => {
        clearSession();
        setUser(null);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        successToast("Signed out successfully.");
        router.push("/login");
    };

    const refreshUser = async () => {
        try {
            const storedUser = getUser();
            const token = getAccessToken();
            if (!storedUser || !token || storedUser.role !== "STUDENT") return;

            const response = await api.get("/student/profile/");
            const d = response.data;

            const userData = {
                id: d.id,
                username: d.username,
                email: d.email,
                role: d.role,
                status: d.status,
                isProfileComplete: d.is_profile_complete,
                isIndustrialTraining: d.is_industrial_training,
                admissionYear: d.admission_year,
                firstName: d.first_name,
                lastName: d.last_name,
                phone: d.phone,
                additionalPhone: d.additional_phone,
                dateOfBirth: d.date_of_birth,
                gender: d.gender,
                address: d.address,
                stateOfOrigin: d.state_of_origin,
                bio: d.bio,
                profilePictureUrl: d.profile_picture_url,
                courses: d.courses || [],
            };

            saveSession({ access: token, refresh: getRefreshToken(), user: userData });
            setUser(userData);
        } catch (error) {
            console.error("Failed to refresh user data", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                login,
                logout,
                loading,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
