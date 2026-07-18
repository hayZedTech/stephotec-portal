"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getUnreadCount } from "@/services/notifications";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (user?.role !== "STUDENT") {
            setUnreadCount(0);
            return;
        }

        const count = await getUnreadCount();
        setUnreadCount(count);
    }, [user?.role]);

    const decrementUnreadCount = useCallback(() => {
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    useEffect(() => {
        if (user?.role === "STUDENT") {
            refreshUnreadCount();
            const interval = setInterval(refreshUnreadCount, 30000);
            return () => clearInterval(interval);
        }

        setUnreadCount(0);
    }, [user?.role, refreshUnreadCount]);

    return (
        <NotificationsContext.Provider
            value={{
                unreadCount,
                refreshUnreadCount,
                decrementUnreadCount,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error("useNotifications must be used within NotificationsProvider");
    }
    return context;
}
