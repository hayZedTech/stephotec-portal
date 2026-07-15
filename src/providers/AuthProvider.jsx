"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getUser,
    saveSession,
    clearSession,
} from "@/utils/storage";

import { loginUser } from "@/services/auth";
import { successToast } from "@/lib/toast";

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inactivityTimer, setInactivityTimer] = useState(null);

    const router = useRouter();

    const handleInactivity = () => {
        clearSession();
        setUser(null);
        router.push("/login");
    };

    const resetInactivityTimer = () => {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }

        if (user) {
            const timer = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
            setInactivityTimer(timer);
        }
    };

    useEffect(() => {
        const storedUser = getUser();

        if (storedUser) {
            setUser(storedUser);
            refreshUser();
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        if (!user) return;

        resetInactivityTimer();

        const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];

        const handleActivity = () => {
            resetInactivityTimer();
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }
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
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        successToast("Signed out successfully.");
        router.push("/login");
    };

    const refreshUser = async () => {
        try {
            const storedUser = getUser();
            if (!storedUser) return;
            
            const { getAccessToken } = await import("@/utils/storage");
            const token = getAccessToken();
            if (!token) return;
            
            if (storedUser.role !== "STUDENT") return;
            
            const { default: api } = await import("@/lib/axios");
            const response = await api.get("/student/profile/");
            
            const userData = {
                id: response.data.id,
                username: response.data.username,
                email: response.data.email,
                role: response.data.role,
                status: response.data.status,
                isProfileComplete: response.data.is_profile_complete,
                isIndustrialTraining: response.data.is_industrial_training,
                firstName: response.data.first_name,
                lastName: response.data.last_name,
                phone: response.data.phone,
                additionalPhone: response.data.additional_phone,
                dateOfBirth: response.data.date_of_birth,
                gender: response.data.gender,
                address: response.data.address,
                stateOfOrigin: response.data.state_of_origin,
                bio: response.data.bio,
                profilePictureUrl: response.data.profile_picture_url,
                courses: response.data.courses || [],
            };
            
            const { getRefreshToken } = await import("@/utils/storage");
            saveSession({
                access: token,
                refresh: getRefreshToken(),
                user: userData,
            });
            
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