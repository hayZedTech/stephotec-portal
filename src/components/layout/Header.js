"use client";

import { memo, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
    Avatar,
    Badge,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    Box,
} from "@mui/material";

import {
    Menu as MenuIcon,
    NotificationsNone,
    KeyboardArrowDown,
    Logout,
    Person,
    Settings,
    Close,
} from "@mui/icons-material";

import { useLayout } from "@/providers/LayoutProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useNotifications } from "@/providers/NotificationsProvider";

function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const { toggleSidebar } = useLayout();
    const { user, logout } = useAuth();

    const [anchorEl, setAnchorEl] = useState(null);
    const [zoomOpen, setZoomOpen] = useState(false);
    const { unreadCount } = useNotifications();
    const profilePic = user?.role === "STUDENT" ? user?.profilePictureUrl : undefined;

    const open = Boolean(anchorEl);

    const pageTitle = useMemo(() => {
        const routes = {
            "/admin": "Dashboard",
            "/admin/students": "Students",
            "/admin/courses": "Courses",
            "/admin/notifications": "Send Notifications",
            "/admin/settings": "Settings",
            "/admin/profile": "Admin Profile",
            "/admin/audit-logs": "Audit Logs",

            "/dashboard": "Dashboard",
            "/dashboard/profile": "My Profile",
            "/dashboard/notifications": "Notifications",
            "/dashboard/industrial-training": "Industrial Training",

            "/activate-profile": "Profile Activation",
        };

        return routes[pathname] || "Stephotec Portal";
    }, [pathname]);

    return (
        <>
            <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/30 bg-white/80 px-4 backdrop-blur-xl lg:px-8">

                {/* Left Section */}
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                    {/* Mobile Menu Toggle */}
                    <IconButton
                        onClick={toggleSidebar}
                        className="lg:!hidden"
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Header Typography Wrapper */}
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">
                            {pageTitle}
                        </h1>
                        <p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block lg:text-sm">
                            Manage your Stephotec portal efficiently.
                        </p>
                    </div>

                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">

                    {/* Notifications - Only for Students */}
                    {user?.role === "STUDENT" && (
                        <IconButton
                            onClick={() => router.push("/dashboard/notifications")}
                            sx={{
                                border: "1px solid #e5e7eb",
                                borderRadius: 3,
                            }}
                        >
                            <Badge
                                badgeContent={unreadCount}
                                color="error"
                            >
                                <NotificationsNone sx={{ color: "#64748b" }} />
                            </Badge>
                        </IconButton>
                    )}

                    {/* Profile Menu Trigger Button */}
                    <button
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition-all hover:shadow-md sm:gap-3 sm:px-3 sm:py-2"
                    >
                        <Avatar
                            src={profilePic}
                            onClick={(e) => {
                                if (profilePic && window.innerWidth >= 1024) {
                                    e.stopPropagation();
                                    setZoomOpen(true);
                                }
                            }}
                            sx={{
                                width: 34,
                                height: 34,
                                bgcolor: "#2563eb",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: { xs: "default", lg: profilePic ? "zoom-in" : "default" },
                            }}
                        >
                            {user?.firstName?.charAt(0)?.toUpperCase()}{user?.lastName?.charAt(0)?.toUpperCase()}
                        </Avatar>

                        <div className="hidden text-left md:block">
                            <p className="text-sm font-semibold text-slate-900">
                                {user?.username}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                                {user?.role?.toLowerCase()}
                            </p>
                        </div>

                        <KeyboardArrowDown
                            fontSize="small"
                            className="hidden text-slate-500 md:block"
                        />
                    </button>

                </div>

            </header>

            {/* Profile Dropdown Menu Context */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                            mt: 1.5,
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            minWidth: 160,
                        }
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        router.push(user?.role === "ADMIN" ? "/admin/profile" : "/dashboard/profile");
                    }}
                    sx={{ fontSize: '1rem', py: 1 }}
                >
                    <Person sx={{ mr: 1.5, fontSize: 20, color: '#64748b' }} />
                    View Profile
                </MenuItem>

                {user?.role === "ADMIN" && (
                    <MenuItem
                        onClick={() => {
                            setAnchorEl(null);
                            router.push("/admin/settings");
                        }}
                        sx={{ fontSize: '1rem', py: 1 }}
                    >
                        <Settings sx={{ mr: 1.5, fontSize: 20, color: '#64748b' }} />
                        Settings
                    </MenuItem>
                )}

                <Divider sx={{ my: 1 }} />

                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        logout();
                    }}
                    sx={{ fontSize: '1rem', py: 1, color: '#ef4444' }}
                >
                    <Logout sx={{ mr: 1.5, fontSize: 20, color: '#ef4444' }} />
                    Logout
                </MenuItem>
            </Menu>

            {/* Profile Picture Zoom */}
            {profilePic && (
                <Dialog
                    open={zoomOpen}
                    onClose={() => setZoomOpen(false)}
                    maxWidth={false}
                    slotProps={{
                        paper: { sx: { bgcolor: "transparent", boxShadow: "none", borderRadius: 3, overflow: "visible", m: 2 } },
                        backdrop: { sx: { bgcolor: "rgba(0,0,0,0.85)" } },
                    }}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <Box sx={{ position: "relative", lineHeight: 0 }}>
                        <IconButton
                            onClick={() => setZoomOpen(false)}
                            sx={{ position: "absolute", top: -16, right: -16, bgcolor: "rgba(0,0,0,0.6)", color: "white", zIndex: 1, "&:hover": { bgcolor: "rgba(0,0,0,0.85)" } }}
                        >
                            <Close />
                        </IconButton>
                        <img src={profilePic} alt="Profile" style={{ display: "block", maxWidth: "90vw", maxHeight: "80vh", width: "auto", height: "auto", borderRadius: 12, objectFit: "contain" }} />
                    </Box>
                </Dialog>
            )}
        </>
    );
}

export default memo(Header);
