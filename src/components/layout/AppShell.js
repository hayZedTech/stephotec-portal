"use client";

import { Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import Header from "./Header";
import Sidebar from "./sidebar/Sidebar";

import { useAuth } from "@/providers/AuthProvider";
import { useLayout } from "@/providers/LayoutProvider";

export default function AppShell({ children }) {
    const { user, loading } = useAuth();

    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

    const {
        mobileOpen,
        closeSidebar,
    } = useLayout();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading Stephotec...
            </div>
        );
    }

    if (!user) {
        return children;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100">

            {/* Desktop Sidebar */}

            {isDesktop && <Sidebar />}

            {/* Mobile Sidebar */}

            {!isDesktop && (
                <Drawer
                    open={mobileOpen}
                    onClose={closeSidebar}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                width: 280,
                                border: 0,
                                backgroundColor: "transparent",
                                boxShadow: "none",
                            },
                        },
                    }}
                >
                    <Sidebar />
                </Drawer>
            )}

            <div className="flex min-w-0 flex-1 flex-col">

                <Header />

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>

            </div>

        </div>
    );
}