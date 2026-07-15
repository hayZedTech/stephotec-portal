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
    Avatar,
    Stack,
    Divider,
} from "@mui/material";
import {
    School,
    Person,
    Mail,
    Phone,
    Badge,
    CheckCircle,
    Info,
} from "@mui/icons-material";

export default function StudentDashboardPage() {
    const { user } = useAuth();

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
                    <Avatar
                        src={user?.profilePictureUrl}
                        sx={{
                            width: 80,
                            height: 80,
                            bgcolor: "#2563eb",
                            fontSize: 32,
                            fontWeight: 700,
                        }}
                    >
                        {user?.firstName?.charAt(0)?.toUpperCase()}
                        {user?.lastName?.charAt(0)?.toUpperCase()}
                    </Avatar>

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
                        <Typography variant="h4" fontWeight={700} color="#0ea5e9">
                            {completedCourses.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Completed
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
                        <Typography
                            variant="h4"
                            fontWeight={700}
                            color={primaryCourse ? "#2563eb" : "text.secondary"}
                        >
                            {primaryCourse ? "✓" : "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Primary Course
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
