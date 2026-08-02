import {
    Dashboard,
    People,
    School,
    AdminPanelSettings,
    VerifiedUser,
    WorkspacePremium,
    Settings,
} from "@mui/icons-material";

const adminNavigation = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: Dashboard,
    },
    {
        title: "Students",
        href: "/admin/students",
        icon: People,
    },
    {
        title: "Staff & Admins",
        href: "/admin/staff",
        icon: AdminPanelSettings,
    },
    {
        title: "Courses",
        href: "/admin/courses",
        icon: School,
    },
    {
        title: "Verify Student ID",
        href: "/verify",
        icon: VerifiedUser,
    },
    {
        title: "Verify Certificate",
        href: "/verify-certificate",
        icon: WorkspacePremium,
    },
    {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export default adminNavigation;