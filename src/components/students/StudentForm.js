"use client";

import { useEffect, useState } from "react";
import {
    Grid, TextField, MenuItem, FormControlLabel, Switch, CircularProgress, Button, Stack, Divider, Box,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { successToast, errorToast, infoToast, } from "@/lib/toast";
import { getCourses } from "@/services/courses";
import { createStudent, updateStudent } from "@/services/students";
import StudentCoursesManager from "./StudentCoursesManager";

export default function StudentForm({ defaultValues, onSuccess, onCancel, isEditing = true }) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            admission_year_write: new Date().getFullYear(),
            course_id: "",
            status: "ACTIVE",
            is_industrial_training: false,
        },
    });

    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [coursesRefresh, setCoursesRefresh] = useState(0);

    useEffect(() => {
        if (!defaultValues) return;

        reset({
            first_name: defaultValues.first_name || "",
            last_name: defaultValues.last_name || "",
            email: defaultValues.email || "",
            admission_year_write: defaultValues.admission_year || new Date().getFullYear(),
            course_id: "",
            status: defaultValues.status || "ACTIVE",
            is_industrial_training: defaultValues.is_industrial_training || false,
        });
    }, [defaultValues, reset]);

    useEffect(() => {
        let mounted = true;

        async function loadCourses() {
            try {
                setLoadingCourses(true);
                const data = await getCourses();
                if (mounted) {
                    const activeCourses = Array.isArray(data) ? data.filter(course => course.is_active) : [];
                    setCourses(activeCourses);
                }
            } catch (error) {
                errorToast(error, "Failed to load courses.");
            } finally {
                if (mounted) {
                    setLoadingCourses(false);
                }
            }
        }

        loadCourses();
        return () => {
            mounted = false;
        };
    }, []);

    async function onSubmit(values) {
        try {
            const payload = {
                ...values,
                role: "STUDENT",
            };

            if (defaultValues?.id) {
                delete payload.course_id;
                delete payload.admission_year_write;
                await updateStudent(defaultValues.id, payload);
                successToast("Student updated successfully.");
            } else {
                const data = await createStudent(payload);
                successToast("Student created successfully.");
                if (data?.temporary_password) {
                    infoToast(`Temporary Password: ${data.temporary_password}`);
                }
            }

            onSuccess?.();
        } catch (error) {
            let errorMessage = "Unable to save student.";
            
            if (error.response?.data?.course_id?.[0]) {
                const courseError = error.response.data.course_id[0];
                if (courseError.includes("Invalid pk")) {
                    errorMessage = "Selected course does not exist or is not active. Please choose a valid course.";
                } else {
                    errorMessage = courseError;
                }
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.data?.email?.[0]) {
                errorMessage = error.response.data.email[0];
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            errorToast(null, errorMessage);
        }
    }

    if (loadingCourses) {
        return (
            <div className="flex justify-center py-10">
                <CircularProgress />
            </div>
        );
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i).reverse();

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>

                {/* FIRST NAME */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="first_name"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="First Name" fullWidth required disabled={!isEditing} slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }} />
                        )}
                    />
                </Grid>

                {/* LAST NAME */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="last_name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Last Name"
                                fullWidth
                                required
                                disabled={!isEditing}
                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                            />
                        )}
                    />
                </Grid>

                {/* EMAIL */}
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                type="email"
                                label="Email"
                                fullWidth
                                required
                                disabled={!isEditing}
                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                            />
                        )}
                    />
                </Grid>

                {/* COURSE - Only for new students */}
                {!defaultValues?.id && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="course_id"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Course"
                                    required
                                    disabled={!isEditing}
                                    slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                >
                                    {courses.map((course) => (
                                        <MenuItem key={course.id} value={course.id}>
                                            {course.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>
                )}

                {/* ADMISSION YEAR */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="admission_year_write"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                label="Admission Year"
                                required={!defaultValues?.id}
                                disabled={!isEditing}
                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                            >
                                {years.map((year) => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                </Grid>

                {/* STATUS */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                label="Status"
                                disabled={!isEditing}
                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                            >
                                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
                                <MenuItem value="GRADUATED">GRADUATED</MenuItem>
                                <MenuItem value="WITHDRAWN">WITHDRAWN</MenuItem>
                            </TextField>
                        )}
                    />
                </Grid>

                {/* INDUSTRIAL TRAINING */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="is_industrial_training"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                label="Industrial Training"
                                disabled={!isEditing}
                                control={
                                    <Switch
                                        checked={field.value}
                                        onChange={(e) =>
                                            field.onChange(e.target.checked)
                                        }
                                        disabled={!isEditing}
                                    />
                                }
                            />
                        )}
                    />
                </Grid>

                {/* ACTIONS */}
                <Grid size={{ xs: 12 }}>
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ justifyContent: "flex-end", mt: 2 }}
                    >
                        <Button onClick={onCancel}>
                            {isEditing ? "Cancel" : "Close"}
                        </Button>

                        {isEditing && (
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                            >
                                {defaultValues?.id
                                    ? "Update Student"
                                    : "Create Student"}
                            </Button>
                        )}
                    </Stack>
                </Grid>

                {/* COURSES MANAGER - Only show when editing existing student */}
                {defaultValues?.id && isEditing && (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 2 }} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <StudentCoursesManager
                                studentId={defaultValues.id}
                                admissionYear={defaultValues.admission_year}
                                onCoursesUpdated={() => setCoursesRefresh(prev => prev + 1)}
                            />
                        </Grid>
                    </>
                )}

            </Grid>
        </form>
    );
}
