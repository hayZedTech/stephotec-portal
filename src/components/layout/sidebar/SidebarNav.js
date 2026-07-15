"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "@/providers/LayoutProvider";

import {
    Dashboard,
    People,
    School,
    Person,
    Workspaces,
    Notifications,
    LibraryBooks,
    MenuBook,
    Assignment,
    Mail,
    History,
} from "@mui/icons-material";

export default function SidebarNav({ user, collapsed }) {
    const pathname = usePathname();
    const { closeSidebar } = useLayout();

    const links =
        user?.role === "ADMIN"
            ? [
                {
                    label: "Dashboard",
                    href: "/admin",
                    icon: <Dashboard fontSize="small" />,
                },
                {
                    label: "Students",
                    href: "/admin/students",
                    icon: <People fontSize="small" />,
                },
                {
                    label: "Courses",
                    href: "/admin/courses",
                    icon: <School fontSize="small" />,
                },
                {
                    label: "Notifications",
                    href: "/admin/notifications",
                    icon: <Mail fontSize="small" />,
                },
                {
                    label: "Learning Management",
                    href: "/dashboard/admin/learning",
                    icon: <LibraryBooks fontSize="small" />,
                },
                {
                    label: "Audit Logs",
                    href: "/admin/audit-logs",
                    icon: <History fontSize="small" />,
                },
                {
                    label: "Profile",
                    href: "/admin/profile",
                    icon: <Person fontSize="small" />,
                },
            ]
            : [
                {
                    label: "Dashboard",
                    href: "/dashboard",
                    icon: <Dashboard fontSize="small" />,
                },
                {
                    label: "My Courses",
                    href: "/dashboard/courses",
                    icon: <School fontSize="small" />,
                },
                {
                    label: "Learning",
                    href: "/dashboard/learning",
                    icon: <MenuBook fontSize="small" />,
                },
                {
                    label: "Assignments",
                    href: "/dashboard/assignments",
                    icon: <Assignment fontSize="small" />,
                },
                {
                    label: "Profile",
                    href: "/dashboard/profile",
                    icon: <Person fontSize="small" />,
                },
                {
                    label: "Notifications",
                    href: "/dashboard/notifications",
                    icon: <Notifications fontSize="small" />,
                },
                {
                    label: "Industrial Training",
                    href: "/dashboard/industrial-training",
                    icon: <Workspaces fontSize="small" />,
                },
            ];

    return (
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">

            {links.map((item) => {
                const active = pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSidebar}
                        className={`
                            group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all
                            
                            ${user?.role === "ADMIN"
                                ? active
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                : active
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-slate-100 hover:bg-black hover:text-white"
                            }
                        `}
                    >

                        {/* Active indicator bar */}
                        <span
                            className={`
                                absolute left-0 top-2 h-8 w-1 rounded-r-full transition-all
                                ${user?.role === "ADMIN"
                                    ? active ? "bg-white" : "bg-transparent group-hover:bg-slate-500"
                                    : active ? "bg-blue-400" : "bg-transparent group-hover:bg-purple-400"
                                }
                            `}
                        />

                        {/* Icon */}
                        <span
                            className="
                                transition-transform duration-200
                                group-hover:scale-110
                            "
                        >
                            {item.icon}
                        </span>

                        {/* Label */}
                        {!collapsed && (
                            <span className="transition-opacity duration-200">
                                {item.label}
                            </span>
                        )}

                    </Link>
                );
            })}

        </nav>
    );
}
