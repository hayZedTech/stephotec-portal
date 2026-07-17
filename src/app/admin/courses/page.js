"use client";

import { useEffect, useMemo, useState } from "react";

import CoursesTable from "@/components/courses/CoursesTable";
import CourseDialog from "@/components/courses/CourseDialog";
import CourseForm from "@/components/courses/CourseForm";
import CourseViewModal from "@/components/courses/CourseViewModal";

import {
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    Box,
    CircularProgress,
} from "@mui/material";

import {
    Search,
    Add,
} from "@mui/icons-material";

import {
    getCourses,
    deleteCourse,
} from "@/services/courses";

import {
    successToast,
    errorToast,
} from "@/lib/toast";

import { confirmAction } from "@/utils/confirmAction";

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const [viewOpen, setViewOpen] = useState(false);
    const [viewingCourse, setViewingCourse] = useState(null);

    async function loadCourses() {
        try {
            setLoading(true);
            const data = await getCourses();
            setCourses(data);
        } catch (error) {
            errorToast(error, "Failed to load courses.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCourses();
    }, []);

    const filteredCourses = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return courses;
        }

        return courses.filter(
            (course) =>
                course.name.toLowerCase().includes(keyword) ||
                course.code_prefix.toLowerCase().includes(keyword)
        );
    }, [courses, search]);

    function handleAddCourse() {
        setSelectedCourse(null);
        setDialogOpen(true);
    }

    function handleEditCourse(course) {
        setSelectedCourse({
            ...course,
            isEditing: true,
        });

        setDialogOpen(true);
    }

    function handleViewCourse(course) {
        setViewingCourse(course);
        setViewOpen(true);
    }

    function closeDialog() {
        setDialogOpen(false);
        setSelectedCourse(null);
    }

    async function handleFormSuccess() {
        closeDialog();
        await loadCourses();
    }

    function handleDeleteCourse(course) {
        confirmAction(
            `Delete "${course.name}"? This cannot be undone.`,
            async () => {
                try {
                    await deleteCourse(course.id);

                    successToast("Course deleted successfully.");

                    if (viewOpen) {
                        setViewOpen(false);
                    }

                    await loadCourses();
                } catch (error) {
                    errorToast(error, "Unable to delete course.");
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    }

    return (
        <>
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
                            Loading courses...
                        </Typography>
                    </Box>
                </Box>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 6 } }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 3, lg: 5 }, lg: { alignItems: "center", justifyContent: "space-between" } }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                            Courses
                        </Typography>

                        <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                            Manage all available courses.
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 3 }, width: { xs: "100%", lg: "auto" } }}>
                        <TextField
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{
                                width: {
                                    xs: "100%",
                                    sm: "auto",
                                    md: 320,
                                },
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddCourse}
                            sx={{
                                borderRadius: 3,
                                px: { xs: 2, sm: 3 },
                                textTransform: "none",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Add Course
                        </Button>
                    </Box>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "grey.200",
                        overflow: "auto",
                    }}
                >
                    <CoursesTable
                        rows={filteredCourses}
                        loading={loading}
                        onView={handleViewCourse}
                        onEdit={handleEditCourse}
                        onDelete={handleDeleteCourse}
                    />
                </Paper>
            </Box>

            <CourseViewModal
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                course={viewingCourse}
                onEdit={(course) => {
                    setViewOpen(false);
                    handleEditCourse(course);
                }}
                onDelete={handleDeleteCourse}
            />

            <CourseDialog
                open={dialogOpen}
                onClose={closeDialog}
                title={
                    selectedCourse
                        ? "Edit Course"
                        : "Add Course"
                }
            >
                <CourseForm
                    defaultValues={selectedCourse}
                    isEditing
                    onCancel={closeDialog}
                    onSuccess={handleFormSuccess}
                />
            </CourseDialog>
        </>
    );
}
