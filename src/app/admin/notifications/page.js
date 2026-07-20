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
    Avatar,
    Divider,
    Badge,
    Tabs,
    Tab,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { successToast, errorToast } from "@/lib/toast";
import api from "@/lib/axios";
import { Send, Visibility, CheckCircle, EventAvailable, Inbox, SendOutlined } from "@mui/icons-material";

export default function AdminNotificationsPage() {
    const [tab, setTab] = useState(0);
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
    const [alerts, setAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(true);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
        defaultValues: { title: "", message: "", type: "INFO", target_type: "ALL" },
    });
    const targetType = watch("target_type");

    useEffect(() => { loadInitialData(); }, []);

    async function loadInitialData() {
        try {
            setLoading(true);
            await Promise.all([loadNotifications(), loadStudents(), loadCourses(), loadAlerts()]);
        } finally {
            setLoading(false);
        }
    }

    async function loadAlerts() {
        try {
            setAlertsLoading(true);
            const { data } = await api.get("/notifications/admin-alerts/");
            setAlerts(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Failed to load alerts:", error);
        } finally {
            setAlertsLoading(false);
        }
    }

    async function handleMarkAlertRead(id) {
        try {
            await api.post(`/notifications/admin-alerts/${id}/mark_read/`);
            setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
        } catch (error) {
            errorToast(error, "Failed to mark as read");
        }
    }

    async function handleMarkAllAlertsRead() {
        setMarkingAllRead(true);
        try {
            await api.post("/notifications/admin-alerts/mark_all_read/");
            setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
            successToast("All alerts marked as read");
        } catch (error) {
            errorToast(error, "Failed to mark all as read");
        } finally {
            setMarkingAllRead(false);
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
        } catch { }
    }

    async function loadCourses() {
        try {
            const { data } = await api.get("/courses/");
            setCourses(Array.isArray(data) ? data : data.results || []);
        } catch { }
    }

    async function onSubmit(values) {
        try {
            const payload = { title: values.title, message: values.message, type: values.type, target_type: values.target_type };
            if (values.target_type === "SPECIFIC") payload.student_ids = selectedStudents;
            else if (values.target_type === "COURSE") payload.course_ids = selectedCourses;
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

    const toggleStudent = (id) => setSelectedStudents((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
    const toggleCourse = (id) => setSelectedCourses((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

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

    const unreadCount = alerts.filter((a) => !a.is_read).length;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {loading && (
                <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(2px)" }}>
                    <Box sx={{ bgcolor: "background.paper", borderRadius: 3, p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <CircularProgress size={48} />
                        <Typography>Loading notifications...</Typography>
                    </Box>
                </Box>
            )}

            <Box>
                <Typography variant="h4" fontWeight={700}>Notifications</Typography>
                <Typography color="text.secondary">Manage incoming alerts and send announcements to students.</Typography>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: "1px solid", borderColor: "grey.200", px: 2 }}
                >
                    <Tab
                        label={
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Inbox fontSize="small" />
                                Incoming
                                {unreadCount > 0 && (
                                    <Chip label={unreadCount} size="small" color="error" sx={{ height: 20, fontSize: "0.7rem", ml: 0.5 }} />
                                )}
                            </span>
                        }
                    />
                    <Tab
                        label={
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <SendOutlined fontSize="small" />
                                Outgoing
                                {notifications.length > 0 && (
                                    <Chip label={notifications.length} size="small" color="default" sx={{ height: 20, fontSize: "0.7rem", ml: 0.5 }} />
                                )}
                            </span>
                        }
                    />
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* INCOMING TAB */}
                    {tab === 0 && (
                        <Box>
                            {/* Header row */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <EventAvailable sx={{ color: "#7c3aed" }} />
                                    <Box>
                                        <Typography fontWeight={700}>Attendance Requests</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Student attendance marks awaiting your review
                                        </Typography>
                                    </Box>
                                </Box>
                                {unreadCount > 0 && (
                                    <Button size="small" variant="outlined" onClick={handleMarkAllAlertsRead} disabled={markingAllRead}>
                                        {markingAllRead ? "Marking..." : "Mark all read"}
                                    </Button>
                                )}
                            </Box>

                            {alertsLoading ? (
                                <Box sx={{ py: 6, textAlign: "center" }}>
                                    <CircularProgress size={28} />
                                </Box>
                            ) : alerts.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: "center" }}>
                                    <CheckCircle sx={{ fontSize: 48, color: "#16a34a", mb: 1 }} />
                                    <Typography fontWeight={600}>All caught up!</Typography>
                                    <Typography variant="body2" color="text.secondary">No attendance requests yet.</Typography>
                                </Box>
                            ) : (
                                <Stack divider={<Divider />}>
                                    {alerts.map((alert) => (
                                        <Box
                                            key={alert.id}
                                            sx={{
                                                py: 2,
                                                display: "flex",
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                gap: 2,
                                                bgcolor: alert.is_read ? "transparent" : "#faf5ff",
                                                borderRadius: 2,
                                                px: 1,
                                                transition: "background 0.2s",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                                <Avatar sx={{ bgcolor: alert.is_read ? "#e5e7eb" : "#7c3aed", width: 40, height: 40, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                                                    {alert.triggered_by_name?.charAt(0) || alert.triggered_by_username?.charAt(0) || "S"}
                                                </Avatar>
                                                <Box>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                                                        <Typography variant="body2" fontWeight={700}>{alert.title}</Typography>
                                                        {!alert.is_read && (
                                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#7c3aed", flexShrink: 0 }} />
                                                        )}
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{alert.message}</Typography>
                                                    <Typography variant="caption" color="text.disabled">
                                                        {new Date(alert.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {!alert.is_read && (
                                                <Button size="small" variant="text" onClick={() => handleMarkAlertRead(alert.id)} sx={{ flexShrink: 0, color: "#7c3aed", fontSize: "0.75rem" }}>
                                                    Mark read
                                                </Button>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* OUTGOING TAB */}
                    {tab === 1 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {/* Send Form */}
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} mb={2}>Send Notification</Typography>
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <Stack spacing={2.5}>
                                        <Controller
                                            name="title"
                                            control={control}
                                            rules={{ required: "Title is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField {...field} label="Notification Title" fullWidth size="small" error={!!error} helperText={error?.message} />
                                            )}
                                        />
                                        <Controller
                                            name="message"
                                            control={control}
                                            rules={{ required: "Message is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField {...field} label="Message" fullWidth multiline rows={4} size="small" error={!!error} helperText={error?.message} />
                                            )}
                                        />
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} select label="Notification Type" fullWidth size="small">
                                                    <MenuItem value="INFO">Information</MenuItem>
                                                    <MenuItem value="WARNING">Warning</MenuItem>
                                                    <MenuItem value="SUCCESS">Success</MenuItem>
                                                    <MenuItem value="ERROR">Error</MenuItem>
                                                </TextField>
                                            )}
                                        />
                                        <Controller
                                            name="target_type"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} select label="Send To" fullWidth size="small">
                                                    <MenuItem value="ALL">All Students</MenuItem>
                                                    <MenuItem value="SPECIFIC">Specific Students</MenuItem>
                                                    <MenuItem value="COURSE">By Course</MenuItem>
                                                </TextField>
                                            )}
                                        />
                                        {targetType === "SPECIFIC" && (
                                            <Box>
                                                <Button variant="outlined" onClick={() => setShowStudentDialog(true)} fullWidth size="small">
                                                    Select Students ({selectedStudents.length})
                                                </Button>
                                                {selectedStudents.length > 0 && (
                                                    <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                        {selectedStudents.map((id) => {
                                                            const s = students.find((s) => s.id === id);
                                                            return <Chip key={id} label={`${s?.first_name} ${s?.last_name}`} onDelete={() => toggleStudent(id)} size="small" />;
                                                        })}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                        {targetType === "COURSE" && (
                                            <Box>
                                                <Button variant="outlined" onClick={() => setShowCourseDialog(true)} fullWidth size="small">
                                                    Select Courses ({selectedCourses.length})
                                                </Button>
                                                {selectedCourses.length > 0 && (
                                                    <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                        {selectedCourses.map((id) => {
                                                            const c = courses.find((c) => c.id === id);
                                                            return <Chip key={id} label={c?.name} onDelete={() => toggleCourse(id)} size="small" />;
                                                        })}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                        <Button type="submit" variant="contained" startIcon={<Send />} disabled={isSubmitting} size="small">
                                            {isSubmitting ? "Sending..." : "Send Notification"}
                                        </Button>
                                    </Stack>
                                </form>
                            </Box>

                            <Divider />

                            {/* Sent History */}
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} mb={2}>Sent History</Typography>
                                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: "grey.50" }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Target</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Recipients</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Sent At</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {notifications.length > 0 ? notifications.map((n) => (
                                                <TableRow key={n.id}>
                                                    <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</TableCell>
                                                    <TableCell>
                                                        <Chip label={n.type} size="small" color={n.type === "SUCCESS" ? "success" : n.type === "WARNING" ? "warning" : n.type === "ERROR" ? "error" : "info"} variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>{n.target_type}</TableCell>
                                                    <TableCell>{n.recipient_count}</TableCell>
                                                    <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={loadingNotificationId === n.id ? <CircularProgress size={14} /> : <Visibility />}
                                                            onClick={() => viewNotificationHistory(n)}
                                                            disabled={loadingNotificationId === n.id}
                                                        >
                                                            {loadingNotificationId === n.id ? "Loading..." : "View"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                        <Typography color="text.secondary">No notifications sent yet.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* STUDENT SELECTION DIALOG */}
            <Dialog open={showStudentDialog} onClose={() => setShowStudentDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, m: 2, maxHeight: "85vh" } } }}>
                <DialogTitle>Select Students</DialogTitle>
                <DialogContent sx={{ maxHeight: 400, overflow: "auto" }}>
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        {students.map((s) => (
                            <FormControlLabel
                                key={s.id}
                                control={<Checkbox checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} size="small" />}
                                label={`${s.first_name} ${s.last_name} (${s.username})`}
                            />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setShowStudentDialog(false)}>Done</Button></DialogActions>
            </Dialog>

            {/* COURSE SELECTION DIALOG */}
            <Dialog open={showCourseDialog} onClose={() => setShowCourseDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, m: 2, maxHeight: "85vh" } } }}>
                <DialogTitle>Select Courses</DialogTitle>
                <DialogContent sx={{ maxHeight: 400, overflow: "auto" }}>
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        {courses.map((c) => (
                            <FormControlLabel
                                key={c.id}
                                control={<Checkbox checked={selectedCourses.includes(c.id)} onChange={() => toggleCourse(c.id)} size="small" />}
                                label={`${c.name} (${c.code_prefix})`}
                            />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setShowCourseDialog(false)}>Done</Button></DialogActions>
            </Dialog>

            {/* HISTORY DIALOG */}
            <Dialog open={showHistoryDialog} onClose={() => setShowHistoryDialog(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, m: 2, maxHeight: "85vh" } } }}>
                <DialogTitle>Notification Details</DialogTitle>
                <DialogContent sx={{ overflowY: "auto" }}>
                    {selectedNotification && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Title</Typography>
                                <Typography>{selectedNotification.title}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Message</Typography>
                                <Typography sx={{ wordBreak: "break-word" }}>{selectedNotification.message}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Target</Typography>
                                <Typography>{selectedNotification.target_type}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={1}>Recipients ({notificationRecipients.length})</Typography>
                                {loadingRecipients ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>
                                ) : notificationRecipients.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {notificationRecipients.map((r) => (
                                                    <TableRow key={r.id}>
                                                        <TableCell>{r.recipient_name}</TableCell>
                                                        <TableCell sx={{ wordBreak: "break-word" }}>{r.recipient_email}</TableCell>
                                                        <TableCell>
                                                            <Chip label={r.is_read ? "Read" : "Unread"} size="small" color={r.is_read ? "success" : "default"} variant="outlined" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography color="text.secondary">No recipients found.</Typography>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowHistoryDialog(false)} variant="contained" size="small">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
