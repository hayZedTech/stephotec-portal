"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import CircularProgress from "@mui/material/CircularProgress";

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
        <div className="flex min-h-screen items-center justify-center">
            <CircularProgress />
        </div>
    );
}
