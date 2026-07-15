"use client";

import { Toaster } from "react-hot-toast";
import MuiThemeProvider from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { LayoutProvider } from "@/providers/LayoutProvider";

export default function AppProviders({ children }) {
    return (
        <div suppressHydrationWarning>
            <MuiThemeProvider>
                <LayoutProvider>
                    <AuthProvider>
                        {children}

                        <Toaster
                            position="top-right"
                            gutter={12}
                            reverseOrder={false}
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    borderRadius: "12px",
                                    background: "#fff",
                                    color: "#0f172a",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    boxShadow:
                                        "0 10px 30px rgba(0,0,0,.12)",
                                },
                                success: {
                                    duration: 3500,
                                },
                                error: {
                                    duration: 5000,
                                },
                            }}
                        />
                    </AuthProvider>
                </LayoutProvider>
            </MuiThemeProvider>
        </div>
    );
}
