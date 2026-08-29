import api from "@/lib/axios";
import { fetchWithCache } from "@/utils/cache";

export const getDashboardData = async () => {
    return fetchWithCache("admin_dashboard_data", async () => {
        try {
            // Fast backend aggregation endpoint
            const res = await api.get("/admin/dashboard-stats/");
            if (res.data && res.data.stats) {
                return res.data;
            }
        } catch {
            // Fallback for older backend versions
        }

        const [studentsRes, coursesRes] = await Promise.all([
            api.get("/admin/students/?page_size=1000"),
            api.get("/courses/?page_size=1000"),
        ]);

        const students = Array.isArray(studentsRes.data)
            ? studentsRes.data
            : studentsRes.data.results || [];

        const courses = Array.isArray(coursesRes.data)
            ? coursesRes.data
            : coursesRes.data.results || [];

        const industrialTraining = students.filter(
            (student) => student.is_industrial_training
        ).length;

        const activeStudents = students.filter(
            (student) => student.status === "ACTIVE"
        ).length;

        const profileCompletion =
            students.length === 0
                ? 0
                : Math.round((activeStudents / students.length) * 100);

        const chartMap = {};

        students.forEach((student) => {
            if (student.courses && Array.isArray(student.courses) && student.courses.length > 0) {
                student.courses.forEach((studentCourse) => {
                    const courseName = studentCourse.course?.name || "Unassigned";
                    chartMap[courseName] = (chartMap[courseName] || 0) + 1;
                });
            } else {
                chartMap["Unassigned"] = (chartMap["Unassigned"] || 0) + 1;
            }
        });

        const chartData = Object.entries(chartMap).map(
            ([name, count]) => ({
                name,
                students: count,
            })
        );

        const recentStudents = [...students]
            .sort((a, b) => new Date(b.date_joined) - new Date(a.date_joined))
            .slice(0, 5);

        return {
            stats: {
                totalStudents: students.length,
                totalCourses: courses.length,
                industrialTraining,
                profileCompletion,
            },
            chartData,
            recentStudents,
        };
    }, 30000);
};

