"use client";

import { IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import {
    ChevronLeft,
    ChevronRight,
    Close,
} from "@mui/icons-material";

import { useLayout } from "@/providers/LayoutProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function SidebarLogo({
    collapsed,
    setCollapsed,
}) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
    const { user } = useAuth();

    // mobile drawer control
    const { closeSidebar } = useLayout();

    return (
        <div className={`border-b p-5 ${
            user?.role === "ADMIN"
                ? "border-slate-800"
                : "border-purple-950"
        }`}>
            <div className="flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                        <img
                            src="/logos/slogo.png"
                            alt="Stephotec"
                            className="h-8 w-8 object-contain"
                        />
                    </div>

                    {/* Hide text when collapsed on desktop only */}
                    {(!collapsed || !isDesktop) && (
                        <div>
                            <h2 className="text-lg font-bold">
                                Stephotec
                            </h2>
                            {user?.role !== "ADMIN" && (
                                <p className="text-xs text-slate-400">
                                    Student Portal
                                </p>
                            )}
                        </div>
                    )}

                </div>

                {/* Right action button */}

                {isDesktop ? (
                    <IconButton
                        onClick={() =>
                            setCollapsed(!collapsed)
                        }
                        sx={{ color: "white" }}
                    >
                        {collapsed ? (
                            <ChevronRight />
                        ) : (
                            <ChevronLeft />
                        )}
                    </IconButton>
                ) : (
                    <IconButton
                        onClick={closeSidebar}
                        sx={{ color: "white" }}
                    >
                        <Close />
                    </IconButton>
                )}

            </div>
        </div>
    );
}