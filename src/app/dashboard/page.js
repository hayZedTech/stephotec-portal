"use client";

import { useAuth } from "@/providers/AuthProvider";
import {
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Box,
    Chip,
    Stack,
    Divider,
    Button,
} from "@mui/material";
import ImageZoom from "@/components/ui/ImageZoom";
import CourseDurationProgress from "@/components/courses/CourseDurationProgress";
import api from "@/lib/axios";
import {
    School,
    Person,
    Mail,
    Phone,
    Badge,
    CheckCircle,
    Info,
    CardGiftcard,
    MenuBook,
    Schedule,
    VideoCameraFront,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [certCount, setCertCount] = useState(0);
    const [handoutCount, setHandoutCount] = useState(0);
    const [nextClass, setNextClass] = useState(null);

    useEffect(() => {
        if (user) {
            setLoading(false);
            loadStats();
        }
    }, [user]);

    const loadStats = async () => {
        try {
            const [certsRes, purchasesRes, nextClassRes] = await Promise.all([
                api.get("/learning/certificates/").catch(() => ({ data: [] })),
                api.get("/learning/handout-purchases/").catch(() => ({ data: [] })),
                api.get("/learning/lecture-schedules/next-class/").catch(() => ({ data: { next_class: null } })),
            ]);
            const certs = certsRes.data.results || certsRes.data || [];
            const purchases = purchasesRes.data.results || purchasesRes.data || [];
            setCertCount(Array.isArray(certs) ? certs.length : 0);
            setHandoutCount(Array.isArray(purchases) ? purchases.filter(p => p.status === "COMPLETED").length : 0);
            setNextClass(nextClassRes.data?.next_class || null);
        } catch (error) {
            console.error("Error loading student stats:", error);
        }
    };

    if (!user) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    const primaryCourse = user.courses?.find((c) => c.is_primary);
    const activeCourses = user.courses?.filter((c) => c.status === "ACTIVE") || [];
    const completedCourses = user.courses?.filter((c) => c.status === "COMPLETED") || [];

    const getStatusColor = (status) => {
        switch (status) {
            case "ACTIVE":
                return "success";
            case "COMPLETED":
                return "info";
            case "WITHDRAWN":
                return "error";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "ACTIVE":
                return <CheckCircle sx={{ fontSize: 16 }} />;
            case "COMPLETED":
                return <CheckCircle sx={{ fontSize: 16 }} />;
            default:
                return <Info sx={{ fontSize: 16 }} />;
        }
    };

    return (
        <div className="space-y-6">
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

            {/* Header */}
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Welcome, {user?.firstName}!
                </Typography>
                <Typography color="text.secondary">
                    Here's your course information and academic progress.
                </Typography>
            </div>

            {/* Profile Card */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    p: 3,
                }}
            >
                <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                    <ImageZoom
                        src={user?.profilePictureUrl}
                        alt={user?.firstName}
                        avatarProps={{
                            sx: {
                                width: 80,
                                height: 80,
                                bgcolor: "#2563eb",
                                fontSize: 32,
                                fontWeight: 700,
                            },
                        }}
                    >
                        {user?.firstName?.charAt(0)?.toUpperCase()}
                        {user?.lastName?.charAt(0)?.toUpperCase()}
                    </ImageZoom>

                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                            <Typography variant="h6" fontWeight={700}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Chip
                                label={user?.status || "ACTIVE"}
                                color={user?.status === "ACTIVE" ? "success" : "warning"}
                                size="small"
                            />
                        </Box>

                        <Stack spacing={1}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Badge sx={{ fontSize: 18, color: "text.secondary" }} />
                                <Typography variant="body2" color="text.secondary">
                                    {user?.username}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Mail sx={{ fontSize: 18, color: "text.secondary" }} />
                                <Typography variant="body2" color="text.secondary">
                                    {user?.email}
                                </Typography>
                            </Box>

                            {user?.phone && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Phone sx={{ fontSize: 18, color: "text.secondary" }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {user?.phone}
                                    </Typography>
                                </Box>
                            )}

                            {user?.isIndustrialTraining && (
                                <Chip
                                    label="Industrial Training"
                                    color="warning"
                                    size="small"
                                    sx={{ width: "fit-content" }}
                                />
                            )}
                        </Stack>
                    </Box>
                </Box>
            </Paper>

            {/* Next Upcoming Class Banner */}
            {nextClass && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 3,
                        bgcolor: "#0f172a",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: "space-between",
                        alignItems: { md: "center" },
                        gap: 2,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.8 }}>
                            <Chip
                                icon={<Schedule sx={{ fontSize: "0.9rem !important", color: nextClass.next_occurrence?.is_live ? "#ffffff !important" : "#4ade80 !important" }} />}
                                label={nextClass.next_occurrence?.is_live ? "CLASS IN PROGRESS NOW" : nextClass.next_occurrence?.is_today ? "NEXT CLASS TODAY" : `NEXT CLASS (${nextClass.next_occurrence?.day || "UPCOMING"})`}
                                size="small"
                                sx={{
                                    bgcolor: nextClass.next_occurrence?.is_live ? "#16a34a" : "rgba(74, 222, 128, 0.15)",
                                    color: nextClass.next_occurrence?.is_live ? "#ffffff" : "#4ade80",
                                    fontWeight: 800,
                                    fontSize: "0.7rem",
                                }}
                            />
                            {nextClass.formatted_time && (
                                <Typography variant="caption" sx={{ color: "grey.300", fontWeight: 700 }}>
                                    {nextClass.formatted_time}
                                </Typography>
                            )}
                            {nextClass.duration_minutes && (
                                <Chip
                                    label={`${nextClass.duration_minutes}m`}
                                    size="small"
                                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, fontSize: "0.65rem", height: 18 }}
                                />
                            )}
                        </Stack>
                        <Typography variant="subtitle1" fontWeight={800} color="white">
                            {nextClass.title}
                        </Typography>
                        <Typography variant="caption" color="grey.400">
                            {nextClass.course_name ? `${nextClass.course_name} · ` : ""}{nextClass.instructor_name ? `Tutor: ${nextClass.instructor_name}` : ""}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexShrink: 0 }}>
                        {nextClass.mode === "ONLINE" && nextClass.venue_or_link ? (
                            <Button
                                variant="contained"
                                href={nextClass.venue_or_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                startIcon={<VideoCameraFront />}
                                sx={{ bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" }, fontWeight: 700, textTransform: "none" }}
                            >
                                Join Class
                            </Button>
                        ) : nextClass.venue_or_link ? (
                            <Chip label={`📍 ${nextClass.venue_or_link}`} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700 }} />
                        ) : null}
                        <Button
                            variant="outlined"
                            size="small"
                            href="/dashboard/schedule"
                            sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)", "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" }, fontWeight: 700, textTransform: "none" }}
                        >
                            View Timetable
                        </Button>
                    </Stack>
                </Paper>
            )}

            {/* Quick Stats */}
            <Grid container spacing={3}>
                <Grid xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#2563eb">
                            {user?.courses?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Total Courses
                        </Typography>
                    </Paper>
                </Grid>

                <Grid xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#16a34a">
                            {activeCourses.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Active Courses
                        </Typography>
                    </Paper>
                </Grid>

                <Grid xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#7c3aed">
                            {certCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Certificates
                        </Typography>
                    </Paper>
                </Grid>

                <Grid xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#059669">
                            {handoutCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Study Handouts
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Primary Course */}
            {primaryCourse && (
                <div>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                        Primary Course
                    </Typography>

                    <CourseDurationProgress
                        course={primaryCourse.course}
                        enrollmentDate={user?.enrollment_date || user?.enrollmentDate}
                    />

                    <Card
                        sx={{
                            borderRadius: 3,
                            border: "2px solid",
                            borderColor: "#2563eb",
                            height: "100%",
                        }}
                    >
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    mb: 2,
                                }}
                            >
                                <School
                                    sx={{
                                        fontSize: 32,
                                        color: "#2563eb",
                                    }}
                                />
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        {primaryCourse.course.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {primaryCourse.course.code_prefix}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={2}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Enrollment ID:
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {primaryCourse.enrollment_id}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Admission Year:
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {primaryCourse.admission_year}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Status:
                                    </Typography>
                                    <Chip
                                        icon={getStatusIcon(primaryCourse.status)}
                                        label={primaryCourse.status}
                                        color={getStatusColor(primaryCourse.status)}
                                        size="small"
                                    />
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Started:
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {new Date(primaryCourse.started_at).toLocaleDateString()}
                                    </Typography>
                                </Box>

                                {primaryCourse.completed_at && (
                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Completed:
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {new Date(primaryCourse.completed_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* All Courses */}
            {user?.courses && user.courses.length > 0 ? (
                <div>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                        All Courses ({user.courses.length})
                    </Typography>

                    <Grid container spacing={3}>
                        {user.courses.map((course) => (
                            <Grid xs={12} sm={6} md={4} key={course.id}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: course.is_primary ? "#2563eb" : "grey.200",
                                        height: "100%",
                                        position: "relative",
                                    }}
                                >
                                    {course.is_primary && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                right: 0,
                                                bgcolor: "#2563eb",
                                                color: "white",
                                                px: 2,
                                                py: 0.5,
                                                borderRadius: "0 12px 0 8px",
                                                fontSize: 12,
                                                fontWeight: 600,
                                            }}
                                        >
                                            PRIMARY
                                        </Box>
                                    )}

                                    <CardContent>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                                mb: 2,
                                            }}
                                        >
                                            <School
                                                sx={{
                                                    fontSize: 28,
                                                    color: "#2563eb",
                                                }}
                                            />
                                            <Box>
                                                <Typography variant="h6" fontWeight={700}>
                                                    {course.course.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {course.course.code_prefix}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Enrollment ID:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {course.enrollment_id}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Admission:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {course.admission_year}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                                                <Chip
                                                    icon={getStatusIcon(course.status)}
                                                    label={course.status}
                                                    color={getStatusColor(course.status)}
                                                    size="small"
                                                />
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </div>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "grey.200",
                        p: 4,
                        textAlign: "center",
                    }}
                >
                    <School sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography color="text.secondary">
                        No courses assigned yet. Contact your administrator.
                    </Typography>
                </Paper>
            )}
        </div>
    );
}
