"use client";

import { useEffect, useState } from "react";
import {
    Grid, TextField, MenuItem, FormControlLabel, Switch, CircularProgress, Button, Stack, Divider, Box, Collapse, Typography, Alert,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, CloudUpload } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { successToast, errorToast, infoToast, } from "@/lib/toast";
import { getCourses } from "@/services/courses";
import { createStudent, updateStudent } from "@/services/students";
import StudentCoursesManager from "./StudentCoursesManager";
import api from "@/lib/axios";

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

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
            phone: "",
            additional_phone: "",
            date_of_birth: "",
            gender: "",
            address: "",
            state_of_origin: "",
            bio: "",
            admission_year_write: new Date().getFullYear(),
            course_id: "",
            status: "ACTIVE",
            is_industrial_training: false,
        },
    });

    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [coursesRefresh, setCoursesRefresh] = useState(0);
    const [expandMore, setExpandMore] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState(defaultValues?.profile_picture_url || null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(defaultValues?.profile_picture_url || null);

    useEffect(() => {
        if (!defaultValues) {
            reset({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                additional_phone: "",
                date_of_birth: "",
                gender: "",
                address: "",
                state_of_origin: "",
                bio: "",
                admission_year_write: new Date().getFullYear(),
                course_id: "",
                status: "ACTIVE",
                is_industrial_training: false,
            });
            return;
        }

        reset({
            first_name: defaultValues.first_name || "",
            last_name: defaultValues.last_name || "",
            email: defaultValues.email || "",
            phone: defaultValues.phone || "",
            additional_phone: defaultValues.additional_phone || "",
            date_of_birth: defaultValues.date_of_birth || "",
            gender: defaultValues.gender || "",
            address: defaultValues.address || "",
            state_of_origin: defaultValues.state_of_origin || "",
            bio: defaultValues.bio || "",
            admission_year_write: defaultValues.admission_year || new Date().getFullYear(),
            course_id: "",
            status: defaultValues.status || "ACTIVE",
            is_industrial_training: defaultValues.is_industrial_training || false,
        });
    }, [defaultValues, reset]);

    useEffect(() => {
        if (defaultValues?.profile_picture_url) {
            setProfilePictureUrl(defaultValues.profile_picture_url);
            setProfilePicturePreview(defaultValues.profile_picture_url);
        }
    }, [defaultValues?.profile_picture_url]);

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

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            errorToast(null, "Only JPEG, PNG, and WebP images are allowed");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setProfilePicturePreview(event.target.result);
        };
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('file', file);

            const response = await api.post('/upload/profile-picture/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setProfilePictureUrl(response.data.url);
            successToast("Profile picture uploaded successfully!");
        } catch (error) {
            setProfilePicturePreview(null);
            errorToast(error, "Failed to upload profile picture");
        } finally {
            setUploading(false);
        }
    };

    async function onSubmit(values) {
        try {
            const payload = {
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                status: values.status,
                is_industrial_training: values.is_industrial_training,
                role: "STUDENT",
            };

            if (defaultValues?.id) {
                payload.phone = values.phone;
                payload.additional_phone = values.additional_phone;
                payload.date_of_birth = values.date_of_birth;
                payload.gender = values.gender;
                payload.address = values.address;
                payload.state_of_origin = values.state_of_origin;
                payload.bio = values.bio;
                payload.profile_picture_url = profilePictureUrl;
                await updateStudent(defaultValues.id, payload);
                successToast("Student updated successfully.");
            } else {
                payload.course_id = values.course_id;
                payload.admission_year_write = values.admission_year_write;
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
                                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
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

                {/* SHOW MORE BUTTON */}
                {isEditing && defaultValues?.id && (
                    <Grid size={{ xs: 12 }}>
                        <Button
                            onClick={() => setExpandMore(!expandMore)}
                            endIcon={<ExpandMoreIcon sx={{ transform: expandMore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }} />}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                            {expandMore ? "Show Less" : "Show More"}
                        </Button>
                    </Grid>
                )}

                {/* ADDITIONAL FIELDS - COLLAPSIBLE */}
                <Collapse in={expandMore} timeout="auto" unmountOnExit sx={{ width: "100%" }}>
                    <Grid container spacing={3} sx={{ width: "100%" }}>
                        {/* PROFILE PICTURE */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                Profile Picture
                            </Typography>
                            
                            {profilePicturePreview ? (
                                <Box
                                    sx={{
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        border: "2px solid",
                                        borderColor: "grey.300",
                                        mb: 2,
                                        position: "relative",
                                        width: 100,
                                        height: 100,
                                    }}
                                >
                                    <img
                                        src={profilePicturePreview}
                                        alt="Profile preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                    <Box
                                        component="label"
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            bgcolor: "rgba(0, 0, 0, 0.6)",
                                            color: "white",
                                            p: 1.5,
                                            textAlign: "center",
                                            cursor: "pointer",
                                            transition: "all 0.3s",
                                            "&:hover": {
                                                bgcolor: "rgba(0, 0, 0, 0.8)",
                                            },
                                        }}
                                    >
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleProfilePictureChange}
                                            disabled={uploading || !isEditing}
                                        />
                                        <Typography variant="caption" fontWeight={500}>
                                            Change Photo
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        border: "2px dashed",
                                        borderColor: "grey.300",
                                        borderRadius: 2,
                                        p: 4,
                                        textAlign: "center",
                                        cursor: isEditing ? "pointer" : "default",
                                        transition: "all 0.3s",
                                        "&:hover": isEditing ? {
                                            borderColor: "primary.main",
                                            bgcolor: "action.hover",
                                        } : {},
                                    }}
                                    component="label"
                                >
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleProfilePictureChange}
                                        disabled={uploading || !isEditing}
                                    />
                                    <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                                    <Typography variant="body2" fontWeight={500}>
                                        Click to upload or drag and drop
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        PNG, JPG, WebP up to 5MB
                                    </Typography>
                                </Box>
                            )}

                            {uploading && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2">Uploading...</Typography>
                                </Box>
                            )}

                            {profilePictureUrl && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    Profile picture uploaded
                                </Alert>
                            )}
                        </Grid>

                        {/* PHONE */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Phone"
                                        fullWidth
                                        disabled={!isEditing}
                                        slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* ADDITIONAL PHONE */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="additional_phone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Additional Phone"
                                        fullWidth
                                        disabled={!isEditing}
                                        slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* DATE OF BIRTH */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="date_of_birth"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="date"
                                        label="Date of Birth"
                                        fullWidth
                                        disabled={!isEditing}
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true,
                                            },
                                            input: { style: { opacity: isEditing ? 1 : 0.8, cursor: isEditing ? "pointer" : "default" } },
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* GENDER */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Gender"
                                        disabled={!isEditing}
                                        slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                    >
                                        <MenuItem value="MALE">Male</MenuItem>
                                        <MenuItem value="FEMALE">Female</MenuItem>
                                        <MenuItem value="OTHER">Other</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* STATE OF ORIGIN */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="state_of_origin"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="State of Origin"
                                        fullWidth
                                        disabled={!isEditing}
                                        slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                    >
                                        {NIGERIAN_STATES.map((state) => (
                                            <MenuItem key={state} value={state}>
                                                {state}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* ADDRESS */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Address"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        disabled={!isEditing}
                                        slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* BIO */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="bio"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Bio"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        disabled={!isEditing}
                                        slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Collapse>

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
