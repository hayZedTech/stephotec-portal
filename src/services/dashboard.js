import api from "@/lib/axios";

export const getDashboardData = async () => {
    const [studentsRes, coursesRes] = await Promise.all([
        api.get("/admin/students/"),
        api.get("/courses/"),
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

    const recentStudents = [...students].reverse().slice(0, 5);

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
};
