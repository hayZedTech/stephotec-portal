import {
    Dashboard,
    People,
    School,
    AdminPanelSettings,
    VerifiedUser,
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
        title: "Verify / Scan ID",
        href: "/verify",
        icon: VerifiedUser,
    },
    {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export default adminNavigation;