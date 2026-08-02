import {
    Dashboard,
    Person,
    Workspaces,
    Quiz,
} from "@mui/icons-material";

const studentNavigation = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Dashboard,
    },
    {
        title: "Quizzes & Tests",
        href: "/dashboard/quizzes",
        icon: Quiz,
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: Person,
    },
    {
        title: "Industrial Training",
        href: "/dashboard/industrial-training",
        icon: Workspaces,
    },
];

export default studentNavigation;