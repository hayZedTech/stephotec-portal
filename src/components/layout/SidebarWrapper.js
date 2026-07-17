"use client";

import { memo } from "react";
import { Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useLayout } from "@/providers/LayoutProvider";
import Sidebar from "./sidebar/Sidebar";

const MemoizedSidebar = memo(Sidebar);

function SidebarWrapper() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
    const { mobileOpen, closeSidebar } = useLayout();

    if (isDesktop) {
        return <MemoizedSidebar />;
    }

    return (
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
            <MemoizedSidebar />
        </Drawer>
    );
}

export default SidebarWrapper;
