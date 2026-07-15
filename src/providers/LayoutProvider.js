"use client";

import { createContext, useContext, useState } from "react";

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleSidebar = () =>
        setMobileOpen((prev) => !prev);

    const closeSidebar = () =>
        setMobileOpen(false);

    return (
        <LayoutContext.Provider
            value={{
                mobileOpen,
                toggleSidebar,
                closeSidebar,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    return useContext(LayoutContext);
}