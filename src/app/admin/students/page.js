"use client";

import { useEffect, useState, useMemo } from "react";

import StudentForm from "@/components/students/StudentForm";
import StudentsTable from "@/components/students/StudentsTable";
import StudentDialog from "@/components/students/StudentDialog";
import StudentFilters from "@/components/students/StudentFilters";

import {Paper, Typography, TextField, InputAdornment, Button, Box, CircularProgress, Backdrop,
} from "@mui/material";

import { Search, Add } from "@mui/icons-material";
import { successToast, errorToast } from "@/lib/toast";

import {
    getStudents,
    deleteStudent,
    updateStudent,
} from "@/services/students";
import { confirmAction } from "@/utils/confirmAction";

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        status: "",
        primaryCourse: "",
        industrialTraining: "",
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    async function loadStudents() {
        try {
            setLoading(true);

            const data = await getStudents();

            setStudents(data);
        } catch (error) {
            if (
                process.env.NODE_ENV === "development" &&
                (!error.response || error.response.status >= 500)
            ) {
                console.error(error);
            }

            errorToast(error, "Failed to load students.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        let result = students;

        const keyword = search.toLowerCase().trim();
        if (keyword) {
            result = result.filter((student) => {
                return (
                    student.first_name?.toLowerCase().includes(keyword) ||
                    student.last_name?.toLowerCase().includes(keyword) ||
                    student.username?.toLowerCase().includes(keyword) ||
                    student.email?.toLowerCase().includes(keyword)
                );
            });
        }

        if (filters.status) {
            result = result.filter((student) => student.status === filters.status);
        }

        if (filters.primaryCourse) {
            result = result.filter((student) => {
                const primaryCourse = student.courses?.find(c => c.is_primary);
                return primaryCourse?.course?.id === parseInt(filters.primaryCourse);
            });
        }

        if (filters.industrialTraining === "yes") {
            result = result.filter((student) => student.is_industrial_training === true);
        } else if (filters.industrialTraining === "no") {
            result = result.filter((student) => student.is_industrial_training === false);
        }

        return result;
    }, [students, search, filters]);

    function handleAddStudent() {
        setSelectedStudent(null);
        setOpenDialog(true);
    }

    function handleEditStudent(student) {
        setSelectedStudent({ ...student, isEditing: true });
        setOpenDialog(true);
    }

    function openDeleteDialog(student) {
        confirmAction(
            `Delete ${student.first_name}? This cannot be undone.`,
            async () => {
                try {
                    await deleteStudent(student.id);
                    successToast("Student deleted successfully.");
                    await loadStudents();
                } catch (error) {
                    errorToast(error, "Failed to delete student.");
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    }

    function closeStudentDialog() {
        setOpenDialog(false);
        setSelectedStudent(null);
    }

    async function handleFormSuccess() {
        closeStudentDialog();
        await loadStudents();
    }

    return (
        <>
            {/* LOADING OVERLAY */}
            <Backdrop
                sx={{
                    color: "#fff",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
                open={loading}
            >
                <CircularProgress color="inherit" size={100} />
                <Typography variant="body1" fontWeight={500}>
                    Loading students...
                </Typography>
            </Backdrop>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

                {/* TITLE */}
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                        Students
                    </Typography>

                    <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                        Manage all registered students.
                    </Typography>
                </Box>

                {/* SEARCH + FILTERS + ACTION */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        placeholder="Search students..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        sx={{
                            width: "100%",
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

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "auto auto auto" }, gap: 2, alignItems: "center" }}>
                        <StudentFilters
                            onFilterChange={setFilters}
                        />

                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddStudent}
                            size="small"
                            sx={{
                                borderRadius: 2,
                                p: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                gridColumn: { xs: "1 / -1", sm: "auto" },
                            }}
                        >
                            Add Student
                        </Button>
                    </Box>
                </Box>

                {/* TABLE */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "grey.200",
                        height: { xs: "auto", md: 700 },
                        overflow: "auto",
                    }}
                >
                    <StudentsTable
                        rows={filteredStudents}
                        loading={loading}
                        onEdit={handleEditStudent}
                        onDelete={openDeleteDialog}
                    />
                </Paper>
            </Box>

            {/* CREATE / EDIT DIALOG */}
            <StudentDialog
                open={openDialog}
                onClose={closeStudentDialog}
                title={
                    !selectedStudent
                        ? "Add Student"
                        : selectedStudent.isEditing
                        ? "Edit Student"
                        : "View Student"
                }
            >
                <StudentForm
                    defaultValues={selectedStudent}
                    isEditing={selectedStudent?.isEditing}
                    onCancel={closeStudentDialog}
                    onSuccess={handleFormSuccess}
                />
            </StudentDialog>

        </>
    );
}
