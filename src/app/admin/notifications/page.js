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
import { confirmAction } from "@/utils/confirmAction";
import { Send, Visibility, CheckCircle, Inbox, SendOutlined, Delete, DeleteSweep } from "@mui/icons-material";
import { IconButton as MuiIconButton, Tooltip as MuiTooltip } from "@mui/material";

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
    const [deletingAlertId, setDeletingAlertId] = useState(null);
    const [deletingNotifId, setDeletingNotifId] = useState(null);

    const [incomingSearch, setIncomingSearch] = useState("");
    const [incomingFilterStatus, setIncomingFilterStatus] = useState("ALL");
    const [outgoingSearch, setOutgoingSearch] = useState("");
    const [outgoingFilterType, setOutgoingFilterType] = useState("ALL");
    const [outgoingFilterTarget, setOutgoingFilterTarget] = useState("ALL");
    const [studentSearch, setStudentSearch] = useState("");
    const [courseSearch, setCourseSearch] = useState("");

    const filteredAlerts = alerts.filter((alert) => {
        const matchesSearch = !incomingSearch || 
            (alert.title && alert.title.toLowerCase().includes(incomingSearch.toLowerCase())) ||
            (alert.message && alert.message.toLowerCase().includes(incomingSearch.toLowerCase())) ||
            (alert.triggered_by_username && alert.triggered_by_username.toLowerCase().includes(incomingSearch.toLowerCase())) ||
            (alert.triggered_by_name && alert.triggered_by_name.toLowerCase().includes(incomingSearch.toLowerCase()));

        const matchesStatus = incomingFilterStatus === "ALL" ||
            (incomingFilterStatus === "READ" && alert.is_read) ||
            (incomingFilterStatus === "UNREAD" && !alert.is_read);

        return matchesSearch && matchesStatus;
    });

    const filteredNotifications = notifications.filter((n) => {
        const matchesSearch = !outgoingSearch ||
            (n.title && n.title.toLowerCase().includes(outgoingSearch.toLowerCase())) ||
            (n.message && n.message.toLowerCase().includes(outgoingSearch.toLowerCase()));

        const matchesType = outgoingFilterType === "ALL" || n.type === outgoingFilterType;
        const matchesTarget = outgoingFilterTarget === "ALL" || n.target_type === outgoingFilterTarget;

        return matchesSearch && matchesType && matchesTarget;
    });

    const filteredStudentsList = students.filter((s) => {
        const term = studentSearch.toLowerCase();
        return !studentSearch ||
            (s.first_name && s.first_name.toLowerCase().includes(term)) ||
            (s.last_name && s.last_name.toLowerCase().includes(term)) ||
            (s.username && s.username.toLowerCase().includes(term));
    });

    const filteredCoursesList = courses.filter((c) => {
        const term = courseSearch.toLowerCase();
        return !courseSearch ||
            (c.name && c.name.toLowerCase().includes(term)) ||
            (c.code_prefix && c.code_prefix.toLowerCase().includes(term));
    });

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

    function handleDeleteAlert(id) {
        confirmAction(
            "Delete this alert?",
            async () => {
                setDeletingAlertId(id);
                try {
                    await api.delete(`/notifications/admin-alerts/${id}/delete/`);
                    setAlerts((prev) => prev.filter((a) => a.id !== id));
                    successToast("Alert deleted");
                } catch (error) {
                    errorToast(error, "Failed to delete alert");
                } finally {
                    setDeletingAlertId(null);
                }
            },
            null, "Delete", "Cancel", true
        );
    }

    function handleClearAllAlerts() {
        confirmAction(
            "Clear all incoming alerts? This cannot be undone.",
            async () => {
                try {
                    await api.delete("/notifications/admin-alerts/clear_all/");
                    setAlerts([]);
                    successToast("All alerts cleared");
                } catch (error) {
                    errorToast(error, "Failed to clear alerts");
                }
            },
            null, "Clear All", "Cancel", true
        );
    }

    function handleDeleteNotification(id) {
        confirmAction(
            "Delete this sent notification?",
            async () => {
                setDeletingNotifId(id);
                try {
                    await api.delete(`/notifications/${id}/`);
                    setNotifications((prev) => prev.filter((n) => n.id !== id));
                    successToast("Notification deleted");
                } catch (error) {
                    errorToast(error, "Failed to delete notification");
                } finally {
                    setDeletingNotifId(null);
                }
            },
            null, "Delete", "Cancel", true
        );
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
                                    <Inbox sx={{ color: "#7c3aed" }} />
                                    <Box>
                                        <Typography fontWeight={700}>Incoming Student Requests & Alerts</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Student attendance marks, handout payments, and assignment submissions awaiting review
                                        </Typography>
                                    </Box>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    {unreadCount > 0 && (
                                        <Button size="small" variant="outlined" onClick={handleMarkAllAlertsRead} disabled={markingAllRead}>
                                            {markingAllRead ? "Marking..." : "Mark all read"}
                                        </Button>
                                    )}
                                    {alerts.length > 0 && (
                                        <Button size="small" variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={handleClearAllAlerts} sx={{ textTransform: "none" }}>
                                            Clear All
                                        </Button>
                                    )}
                                </Stack>
                            </Box>

                             {/* Search and Filters */}
                             <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                                 <TextField
                                     placeholder="Search by student name, username, title..."
                                     value={incomingSearch}
                                     onChange={(e) => setIncomingSearch(e.target.value)}
                                     size="small"
                                     fullWidth
                                 />
                                 <TextField
                                     select
                                     label="Status"
                                     value={incomingFilterStatus}
                                     onChange={(e) => setIncomingFilterStatus(e.target.value)}
                                     size="small"
                                     sx={{ minWidth: 150 }}
                                 >
                                     <MenuItem value="ALL">All Statuses</MenuItem>
                                     <MenuItem value="UNREAD">Unread</MenuItem>
                                     <MenuItem value="READ">Read</MenuItem>
                                 </TextField>
                             </Stack>

                             {alertsLoading ? (
                                 <Box sx={{ py: 6, textAlign: "center" }}>
                                     <CircularProgress size={28} />
                                 </Box>
                             ) : filteredAlerts.length === 0 ? (
                                 <Box sx={{ py: 6, textAlign: "center" }}>
                                     <CheckCircle sx={{ fontSize: 48, color: "#16a34a", mb: 1 }} />
                                     <Typography fontWeight={600}>No requests found</Typography>
                                     <Typography variant="body2" color="text.secondary">Try adjusting your filters.</Typography>
                                 </Box>
                             ) : (
                                 <Stack divider={<Divider />}>
                                     {filteredAlerts.map((alert) => (
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
                                            <MuiIconButton size="small" color="error" onClick={() => handleDeleteAlert(alert.id)} disabled={deletingAlertId === alert.id} sx={{ flexShrink: 0 }}>
                                                {deletingAlertId === alert.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                                            </MuiIconButton>
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
                                 
                                 {/* Sent History Filters */}
                                 <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5 }}>
                                     <TextField
                                         placeholder="Search by title or message..."
                                         value={outgoingSearch}
                                         onChange={(e) => setOutgoingSearch(e.target.value)}
                                         size="small"
                                         fullWidth
                                     />
                                     <TextField
                                         select
                                         label="Filter by Type"
                                         value={outgoingFilterType}
                                         onChange={(e) => setOutgoingFilterType(e.target.value)}
                                         size="small"
                                         sx={{ minWidth: 150 }}
                                     >
                                         <MenuItem value="ALL">All Types</MenuItem>
                                         <MenuItem value="INFO">Information</MenuItem>
                                         <MenuItem value="WARNING">Warning</MenuItem>
                                         <MenuItem value="SUCCESS">Success</MenuItem>
                                         <MenuItem value="ERROR">Error</MenuItem>
                                     </TextField>
                                     <TextField
                                         select
                                         label="Filter by Target"
                                         value={outgoingFilterTarget}
                                         onChange={(e) => setOutgoingFilterTarget(e.target.value)}
                                         size="small"
                                         sx={{ minWidth: 180 }}
                                     >
                                         <MenuItem value="ALL">All Targets</MenuItem>
                                         <MenuItem value="ALL_STUDENTS">All Students</MenuItem>
                                         <MenuItem value="SPECIFIC">Specific Students</MenuItem>
                                         <MenuItem value="COURSE">By Course</MenuItem>
                                     </TextField>
                                 </Stack>

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
                                             {filteredNotifications.length > 0 ? filteredNotifications.map((n) => (
                                                 <TableRow key={n.id}>
                                                     <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</TableCell>
                                                     <TableCell>
                                                         <Chip label={n.type} size="small" color={n.type === "SUCCESS" ? "success" : n.type === "WARNING" ? "warning" : n.type === "ERROR" ? "error" : "info"} variant="outlined" />
                                                     </TableCell>
                                                     <TableCell>{n.target_type}</TableCell>
                                                     <TableCell>{n.recipient_count}</TableCell>
                                                     <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                                                     <TableCell>
                                                          <Stack direction="row" spacing={0.5} alignItems="center">
                                                              <Button
                                                                  size="small"
                                                                  variant="outlined"
                                                                  startIcon={loadingNotificationId === n.id ? <CircularProgress size={14} /> : <Visibility />}
                                                                  onClick={() => viewNotificationHistory(n)}
                                                                  disabled={loadingNotificationId === n.id}
                                                              >
                                                                  {loadingNotificationId === n.id ? "Loading..." : "View"}
                                                              </Button>
                                                              <MuiIconButton size="small" color="error" onClick={() => handleDeleteNotification(n.id)} disabled={deletingNotifId === n.id}>
                                                                  {deletingNotifId === n.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                                                              </MuiIconButton>
                                                          </Stack>
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
                    <TextField
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <Stack spacing={1}>
                        {filteredStudentsList.map((s) => (
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
                    <TextField
                        placeholder="Search courses..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <Stack spacing={1}>
                        {filteredCoursesList.map((c) => (
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
