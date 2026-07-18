"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getUser,
    getAccessToken,
    getRefreshToken,
    saveSession,
    clearSession,
} from "@/utils/storage";

import api from "@/lib/axios";
import { loginUser } from "@/services/auth";
import { successToast } from "@/lib/toast";

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimerRef = useRef(null);
    const router = useRouter();

    const forceLogout = (showToast = false) => {
        clearSession();
        setUser(null);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        router.push("/login");
    };

    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(forceLogout, INACTIVITY_TIMEOUT);
    };

    useEffect(() => {
        const storedUser = getUser();
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!storedUser || !refreshToken || isTokenExpired(refreshToken)) {
            clearSession();
            setLoading(false);
            router.push("/login");
            return;
        }

        if (isTokenExpired(accessToken)) {
            // Access token expired but refresh token still valid
            // Axios interceptor will handle refresh on first API call
            // Just restore user from storage so UI doesn't flash to login
            setUser(storedUser);
        } else {
            setUser(storedUser);
        }

        setLoading(false);
    }, []);

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
