"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/providers/AuthProvider";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import SidebarLogo from "./SidebarLogo";
import SidebarUser from "./SidebarUser";
import SidebarNav from "./SidebarNav";
import SidebarFooter from "./SidebarFooter";

export default function Sidebar() {
    const { user } = useAuth();

    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("sidebar");

        if (saved !== null) {
            setCollapsed(saved === "true");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebar", collapsed);
    }, [collapsed]);

    return (
        <motion.aside
            animate={{
                width: isDesktop
                    ? (collapsed ? 120 : 280)
                    : 280,
            }}
            transition={{
                duration: 0.25,
            }}
            className={`flex h-screen flex-col border-r text-white overflow-hidden ${
                user?.role === "ADMIN"
                    ? "border-slate-800 bg-slate-950"
                    : "border-purple-950 bg-purple-900"
            }`}
        >
            <SidebarLogo
                collapsed={isDesktop ? collapsed : false}
                setCollapsed={setCollapsed}
            />

            <SidebarUser
                user={user}
                collapsed={isDesktop ? collapsed : false}
            />

            <SidebarNav
                user={user}
                collapsed={isDesktop ? collapsed : false}
            />

            <SidebarFooter
                collapsed={isDesktop ? collapsed : false}
            />
        </motion.aside>
    );
}