"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Paper,
    Typography,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    CircularProgress,
    Button,
    Stack,
    Divider,
    Box,
    Grid,
    Chip,
    Avatar,
    Tabs,
    Tab,
    Card,
    CardContent,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ArrowBack } from "@mui/icons-material";
import { successToast, errorToast } from "@/lib/toast";
import { getStudents, updateStudent } from "@/services/students";
import { getCourses } from "@/services/courses";
import StudentCoursesManager from "@/components/students/StudentCoursesManager";
import StudentContentAssignment from "@/components/students/StudentContentAssignment";
import { confirmAction } from "@/utils/confirmAction";

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

const InfoCard = ({ label, value }) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200", p: 2, height: "100%" }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>
            {value || "—"}
        </Typography>
    </Card>
);

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id;

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

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
            status: "ACTIVE",
            is_industrial_training: false,
        },
    });

    useEffect(() => {
        loadStudent();
    }, [studentId]);

    async function loadStudent() {
        try {
            setLoading(true);
            const data = await getStudents();
            const found = data.find(s => s.id === parseInt(studentId));
            if (found) {
                setStudent(found);
                reset({
                    first_name: found.first_name || "",
                    last_name: found.last_name || "",
                    email: found.email || "",
                    phone: found.phone || "",
                    additional_phone: found.additional_phone || "",
                    date_of_birth: found.date_of_birth || "",
                    gender: found.gender || "",
                    address: found.address || "",
                    state_of_origin: found.state_of_origin || "",
                    bio: found.bio || "",
                    status: found.status || "ACTIVE",
                    is_industrial_training: found.is_industrial_training || false,
                });
            }
        } catch (error) {
            errorToast(error, "Failed to load student details.");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(values) {
        try {
            await updateStudent(studentId, values);
            successToast("Student updated successfully.");
            setIsEditing(false);
            await loadStudent();
        } catch (error) {
            errorToast(error, "Failed to update student.");
        }
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="space-y-6">
                <Button startIcon={<ArrowBack />} onClick={() => router.back()}>
                    Back
                </Button>
                <Typography>Student not found.</Typography>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Button startIcon={<ArrowBack />} onClick={() => router.back()}>
                        Back
                    </Button>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            {student.first_name} {student.last_name}
                        </Typography>
                        <Typography color="text.secondary">
                            {student.username}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {!isEditing && (
                        <Button variant="contained" onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </Box>
            </Box>

            {/* TABS */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}
                >
                    <Tab label="Personal Info" />
                    <Tab label="Courses" />
                    <Tab label="Learning Content" />
                    <Tab label="Assignments" />
                </Tabs>

                {/* TAB CONTENT */}
                <Box sx={{ p: 3 }}>
                    {/* PERSONAL INFO TAB */}
                    {tabValue === 0 && (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={3}>
                                {/* FIRST NAME */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="first_name"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="First Name"
                                                fullWidth
                                                disabled={!isEditing}
                                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                            />
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
                                                disabled={!isEditing}
                                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                            />
                                        )}
                                    />
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
                                                    input: { style: { opacity: isEditing ? 1 : 0.8 } },
                                                    inputLabel: { shrink: true },
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
                                                label="Gender"
                                                fullWidth
                                                disabled={!isEditing}
                                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                            >
                                                <MenuItem value="">Select Gender</MenuItem>
                                                <MenuItem value="MALE">Male</MenuItem>
                                                <MenuItem value="FEMALE">Female</MenuItem>
                                                <MenuItem value="OTHER">Other</MenuItem>
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
                                                rows={3}
                                                disabled={!isEditing}
                                                slotProps={{ input: { style: { opacity: isEditing ? 1 : 0.8 } } }}
                                            />
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
                                                label="Status"
                                                fullWidth
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
                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                        disabled={!isEditing}
                                                    />
                                                }
                                            />
                                        )}
                                    />
                                </Grid>

                                {/* ACTIONS */}
                                {isEditing && (
                                    <Grid size={{ xs: 12 }}>
                                        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                                            <Button onClick={() => { setIsEditing(false); loadStudent(); }}>
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={isSubmitting}
                                            >
                                                Save Changes
                                            </Button>
                                        </Stack>
                                    </Grid>
                                )}
                            </Grid>
                        </form>
                    )}

                    {/* COURSES TAB */}
                    {tabValue === 1 && (
                        <StudentCoursesManager
                            key={refreshKey}
                            studentId={student.id}
                            admissionYear={student.admission_year}
                            onCoursesUpdated={() => setRefreshKey(prev => prev + 1)}
                        />
                    )}

                    {/* LEARNING CONTENT TAB */}
                    {tabValue === 2 && (
                        <StudentContentAssignment
                            studentId={student.id}
                            courseId={student.courses?.find(c => c.is_primary)?.course?.id}
                            contentType="Learning Content"
                            fetchFunction={async (id) => []}
                            assignFunction={async (studentId, itemId) => {}}
                            unassignFunction={async (studentId, itemId) => {}}
                        />
                    )}

                    {/* ASSIGNMENTS TAB */}
                    {tabValue === 3 && (
                        <StudentContentAssignment
                            studentId={student.id}
                            courseId={student.courses?.find(c => c.is_primary)?.course?.id}
                            contentType="Assignments"
                            fetchFunction={async (id) => []}
                            assignFunction={async (studentId, itemId) => {}}
                            unassignFunction={async (studentId, itemId) => {}}
                        />
                    )}
                </Box>
            </Paper>
        </div>
    );
}
