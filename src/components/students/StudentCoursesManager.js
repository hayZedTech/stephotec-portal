"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Button,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip,
    IconButton,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { getCourses } from "@/services/courses";
import {
    getStudentCourses,
    createStudentCourse,
    updateStudentCourse,
    deleteStudentCourse,
} from "@/services/studentCourses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

export default function StudentCoursesManager({ studentId, admissionYear, onCoursesUpdated }) {
    const [courses, setCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        course_id: "",
        status: "ACTIVE",
        is_primary: false,
    });

    useEffect(() => {
        loadCourses();
        loadAllCourses();
    }, [studentId]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const data = await getStudentCourses(studentId);
            setCourses(data);
        } catch (error) {
            errorToast(error, "Failed to load student courses.");
        } finally {
            setLoading(false);
        }
    };

    const loadAllCourses = async () => {
        try {
            const data = await getCourses();
            setAllCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            errorToast(error, "Failed to load courses.");
        }
    };

    const handleOpenDialog = (course = null) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                course_id: course.course?.id || "",
                status: course.status || "ACTIVE",
                is_primary: course.is_primary || false,
            });
        } else {
            setEditingCourse(null);
            setFormData({
                course_id: "",
                status: "ACTIVE",
                is_primary: false,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingCourse(null);
        setFormData({
            course_id: "",
            status: "ACTIVE",
            is_primary: false,
        });
    };

    const handleSave = async () => {
        if (!formData.course_id) {
            errorToast(null, "Please select a course.");
            return;
        }

        try {
            if (editingCourse) {
                await updateStudentCourse(studentId, editingCourse.id, formData);
                successToast("Course updated successfully.");
            } else {
                await createStudentCourse(studentId, formData);
                successToast("Course added successfully.");
            }
            handleCloseDialog();
            await loadCourses();
            onCoursesUpdated?.();
        } catch (error) {
            errorToast(error, "Failed to save course.");
        }
    };

    const handleDelete = (course) => {
        confirmAction(
            `Remove ${course.course?.name} from this student?`,
            async () => {
                try {
                    await deleteStudentCourse(studentId, course.id);
                    successToast("Course removed successfully.");
                    await loadCourses();
                    onCoursesUpdated?.();
                } catch (error) {
                    errorToast(error, "Failed to remove course.");
                }
            },
            null,
            "Remove",
            "Cancel",
            true
        );
    };

    const handleSetPrimary = async (course) => {
        try {
            await updateStudentCourse(studentId, course.id, { is_primary: true });
            successToast("Primary course switched successfully.");
            await loadCourses();
            onCoursesUpdated?.();
        } catch (error) {
            errorToast(error, "Failed to set primary course.");
        }
    };

    const handleRemovePrimary = async (course) => {
        try {
            await updateStudentCourse(studentId, course.id, { is_primary: false });
            successToast("Primary course removed successfully.");
            await loadCourses();
            onCoursesUpdated?.();
        } catch (error) {
            errorToast(error, "Failed to remove primary course.");
        }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <h3 style={{ margin: 0 }}>Enrolled Courses</h3>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Course
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : courses.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {courses.map((course) => (
                        <Box
                            key={course.id}
                            sx={{
                                p: 2,
                                border: "1px solid #e5e7eb",
                                borderRadius: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Box>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                    <span style={{ fontWeight: 600 }}>
                                        {course.course?.name || "Unknown Course"}
                                    </span>
                                    {course.is_primary && (
                                        <Chip size="small" label="Primary" color="primary" />
                                    )}
                                </Box>
                                <Chip
                                    size="small"
                                    label={course.status}
                                    color={
                                        course.status === "ACTIVE"
                                            ? "success"
                                            : course.status === "COMPLETED"
                                            ? "info"
                                            : "default"
                                    }
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                {course.status === "ACTIVE" && !course.is_primary && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleSetPrimary(course)}
                                    >
                                        Set Primary
                                    </Button>
                                )}
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(course)}
                                >
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(course)}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : (
                <p style={{ color: "#6b7280" }}>No courses enrolled</p>
            )}

            {/* Add/Edit Course Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingCourse ? "Edit Course" : "Add Course"}
                </DialogTitle>
                <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        select
                        fullWidth
                        label="Course"
                        value={formData.course_id}
                        onChange={(e) =>
                            setFormData({ ...formData, course_id: e.target.value })
                        }
                    >
                        {allCourses.map((course) => (
                            <MenuItem key={course.id} value={course.id}>
                                {course.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label="Status"
                        value={formData.status}
                        onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value })
                        }
                    >
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="COMPLETED">Completed</MenuItem>
                        <MenuItem value="WITHDRAWN">Withdrawn</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {editingCourse ? "Update" : "Add"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
