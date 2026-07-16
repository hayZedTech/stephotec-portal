"use client";

import { useState, useEffect } from "react";
import {
    Paper,
    Typography,
    TextField,
    MenuItem,
    Button,
    Stack,
    Box,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { successToast, errorToast } from "@/lib/toast";
import api from "@/lib/axios";
import { Send, Delete, Visibility } from "@mui/icons-material";

export default function AdminNotificationsPage() {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [showStudentDialog, setShowStudentDialog] = useState(false);
    const [showCourseDialog, setShowCourseDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [notificationRecipients, setNotificationRecipients] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [loadingNotificationId, setLoadingNotificationId] = useState(null);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            title: "",
            message: "",
            type: "INFO",
            target_type: "ALL",
        },
    });

    const targetType = watch("target_type");

    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        try {
            setLoading(true);
            await Promise.all([
                loadNotifications(),
                loadStudents(),
                loadCourses(),
            ]);
        } finally {
            setLoading(false);
        }
    }

    async function loadNotifications() {
        try {
            const { data } = await api.get("/notifications/");
            setNotifications(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            errorToast(error, "Failed to load notifications");
        }
    }

    async function loadStudents() {
        try {
            const { data } = await api.get("/admin/students/");
            setStudents(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Failed to load students:", error);
        }
    }

    async function loadCourses() {
        try {
            const { data } = await api.get("/courses/");
            setCourses(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Failed to load courses:", error);
        }
    }

    async function onSubmit(values) {
        try {
            const payload = {
                title: values.title,
                message: values.message,
                type: values.type,
                target_type: values.target_type,
            };

            if (values.target_type === "SPECIFIC") {
                payload.student_ids = selectedStudents;
            } else if (values.target_type === "COURSE") {
                payload.course_ids = selectedCourses;
            }

            await api.post("/notifications/", payload);
            successToast("Notification sent successfully!");
            reset();
            setSelectedStudents([]);
            setSelectedCourses([]);
            loadNotifications();
        } catch (error) {
            errorToast(error, "Failed to send notification");
        }
    }

    const toggleStudent = (studentId) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const toggleCourse = (courseId) => {
        setSelectedCourses((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId]
        );
    };

    async function viewNotificationHistory(notification) {
        try {
            setLoadingNotificationId(notification.id);
            setLoadingRecipients(true);
            setSelectedNotification(notification);
            const { data } = await api.get(`/notifications/${notification.id}/`);
            setNotificationRecipients(data.recipients || []);
            setShowHistoryDialog(true);
        } catch (error) {
            errorToast(error, "Failed to load notification details");
        } finally {
            setLoadingRecipients(false);
            setLoadingNotificationId(null);
        }
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 6 }, position: "relative" }}>
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
                            Loading notifications...
                        </Typography>
                    </Box>
                </Box>
            )}

            <Box>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                    Send Notifications
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Send announcements to students.
                </Typography>
            </Box>

            {/* SEND NOTIFICATION FORM */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    p: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack spacing={3}>
                        {/* TITLE */}
                        <Controller
                            name="title"
                            control={control}
                            rules={{ required: "Title is required" }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Notification Title"
                                    fullWidth
                                    size="small"
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />

                        {/* MESSAGE */}
                        <Controller
                            name="message"
                            control={control}
                            rules={{ required: "Message is required" }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Message"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    size="small"
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />

                        {/* TYPE */}
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Notification Type"
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="INFO">Information</MenuItem>
                                    <MenuItem value="WARNING">Warning</MenuItem>
                                    <MenuItem value="SUCCESS">Success</MenuItem>
                                    <MenuItem value="ERROR">Error</MenuItem>
                                </TextField>
                            )}
                        />

                        {/* TARGET TYPE */}
                        <Controller
                            name="target_type"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Send To"
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="ALL">All Students</MenuItem>
                                    <MenuItem value="SPECIFIC">Specific Students</MenuItem>
                                    <MenuItem value="COURSE">By Course</MenuItem>
                                </TextField>
                            )}
                        />

                        {/* SPECIFIC STUDENTS */}
                        {targetType === "SPECIFIC" && (
                            <Box>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowStudentDialog(true)}
                                    fullWidth
                                    size="small"
                                >
                                    Select Students ({selectedStudents.length})
                                </Button>
                                {selectedStudents.length > 0 && (
                                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {selectedStudents.map((id) => {
                                            const student = students.find((s) => s.id === id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={`${student?.first_name} ${student?.last_name}`}
                                                    onDelete={() => toggleStudent(id)}
                                                    size="small"
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* BY COURSE */}
                        {targetType === "COURSE" && (
                            <Box>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowCourseDialog(true)}
                                    fullWidth
                                    size="small"
                                >
                                    Select Courses ({selectedCourses.length})
                                </Button>
                                {selectedCourses.length > 0 && (
                                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {selectedCourses.map((id) => {
                                            const course = courses.find((c) => c.id === id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={course?.name}
                                                    onDelete={() => toggleCourse(id)}
                                                    size="small"
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* SUBMIT */}
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<Send />}
                            disabled={isSubmitting}
                            fullWidth
                            size="small"
                        >
                            {isSubmitting ? "Sending..." : "Send Notification"}
                        </Button>
                    </Stack>
                </form>
            </Paper>

            {/* NOTIFICATIONS HISTORY */}
            <Box>
                <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                    Notification History
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", overflowX: "auto" }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "grey.50" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>Title</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>Target</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>Recipients</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>Sent At</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <TableRow key={notification.id}>
                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 }, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.title}</TableCell>
                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                            <Chip
                                                label={notification.type}
                                                size="small"
                                                color={
                                                    notification.type === "SUCCESS"
                                                        ? "success"
                                                        : notification.type === "WARNING"
                                                        ? "warning"
                                                        : notification.type === "ERROR"
                                                        ? "error"
                                                        : "info"
                                                }
                                                variant="outlined"
                                                sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>{notification.target_type}</TableCell>
                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>{notification.recipient_count}</TableCell>
                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 }, whiteSpace: "nowrap" }}>
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={loadingNotificationId === notification.id ? <CircularProgress size={16} /> : <Visibility />}
                                                onClick={() => viewNotificationHistory(notification)}
                                                disabled={loadingNotificationId === notification.id}
                                                sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                                            >
                                                {loadingNotificationId === notification.id ? "Loading..." : "View"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                            No notifications sent yet.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* STUDENT SELECTION DIALOG */}
            <Dialog
                open={showStudentDialog}
                onClose={() => setShowStudentDialog(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: { xs: 2, sm: 3 },
                            m: { xs: 1, sm: 2 },
                            maxHeight: { xs: "90vh", sm: "85vh" },
                        },
                    },
                }}
            >
                <DialogTitle sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" }, py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>Select Students</DialogTitle>
                <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 }, maxHeight: 400, overflow: "auto" }}>
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        {students.map((student) => (
                            <FormControlLabel
                                key={student.id}
                                control={
                                    <Checkbox
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        size="small"
                                    />
                                }
                                label={`${student.first_name} ${student.last_name} (${student.username})`}
                                sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                            />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 1, sm: 2 }, gap: 1 }}>
                    <Button onClick={() => setShowStudentDialog(false)} size="small">Done</Button>
                </DialogActions>
            </Dialog>

            {/* COURSE SELECTION DIALOG */}
            <Dialog
                open={showCourseDialog}
                onClose={() => setShowCourseDialog(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: { xs: 2, sm: 3 },
                            m: { xs: 1, sm: 2 },
                            maxHeight: { xs: "90vh", sm: "85vh" },
                        },
                    },
                }}
            >
                <DialogTitle sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" }, py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>Select Courses</DialogTitle>
                <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 }, maxHeight: 400, overflow: "auto" }}>
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        {courses.map((course) => (
                            <FormControlLabel
                                key={course.id}
                                control={
                                    <Checkbox
                                        checked={selectedCourses.includes(course.id)}
                                        onChange={() => toggleCourse(course.id)}
                                        size="small"
                                    />
                                }
                                label={`${course.name} (${course.code_prefix})`}
                                sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                            />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 1, sm: 2 }, gap: 1 }}>
                    <Button onClick={() => setShowCourseDialog(false)} size="small">Done</Button>
                </DialogActions>
            </Dialog>

            {/* NOTIFICATION HISTORY DIALOG */}
            <Dialog
                open={showHistoryDialog}
                onClose={() => setShowHistoryDialog(false)}
                maxWidth="md"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: { xs: 2, sm: 3 },
                            m: { xs: 1, sm: 2 },
                            maxHeight: { xs: "90vh", sm: "85vh" },
                        },
                    },
                }}
            >
                <DialogTitle sx={{ fontSize: { xs: "1.125rem", sm: "1.5rem" }, pb: { xs: 1, sm: 2 }, px: { xs: 2, sm: 3 } }}>
                    Notification History
                </DialogTitle>
                <DialogContent sx={{ overflowY: "auto", px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {selectedNotification && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, mb: 0.5 }}
                                >
                                    Title
                                </Typography>
                                <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, wordBreak: "break-word" }}>
                                    {selectedNotification.title}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, mb: 0.5 }}
                                >
                                    Message
                                </Typography>
                                <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, wordBreak: "break-word" }}>
                                    {selectedNotification.message}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, mb: 0.5 }}
                                >
                                    Target Type
                                </Typography>
                                <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                    {selectedNotification.target_type}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    mb={1}
                                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                                >
                                    Recipients ({notificationRecipients.length})
                                </Typography>
                                {loadingRecipients ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : notificationRecipients.length > 0 ? (
                                    <TableContainer sx={{ overflowX: "auto", width: "100%" }}>
                                        <Table size="small" sx={{ minWidth: { xs: 300, sm: "auto" } }}>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                                    <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 0.75, sm: 1 } }}>
                                                        Name
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 0.75, sm: 1 } }}>
                                                        Email
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 0.75, sm: 1 } }}>
                                                        Status
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {notificationRecipients.map((recipient) => (
                                                    <TableRow key={recipient.id}>
                                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 0.75, sm: 1 }, wordBreak: "break-word" }}>
                                                            {recipient.recipient_name}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 0.75, sm: 1 }, wordBreak: "break-word" }}>
                                                            {recipient.recipient_email}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 0.75, sm: 1 } }}>
                                                            <Chip
                                                                label={recipient.is_read ? "Read" : "Unread"}
                                                                size="small"
                                                                color={recipient.is_read ? "success" : "default"}
                                                                variant="outlined"
                                                                sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        No recipients found.
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: { xs: 1, sm: 2 }, gap: 1 }}>
                    <Button onClick={() => setShowHistoryDialog(false)} variant="contained" size="small">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
