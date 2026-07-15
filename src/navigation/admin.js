import {
    Dashboard,
    People,
    School,
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
        title: "Courses",
        href: "/admin/courses",
        icon: School,
    },
    {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export default adminNavigation;