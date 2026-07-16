"use client";

import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Box } from "@mui/material";

import {
    People,
    School,
    Workspaces,
    CheckCircle,
} from "@mui/icons-material";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

import StatCard from "@/components/dashboard/StatCard";
import { getDashboardData } from "@/services/dashboard";

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const data = await getDashboardData();
                setDashboard(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    if (!dashboard && !loading) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
                Failed to load dashboard data.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* LOADING OVERLAY */}
            {loading && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        backdropFilter: "blur(2px)",
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <CircularProgress size={48} />
                        <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                            Loading dashboard...
                        </Typography>
                    </Box>
                </Box>
            )}

            <Grid container spacing={3}>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Students"
                        value={dashboard?.stats.totalStudents}
                        icon={<People />}
                        color="#2563eb"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Courses"
                        value={dashboard?.stats.totalCourses}
                        icon={<School />}
                        color="#7c3aed"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Industrial Training"
                        value={dashboard?.stats.industrialTraining}
                        icon={<Workspaces />}
                        color="#ea580c"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Active Students"
                        value={`${dashboard?.stats.profileCompletion}%`}
                        icon={<CheckCircle />}
                        color="#16a34a"
                    />
                </Grid>

            </Grid>

            <Grid container spacing={3}>

                <Grid size={{ xs: 12, lg: 8 }}>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "grey.200",
                            height: 420,
                        }}
                    >

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            mb={3}
                        >
                            Students by Course
                        </Typography>

                        <ResponsiveContainer
                            width="100%"
                            height="90%"
                        >
                            <BarChart
                                data={dashboard?.chartData}
                            >
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis dataKey="name" />

                                <YAxis />

                                <Tooltip />

                                <Bar
                                    dataKey="students"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>

                    </Paper>

                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "grey.200",
                            minHeight: 420,
                        }}
                    >

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            mb={3}
                        >
                            Recently Registered Students
                        </Typography>

                        <div className="space-y-3">

                            {dashboard?.recentStudents.map((student) => (

                                <div
                                    key={student.id}
                                    className="rounded-xl border border-slate-200 p-4"
                                >

                                    <p className="font-semibold">
                                        {student.first_name} {student.last_name}
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        {student.email}
                                    </p>

                                    <p className="mt-1 text-xs text-blue-600">
                                        {student.courses?.[0]?.course?.name || "No Course"}
                                    </p>

                                </div>

                            ))}

                        </div>

                    </Paper>

                </Grid>

            </Grid>

        </div>
    );
}
