"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Paper,
    Chip,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { School, CheckCircle, Info, ArrowForward } from "@mui/icons-material";

export default function CoursesPage() {
    const { user } = useAuth();
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);

    if (!user) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    const courses = user.courses || [];
    const activeCourses = courses.filter((c) => c.status === "ACTIVE");
    const completedCourses = courses.filter((c) => c.status === "COMPLETED");
    const primaryCourse = courses.find((c) => c.is_primary);

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

    const handleViewCourse = (course) => {
        setSelectedCourse(course);
        setViewOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Typography variant="h4" fontWeight={700}>
                    My Courses
                </Typography>
                <Typography color="text.secondary">
                    View all your enrolled courses and their details.
                </Typography>
            </div>

            {/* Stats */}
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
                            {courses.length}
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
                            Active
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
                            Primary
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Courses Grid */}
            {courses.length > 0 ? (
                <div>
                    <Typography variant="h6" fontWeight={700} mb={3}>
                        All Courses ({courses.length})
                    </Typography>

                    <Grid container spacing={3}>
                        {courses.map((course) => (
                            <Grid xs={12} sm={6} md={4} key={course.id}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: course.is_primary ? "#2563eb" : "grey.200",
                                        height: "100%",
                                        position: "relative",
                                        transition: "all 0.3s ease",
                                        "&:hover": {
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                            transform: "translateY(-4px)",
                                        },
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

                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                endIcon={<ArrowForward />}
                                                onClick={() => handleViewCourse(course)}
                                                sx={{ mt: 2 }}
                                            >
                                                View Details
                                            </Button>
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

            {/* Course Details Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Course Details</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {selectedCourse && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Course Name
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {selectedCourse.course.name}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Course Code
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {selectedCourse.course.code_prefix}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Enrollment ID
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {selectedCourse.enrollment_id}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Admission Year
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {selectedCourse.admission_year}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Status
                                </Typography>
                                <Chip
                                    icon={getStatusIcon(selectedCourse.status)}
                                    label={selectedCourse.status}
                                    color={getStatusColor(selectedCourse.status)}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Started
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {new Date(selectedCourse.started_at).toLocaleDateString()}
                                </Typography>
                            </Box>

                            {selectedCourse.completed_at && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Completed
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(selectedCourse.completed_at).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}

                            {selectedCourse.is_primary && (
                                <Box sx={{ bgcolor: "#2563eb", color: "white", p: 2, borderRadius: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        ✓ This is your primary course
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
