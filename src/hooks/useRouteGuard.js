"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser } from "@/utils/storage";

export default function useRouteGuard() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const user = getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        const isAdminRoute = pathname.startsWith("/admin");
        const isStudentRoute = pathname.startsWith("/dashboard");

        if (isAdminRoute && user.role !== "ADMIN") {
            router.push("/dashboard");
        }

        if (isStudentRoute && user.role === "ADMIN") {
            router.push("/admin");
        }

        if (!user.isProfileComplete && pathname !== "/activate-profile") {
            router.push("/activate-profile");
        }

    }, [pathname]);
}