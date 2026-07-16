"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (user.role === "ADMIN") {
                router.push("/admin");
            } else if (!user.isProfileComplete) {
                router.push("/activate-profile");
            } else {
                router.push("/dashboard");
            }
        }
    }, [user, loading, router]);

    return (
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(2px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
        >
            <Box
                sx={{
                    backgroundColor: "white",
                    borderRadius: 3,
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <CircularProgress size={48} />
                <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Loading...
                </Typography>
            </Box>
        </Box>
    );
}
