import {
    Dashboard,
    People,
    School,
    AdminPanelSettings,
    VerifiedUser,
    WorkspacePremium,
    Settings,
    Assignment,
    LibraryBooks,
} from "@mui/icons-material";

const adminNavigation = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: Dashboard,
    },
    {
        title: "Staff & Admins",
        href: "/admin/staff",
        icon: AdminPanelSettings,
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
        title: "Learning Management",
        href: "/dashboard/admin/learning",
        icon: LibraryBooks,
    },
    {
        title: "Assignments & Quizzes",
        href: "/admin/assessments",
        icon: Assignment,
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