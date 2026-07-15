"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@mui/material";
import {
    Logout,
    Settings,
} from "@mui/icons-material";

import { useAuth } from "@/providers/AuthProvider";
import { confirmAction } from "@/utils/confirmAction";

export default function SidebarFooter({
    collapsed,
}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const settingsHref =
        user?.role === "ADMIN"
            ? "/admin/settings"
            : "/dashboard/profile";
    const isActive = isClient && pathname === settingsHref;

    const handleLogout = () => {
        confirmAction(
            "Are you sure you want to logout?",
            logout,
            null,
            "Logout",
            "Cancel",
            true
        );
    };

    return (
        <div className="border-t border-slate-800 p-3 space-y-2">

            {/* Settings - Admin only */}
            {user?.role === "ADMIN" && (
                <Tooltip
                    title={collapsed ? "Settings" : ""}
                    placement="right"
                    arrow
                >
                    <Link
                        href={settingsHref}
                        className={`flex items-center rounded-xl px-3 py-3 transition ${
                            isActive
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        } ${
                            collapsed
                                ? "justify-center"
                                : "gap-3"
                        }`}
                    >
                        <Settings fontSize="small" />

                        {!collapsed && (
                            <span className="text-sm font-medium">
                                Settings
                            </span>
                        )}
                    </Link>
                </Tooltip>
            )}

            {/* Logout */}

            <Tooltip
                title={collapsed ? "Logout" : ""}
                placement="right"
                arrow
            >
                <button
                    onClick={handleLogout}
                    className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-3 text-red-400 transition hover:bg-red-600 hover:text-white ${
                        collapsed
                            ? "justify-center"
                            : "gap-3"
                    }`}
                >
                    <Logout fontSize="small" />

                    {!collapsed && (
                        <span className="text-sm font-medium">
                            Logout
                        </span>
                    )}
                </button>
            </Tooltip>

        </div>
    );
}
