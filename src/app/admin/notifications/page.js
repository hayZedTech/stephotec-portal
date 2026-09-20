"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
    Tabs,
    Tab,
    TablePagination,
    InputAdornment,
    Card,
    CardContent,
    Grid,
    IconButton as MuiIconButton,
    Tooltip as MuiTooltip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { successToast, errorToast } from "@/lib/toast";
import api from "@/lib/axios";
import { confirmAction } from "@/utils/confirmAction";
import {
    Send,
    Visibility,
    CheckCircle,
    Inbox,
    SendOutlined,
    Delete,
    DeleteSweep,
    ArrowForward,
    EventAvailable,
    Payment,
    Assignment,
    Quiz,
    People,
    FolderShared,
    WorkspacePremium,
    Schedule,
    Email,
    Close,
    Groups,
    Search,
    FilterList,
    RestartAlt,
    Refresh,
    NotificationsActive,
    Person,
} from "@mui/icons-material";

function getAlertActionMeta(alert) {
    const title = (alert.title || "").toLowerCase();
    const msg = (alert.message || "").toLowerCase();
    const type = (alert.alert_type || "").toUpperCase();

    if (type.includes("LECTURE") || type.includes("SCHEDULE") || title.includes("lecture") || title.includes("schedule") || msg.includes("lecture")) {
        return {
            label: "Open Timetable",
            url: "/admin/schedule",
            icon: <Schedule sx={{ fontSize: 16 }} />,
            color: "primary",
        };
    }
    if (type.includes("ATTENDANCE") || title.includes("attendance") || msg.includes("attendance")) {
        return {
            label: "Review Attendance",
            url: "/dashboard/admin/learning?tab=attendance",
            icon: <EventAvailable sx={{ fontSize: 16 }} />,
            color: "success",
        };
    }
    if (type.includes("PAYMENT") || title.includes("payment") || msg.includes("payment") || title.includes("handout") || msg.includes("handout") || msg.includes("₦")) {
        return {
            label: "Review Payments",
            url: "/admin/payments",
            icon: <Payment sx={{ fontSize: 16 }} />,
            color: "primary",
        };
    }
    if (type.includes("ASSIGNMENT") || title.includes("assignment") || msg.includes("assignment") || msg.includes("submission")) {
        return {
            label: "View Assignments",
            url: "/dashboard/admin/learning",
            icon: <Assignment sx={{ fontSize: 16 }} />,
            color: "secondary",
        };
    }
    if (type.includes("QUIZ") || title.includes("quiz") || msg.includes("quiz") || title.includes("assessment")) {
        return {
            label: "Manage Quizzes",
            url: "/admin/quizzes",
            icon: <Quiz sx={{ fontSize: 16 }} />,
            color: "warning",
        };
    }
    if (title.includes("certificate") || msg.includes("certificate")) {
        return {
            label: "Manage Certificates",
            url: "/dashboard/admin/learning?tab=certificates",
            icon: <WorkspacePremium sx={{ fontSize: 16 }} />,
            color: "warning",
        };
    }
    if (title.includes("student") || msg.includes("registration") || msg.includes("profile") || msg.includes("activation")) {
        return {
            label: "View Students",
            url: "/admin/students",
            icon: <People sx={{ fontSize: 16 }} />,
            color: "info",
        };
    }
    if (title.includes("material") || title.includes("class file") || msg.includes("file") || msg.includes("code")) {
        return {
            label: "Manage Class Files",
            url: "/dashboard/admin/learning?tab=files",
            icon: <FolderShared sx={{ fontSize: 16 }} />,
            color: "primary",
        };
    }
    return null;
}

function formatTargetType(target) {
    if (target === "ALL" || target === "ALL_STUDENTS") return "All Students";
    if (target === "SPECIFIC") return "Specific Students";
    if (target === "COURSE") return "By Course";
    if (target === "GROUP") return "By Group";
    return target || "N/A";
}

export default function AdminNotificationsPage() {
    const router = useRouter();
    const [tab, setTab] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);

    // Metadata lists
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);

    // Selection dialog states for form
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [showStudentDialog, setShowStudentDialog] = useState(false);
    const [showCourseDialog, setShowCourseDialog] = useState(false);
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");
    const [courseSearch, setCourseSearch] = useState("");
    const [groupSearch, setGroupSearch] = useState("");

    // Details & action dialogs
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [viewingAlert, setViewingAlert] = useState(null);
    const [notificationRecipients, setNotificationRecipients] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [loadingNotificationId, setLoadingNotificationId] = useState(null);
    const [deletingAlertId, setDeletingAlertId] = useState(null);
    const [deletingNotifId, setDeletingNotifId] = useState(null);
    const [markingAllRead, setMarkingAllRead] = useState(false);
    const [sendingType, setSendingType] = useState(null); // "NOTIF_ONLY" | "NOTIF_EMAIL"

    // --- INCOMING ALERTS STATE ---
    const [alerts, setAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(true);
    const [incomingSearch, setIncomingSearch] = useState("");
    const [incomingFilterStatus, setIncomingFilterStatus] = useState("ALL");
    const [incomingFilterType, setIncomingFilterType] = useState("ALL");
    const [incomingFilterStudent, setIncomingFilterStudent] = useState("ALL");
    const [incomingPage, setIncomingPage] = useState(0);
    const [incomingRowsPerPage, setIncomingRowsPerPage] = useState(10);

    // --- OUTGOING NOTIFICATIONS STATE (Server-side paginated & filtered) ---
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [totalOutgoingCount, setTotalOutgoingCount] = useState(0);
    const [outgoingPage, setOutgoingPage] = useState(0);
    const [outgoingRowsPerPage, setOutgoingRowsPerPage] = useState(15);
    const [outgoingSearch, setOutgoingSearch] = useState("");
    const [debouncedOutgoingSearch, setDebouncedOutgoingSearch] = useState("");
    const [outgoingFilterType, setOutgoingFilterType] = useState("ALL");
    const [outgoingFilterTarget, setOutgoingFilterTarget] = useState("ALL");
    const [outgoingFilterGroup, setOutgoingFilterGroup] = useState("ALL");
    const [outgoingFilterStudent, setOutgoingFilterStudent] = useState("ALL");
    const [outgoingFilterChannel, setOutgoingFilterChannel] = useState("ALL");

    // Debounce search input for outgoing notifications
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedOutgoingSearch(outgoingSearch);
        }, 350);
        return () => clearTimeout(handler);
    }, [outgoingSearch]);

    // React Hook Form for sending notifications
    const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
        defaultValues: { title: "", message: "", type: "INFO", target_type: "ALL" },
    });
    const targetType = watch("target_type");

    // Load initial data
    useEffect(() => {
        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadInitialData() {
        try {
            setInitialLoading(true);
            await Promise.all([
                loadStudents(),
                loadCourses(),
                loadGroups(),
                loadAlerts(),
            ]);
        } finally {
            setInitialLoading(false);
        }
    }

    async function loadStudents() {
        try {
            const { data } = await api.get("/admin/students/");
            setStudents(Array.isArray(data) ? data : data.results || []);
        } catch {}
    }

    async function loadCourses() {
        try {
            const { data } = await api.get("/courses/");
            setCourses(Array.isArray(data) ? data : data.results || []);
        } catch {}
    }

    async function loadGroups() {
        try {
            const { data } = await api.get("/admin/groups/");
            setGroups(Array.isArray(data) ? data : data.results || []);
        } catch {}
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

    // Load outgoing notifications from backend with pagination and filters
    const fetchOutgoingNotifications = useCallback(async (pageIndex, pageSize, search, type, target, channel, group, student) => {
        setNotificationsLoading(true);
        try {
            const params = {
                page: pageIndex + 1,
                page_size: pageSize,
            };
            if (search && search.trim()) params.search = search.trim();
            if (type && type !== "ALL") params.type = type;
            if (target && target !== "ALL") params.target_type = target;
            if (channel && channel !== "ALL") params.channel = channel;
            if (group && group !== "ALL") params.group_id = group;
            if (student && student !== "ALL") params.student_id = student;

            const { data } = await api.get("/notifications/", { params });
            if (Array.isArray(data)) {
                setNotifications(data);
                setTotalOutgoingCount(data.length);
            } else if (data && Array.isArray(data.results)) {
                setNotifications(data.results);
                setTotalOutgoingCount(data.count ?? data.results.length);
            } else {
                setNotifications([]);
                setTotalOutgoingCount(0);
            }
        } catch (error) {
            errorToast(error, "Failed to load notifications");
        } finally {
            setNotificationsLoading(false);
        }
    }, []);

    // Trigger fetching notifications whenever pagination or filter parameters change
    useEffect(() => {
        fetchOutgoingNotifications(
            outgoingPage,
            outgoingRowsPerPage,
            debouncedOutgoingSearch,
            outgoingFilterType,
            outgoingFilterTarget,
            outgoingFilterChannel,
            outgoingFilterGroup,
            outgoingFilterStudent
        );
    }, [
        outgoingPage,
        outgoingRowsPerPage,
        debouncedOutgoingSearch,
        outgoingFilterType,
        outgoingFilterTarget,
        outgoingFilterChannel,
        outgoingFilterGroup,
        outgoingFilterStudent,
        fetchOutgoingNotifications,
    ]);

    // Handle alert actions
    async function handleMarkAlertRead(id) {
        try {
            await api.post(`/notifications/admin-alerts/${id}/mark_read/`);
            setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
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
            null,
            "Delete",
            "Cancel",
            true
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
            null,
            "Clear All",
            "Cancel",
            true
        );
    }

    function handleDeleteNotification(id) {
        confirmAction(
            "Delete this sent notification?",
            async () => {
                setDeletingNotifId(id);
                try {
                    await api.delete(`/notifications/${id}/`);
                    successToast("Notification deleted");
                    fetchOutgoingNotifications(
                        outgoingPage,
                        outgoingRowsPerPage,
                        debouncedOutgoingSearch,
                        outgoingFilterType,
                        outgoingFilterTarget,
                        outgoingFilterChannel,
                        outgoingFilterGroup,
                        outgoingFilterStudent
                    );
                } catch (error) {
                    errorToast(error, "Failed to delete notification");
                } finally {
                    setDeletingNotifId(null);
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    }

    async function handleSendNotification(sendEmail = false) {
        handleSubmit(async (values) => {
            if (values.target_type === "SPECIFIC" && selectedStudents.length === 0) {
                errorToast(null, "Please select at least one student.");
                return;
            }
            if (values.target_type === "COURSE" && selectedCourses.length === 0) {
                errorToast(null, "Please select at least one course.");
                return;
            }
            if (values.target_type === "GROUP" && selectedGroups.length === 0) {
                errorToast(null, "Please select at least one group.");
                return;
            }

            setSendingType(sendEmail ? "NOTIF_EMAIL" : "NOTIF_ONLY");
            try {
                const payload = {
                    title: values.title,
                    message: values.message,
                    type: values.type,
                    target_type: values.target_type,
                    send_email: Boolean(sendEmail),
                };
                if (values.target_type === "SPECIFIC") payload.student_ids = selectedStudents;
                else if (values.target_type === "COURSE") payload.course_ids = selectedCourses;
                else if (values.target_type === "GROUP") payload.group_ids = selectedGroups;

                await api.post("/notifications/", payload);
                if (sendEmail) {
                    successToast("Notification and emails sent successfully!");
                } else {
                    successToast("Platform notification sent successfully!");
                }
                reset();
                setSelectedStudents([]);
                setSelectedCourses([]);
                setSelectedGroups([]);
                setOutgoingPage(0);
                fetchOutgoingNotifications(
                    0,
                    outgoingRowsPerPage,
                    debouncedOutgoingSearch,
                    outgoingFilterType,
                    outgoingFilterTarget,
                    outgoingFilterChannel,
                    outgoingFilterGroup,
                    outgoingFilterStudent
                );
            } catch (error) {
                errorToast(error, sendEmail ? "Failed to send notification and emails" : "Failed to send notification");
            } finally {
                setSendingType(null);
            }
        })();
    }

    const toggleStudent = (id) => setSelectedStudents((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
    const toggleCourse = (id) => setSelectedCourses((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
    const toggleGroup = (id) => setSelectedGroups((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);

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

    // --- FILTERED INCOMING ALERTS (Client-side search + filter + pagination) ---
    const filteredAlerts = useMemo(() => {
        return alerts.filter((alert) => {
            if (incomingSearch) {
                const term = incomingSearch.toLowerCase();
                const matches =
                    (alert.title && alert.title.toLowerCase().includes(term)) ||
                    (alert.message && alert.message.toLowerCase().includes(term)) ||
                    (alert.triggered_by_username && alert.triggered_by_username.toLowerCase().includes(term)) ||
                    (alert.triggered_by_name && alert.triggered_by_name.toLowerCase().includes(term));
                if (!matches) return false;
            }

            if (incomingFilterStatus === "READ" && !alert.is_read) return false;
            if (incomingFilterStatus === "UNREAD" && alert.is_read) return false;

            if (incomingFilterType !== "ALL") {
                const type = (alert.alert_type || "").toUpperCase();
                const title = (alert.title || "").toUpperCase();
                const msg = (alert.message || "").toUpperCase();
                if (incomingFilterType === "ATTENDANCE" && !type.includes("ATTENDANCE") && !title.includes("ATTENDANCE") && !msg.includes("ATTENDANCE")) return false;
                if (incomingFilterType === "PAYMENT" && !type.includes("PAYMENT") && !title.includes("PAYMENT") && !title.includes("HANDOUT") && !msg.includes("HANDOUT") && !msg.includes("₦")) return false;
                if (incomingFilterType === "ASSIGNMENT" && !type.includes("ASSIGNMENT") && !title.includes("ASSIGNMENT") && !msg.includes("ASSIGNMENT")) return false;
                if (incomingFilterType === "QUIZ" && !type.includes("QUIZ") && !title.includes("QUIZ") && !msg.includes("QUIZ")) return false;
                if (incomingFilterType === "CERTIFICATE" && !type.includes("CERTIFICATE") && !title.includes("CERTIFICATE") && !msg.includes("CERTIFICATE")) return false;
                if (incomingFilterType === "STUDENT" && !title.includes("STUDENT") && !title.includes("PROFILE") && !title.includes("REGISTRATION")) return false;
            }

            if (incomingFilterStudent !== "ALL") {
                if (String(alert.triggered_by) !== String(incomingFilterStudent) &&
                    String(alert.triggered_by_username) !== String(incomingFilterStudent)) {
                    return false;
                }
            }

            return true;
        });
    }, [alerts, incomingSearch, incomingFilterStatus, incomingFilterType, incomingFilterStudent]);

    // Paginated slice for incoming alerts
    const paginatedAlerts = useMemo(() => {
        const start = incomingPage * incomingRowsPerPage;
        return filteredAlerts.slice(start, start + incomingRowsPerPage);
    }, [filteredAlerts, incomingPage, incomingRowsPerPage]);

    // Selection lists search filters
    const filteredStudentsList = useMemo(() => {
        const term = studentSearch.toLowerCase();
        return students.filter((s) =>
            !studentSearch ||
            (s.first_name && s.first_name.toLowerCase().includes(term)) ||
            (s.last_name && s.last_name.toLowerCase().includes(term)) ||
            (s.username && s.username.toLowerCase().includes(term)) ||
            (s.email && s.email.toLowerCase().includes(term))
        );
    }, [students, studentSearch]);

    const filteredCoursesList = useMemo(() => {
        const term = courseSearch.toLowerCase();
        return courses.filter((c) =>
            !courseSearch ||
            (c.name && c.name.toLowerCase().includes(term)) ||
            (c.code_prefix && c.code_prefix.toLowerCase().includes(term))
        );
    }, [courses, courseSearch]);

    const filteredGroupsList = useMemo(() => {
        const term = groupSearch.toLowerCase();
        return groups.filter((g) =>
            !groupSearch ||
            (g.name && g.name.toLowerCase().includes(term)) ||
            (g.description && g.description.toLowerCase().includes(term)) ||
            (g.course_name && g.course_name.toLowerCase().includes(term))
        );
    }, [groups, groupSearch]);

    // Summary counts
    const unreadCount = useMemo(() => alerts.filter((a) => !a.is_read).length, [alerts]);
    const attendanceAlertCount = useMemo(() => alerts.filter((a) => {
        const t = (a.alert_type || "").toUpperCase() + (a.title || "").toUpperCase();
        return t.includes("ATTENDANCE");
    }).length, [alerts]);

    // Filter reset handlers
    const handleResetIncomingFilters = () => {
        setIncomingSearch("");
        setIncomingFilterStatus("ALL");
        setIncomingFilterType("ALL");
        setIncomingFilterStudent("ALL");
        setIncomingPage(0);
    };

    const handleResetOutgoingFilters = () => {
        setOutgoingSearch("");
        setOutgoingFilterType("ALL");
        setOutgoingFilterTarget("ALL");
        setOutgoingFilterGroup("ALL");
        setOutgoingFilterStudent("ALL");
        setOutgoingFilterChannel("ALL");
        setOutgoingPage(0);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {initialLoading && (
                <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(2px)" }}>
                    <Box sx={{ bgcolor: "background.paper", borderRadius: 3, p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, boxShadow: 24 }}>
                        <CircularProgress size={44} />
                        <Typography fontWeight={600}>Loading notifications center...</Typography>
                    </Box>
                </Box>
            )}

            {/* Header & Page Title */}
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: "-0.5px" }}>
                        Notifications & Alerts Center
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        Monitor incoming student requests, manage alerts, and broadcast announcements across groups and courses.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Refresh />}
                        onClick={() => {
                            loadAlerts();
                            fetchOutgoingNotifications(
                                outgoingPage,
                                outgoingRowsPerPage,
                                debouncedOutgoingSearch,
                                outgoingFilterType,
                                outgoingFilterTarget,
                                outgoingFilterChannel,
                                outgoingFilterGroup,
                                outgoingFilterStudent
                            );
                            successToast("Refreshed notification feeds");
                        }}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                        Refresh Feeds
                    </Button>
                </Stack>
            </Box>

            {/* Overview Summary Stat Cards */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 3, bgcolor: "background.paper", p: 0.5 }}>
                        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: "16px !important" }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Inbox />
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
                                    {unreadCount}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    Unread Student Alerts
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 3, bgcolor: "background.paper", p: 0.5 }}>
                        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: "16px !important" }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <EventAvailable />
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
                                    {attendanceAlertCount}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    Attendance Actions
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 3, bgcolor: "background.paper", p: 0.5 }}>
                        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: "16px !important" }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <SendOutlined />
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
                                    {totalOutgoingCount}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    Total Sent Notifications
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 3, bgcolor: "background.paper", p: 0.5 }}>
                        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: "16px !important" }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Groups />
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
                                    {groups.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    Available Student Groups
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Tabs Container */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: "1px solid", borderColor: "grey.200", px: 2, bgcolor: "grey.50" }}
                >
                    <Tab
                        label={
                            <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                                <Inbox fontSize="small" />
                                Incoming Alerts
                                {unreadCount > 0 && (
                                    <Chip label={unreadCount} size="small" color="error" sx={{ height: 20, fontSize: "0.7rem", ml: 0.5 }} />
                                )}
                            </span>
                        }
                    />
                    <Tab
                        label={
                            <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                                <SendOutlined fontSize="small" />
                                Outgoing Announcements
                                {totalOutgoingCount > 0 && (
                                    <Chip label={totalOutgoingCount} size="small" color="default" sx={{ height: 20, fontSize: "0.7rem", ml: 0.5 }} />
                                )}
                            </span>
                        }
                    />
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* ============================================================== */}
                    {/* TAB 0: INCOMING REQUESTS & ALERTS                              */}
                    {/* ============================================================== */}
                    {tab === 0 && (
                        <Box>
                            {/* Header row with bulk actions */}
                            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 3, gap: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Inbox sx={{ color: "#7c3aed" }} />
                                    <Box>
                                        <Typography fontWeight={700}>Incoming Student Requests & System Alerts</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Student attendance marks, handout payments, and assignment submissions awaiting review ({filteredAlerts.length} total)
                                        </Typography>
                                    </Box>
                                </Box>
                                <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}>
                                    {unreadCount > 0 && (
                                        <Button size="small" variant="outlined" onClick={handleMarkAllAlertsRead} disabled={markingAllRead} sx={{ textTransform: "none", borderRadius: 2 }}>
                                            {markingAllRead ? "Marking..." : "Mark all read"}
                                        </Button>
                                    )}
                                    {alerts.length > 0 && (
                                        <Button size="small" variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={handleClearAllAlerts} sx={{ textTransform: "none", borderRadius: 2 }}>
                                            Clear All
                                        </Button>
                                    )}
                                </Stack>
                            </Box>

                            {/* Search and Filters Bar */}
                            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200", borderRadius: 2.5 }}>
                                <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            placeholder="Search by student name, username, title..."
                                            value={incomingSearch}
                                            onChange={(e) => {
                                                setIncomingSearch(e.target.value);
                                                setIncomingPage(0);
                                            }}
                                            size="small"
                                            fullWidth
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: incomingSearch ? (
                                                        <InputAdornment position="end">
                                                            <MuiIconButton size="small" onClick={() => { setIncomingSearch(""); setIncomingPage(0); }}>
                                                                <Close fontSize="small" />
                                                            </MuiIconButton>
                                                        </InputAdornment>
                                                    ) : null,
                                                },
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                                        <TextField
                                            select
                                            label="Alert Category"
                                            value={incomingFilterType}
                                            onChange={(e) => {
                                                setIncomingFilterType(e.target.value);
                                                setIncomingPage(0);
                                            }}
                                            size="small"
                                            fullWidth
                                        >
                                            <MenuItem value="ALL">All Categories</MenuItem>
                                            <MenuItem value="ATTENDANCE">Attendance Marks</MenuItem>
                                            <MenuItem value="PAYMENT">Handout & Payments</MenuItem>
                                            <MenuItem value="ASSIGNMENT">Assignments</MenuItem>
                                            <MenuItem value="QUIZ">Quizzes & Tests</MenuItem>
                                            <MenuItem value="CERTIFICATE">Certificates</MenuItem>
                                            <MenuItem value="STUDENT">Student Profiles</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                        <TextField
                                            select
                                            label="Status"
                                            value={incomingFilterStatus}
                                            onChange={(e) => {
                                                setIncomingFilterStatus(e.target.value);
                                                setIncomingPage(0);
                                            }}
                                            size="small"
                                            fullWidth
                                        >
                                            <MenuItem value="ALL">All Statuses</MenuItem>
                                            <MenuItem value="UNREAD">Unread Only</MenuItem>
                                            <MenuItem value="READ">Read</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                                        <TextField
                                            select
                                            label="Filter by Student"
                                            value={incomingFilterStudent}
                                            onChange={(e) => {
                                                setIncomingFilterStudent(e.target.value);
                                                setIncomingPage(0);
                                            }}
                                            size="small"
                                            fullWidth
                                        >
                                            <MenuItem value="ALL">All Students</MenuItem>
                                            {students.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    {s.first_name} {s.last_name} ({s.username})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <MuiTooltip title="Reset all incoming filters">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleResetIncomingFilters}
                                                startIcon={<RestartAlt />}
                                                sx={{ textTransform: "none", minWidth: { xs: "100%", md: "auto" }, whiteSpace: "nowrap" }}
                                            >
                                                Reset
                                            </Button>
                                        </MuiTooltip>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Alert Items List */}
                            {alertsLoading ? (
                                <Box sx={{ py: 8, textAlign: "center" }}>
                                    <CircularProgress size={32} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Loading alert requests...
                                    </Typography>
                                </Box>
                            ) : paginatedAlerts.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: "center" }}>
                                    <CheckCircle sx={{ fontSize: 48, color: "#16a34a", mb: 1 }} />
                                    <Typography fontWeight={600}>No requests or alerts found</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {incomingSearch || incomingFilterStatus !== "ALL" || incomingFilterType !== "ALL" || incomingFilterStudent !== "ALL"
                                            ? "Try adjusting your search terms or filters."
                                            : "You are all caught up! No incoming alerts at this time."}
                                    </Typography>
                                    {(incomingSearch || incomingFilterStatus !== "ALL" || incomingFilterType !== "ALL" || incomingFilterStudent !== "ALL") && (
                                        <Button variant="outlined" size="small" onClick={handleResetIncomingFilters} sx={{ mt: 2, textTransform: "none" }}>
                                            Reset Filters
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Stack divider={<Divider />} sx={{ minHeight: 300 }}>
                                    {paginatedAlerts.map((alert) => (
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
                                                px: 1.5,
                                                transition: "background 0.2s",
                                                "&:hover": { bgcolor: alert.is_read ? "grey.50" : "#f5edff" },
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1, minWidth: 0 }}>
                                                <Avatar sx={{ bgcolor: alert.is_read ? "#e5e7eb" : "#7c3aed", color: alert.is_read ? "#4b5563" : "#fff", width: 40, height: 40, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                                                    {alert.triggered_by_name?.charAt(0) || alert.triggered_by_username?.charAt(0) || "S"}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25, flexWrap: "wrap" }}>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {alert.title}
                                                        </Typography>
                                                        {!alert.is_read && (
                                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#7c3aed", flexShrink: 0 }} />
                                                        )}
                                                        {alert.alert_type && (
                                                            <Chip
                                                                label={alert.alert_type}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                                                            />
                                                        )}
                                                        {alert.triggered_by_username && (
                                                            <Chip
                                                                icon={<Person sx={{ fontSize: "12px !important" }} />}
                                                                label={`${alert.triggered_by_name || alert.triggered_by_username}`}
                                                                size="small"
                                                                sx={{ height: 18, fontSize: "0.65rem" }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, wordBreak: "break-word" }}>
                                                        {alert.message}
                                                    </Typography>

                                                    {/* Navigation shortcut button */}
                                                    {(() => {
                                                        const actionMeta = getAlertActionMeta(alert);
                                                        if (!actionMeta) return null;
                                                        return (
                                                            <Box sx={{ mb: 1 }}>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color={actionMeta.color}
                                                                    startIcon={actionMeta.icon}
                                                                    endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                                                                    onClick={() => {
                                                                        if (!alert.is_read) handleMarkAlertRead(alert.id);
                                                                        router.push(actionMeta.url);
                                                                    }}
                                                                    sx={{
                                                                        textTransform: "none",
                                                                        borderRadius: 2,
                                                                        fontSize: "0.75rem",
                                                                        fontWeight: 700,
                                                                        py: 0.25,
                                                                        px: 1.25,
                                                                    }}
                                                                >
                                                                    {actionMeta.label}
                                                                </Button>
                                                            </Box>
                                                        );
                                                    })()}

                                                    <Typography variant="caption" color="text.disabled">
                                                        {new Date(alert.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Action Column */}
                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <MuiTooltip title="View full alert">
                                                        <MuiIconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => {
                                                                setViewingAlert(alert);
                                                                if (!alert.is_read) handleMarkAlertRead(alert.id);
                                                            }}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </MuiIconButton>
                                                    </MuiTooltip>
                                                    <MuiTooltip title="Delete alert">
                                                        <MuiIconButton size="small" color="error" onClick={() => handleDeleteAlert(alert.id)} disabled={deletingAlertId === alert.id}>
                                                            {deletingAlertId === alert.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                                                        </MuiIconButton>
                                                    </MuiTooltip>
                                                </Box>
                                                {!alert.is_read && (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => handleMarkAlertRead(alert.id)}
                                                        sx={{ color: "#7c3aed", fontSize: "0.75rem", textTransform: "none", p: 0, minWidth: "auto", whiteSpace: "nowrap", mt: 0.25 }}
                                                    >
                                                        Mark read
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            )}

                            {/* Incoming Alerts Pagination */}
                            {filteredAlerts.length > 0 && (
                                <Box sx={{ borderTop: "1px solid", borderColor: "grey.200", mt: 2 }}>
                                    <TablePagination
                                        component="div"
                                        count={filteredAlerts.length}
                                        page={incomingPage}
                                        onPageChange={(_, newPage) => setIncomingPage(newPage)}
                                        rowsPerPage={incomingRowsPerPage}
                                        onRowsPerPageChange={(e) => {
                                            setIncomingRowsPerPage(parseInt(e.target.value, 10));
                                            setIncomingPage(0);
                                        }}
                                        rowsPerPageOptions={[5, 10, 20, 50]}
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 1: OUTGOING ANNOUNCEMENTS (Form + Sent History)            */}
                    {/* ============================================================== */}
                    {tab === 1 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {/* Send Announcement Form */}
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                                    Broadcast Announcement
                                </Typography>
                                <form onSubmit={(e) => { e.preventDefault(); handleSendNotification(false); }}>
                                    <Stack spacing={2.5}>
                                        <Controller
                                            name="title"
                                            control={control}
                                            rules={{ required: "Title is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField {...field} label="Announcement Title" fullWidth size="small" error={!!error} helperText={error?.message} placeholder="e.g. Schedule Update, Exam Preparation..." />
                                            )}
                                        />
                                        <Controller
                                            name="message"
                                            control={control}
                                            rules={{ required: "Message is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField {...field} label="Notification Message" fullWidth multiline rows={4} size="small" error={!!error} helperText={error?.message} placeholder="Write the announcement details here..." />
                                            )}
                                        />
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="type"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField {...field} select label="Severity / Priority" fullWidth size="small">
                                                            <MenuItem value="INFO">Information</MenuItem>
                                                            <MenuItem value="WARNING">Warning</MenuItem>
                                                            <MenuItem value="SUCCESS">Success</MenuItem>
                                                            <MenuItem value="ERROR">Important / Alert</MenuItem>
                                                        </TextField>
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="target_type"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField {...field} select label="Audience Target" fullWidth size="small">
                                                            <MenuItem value="ALL">All Students</MenuItem>
                                                            <MenuItem value="SPECIFIC">Specific Individual Students</MenuItem>
                                                            <MenuItem value="COURSE">By Course Enrollees</MenuItem>
                                                            <MenuItem value="GROUP">By Student Group</MenuItem>
                                                        </TextField>
                                                    )}
                                                />
                                            </Grid>
                                        </Grid>

                                        {targetType === "SPECIFIC" && (
                                            <Box>
                                                <Button variant="outlined" onClick={() => setShowStudentDialog(true)} fullWidth size="small" startIcon={<People fontSize="small" />}>
                                                    Select Students ({selectedStudents.length} chosen)
                                                </Button>
                                                {selectedStudents.length > 0 && (
                                                    <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                        {selectedStudents.map((id) => {
                                                            const s = students.find((s) => s.id === id);
                                                            return <Chip key={id} label={`${s?.first_name || ""} ${s?.last_name || ""} (${s?.username || id})`} onDelete={() => toggleStudent(id)} size="small" />;
                                                        })}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {targetType === "COURSE" && (
                                            <Box>
                                                <Button variant="outlined" onClick={() => setShowCourseDialog(true)} fullWidth size="small">
                                                    Select Courses ({selectedCourses.length} chosen)
                                                </Button>
                                                {selectedCourses.length > 0 && (
                                                    <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                        {selectedCourses.map((id) => {
                                                            const c = courses.find((c) => c.id === id);
                                                            return <Chip key={id} label={c?.name || `Course #${id}`} onDelete={() => toggleCourse(id)} size="small" />;
                                                        })}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {targetType === "GROUP" && (
                                            <Box>
                                                <Button variant="outlined" onClick={() => setShowGroupDialog(true)} fullWidth size="small" startIcon={<Groups sx={{ fontSize: 18 }} />}>
                                                    Select Groups ({selectedGroups.length} chosen)
                                                </Button>
                                                {selectedGroups.length > 0 && (
                                                    <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                        {selectedGroups.map((id) => {
                                                            const g = groups.find((grp) => grp.id === id);
                                                            const count = g?.member_count ?? g?.members_detail?.length ?? 0;
                                                            return (
                                                                <Chip
                                                                    key={id}
                                                                    label={`${g?.name || `Group #${id}`}${count ? ` (${count} students)` : ""}`}
                                                                    onDelete={() => toggleGroup(id)}
                                                                    size="small"
                                                                />
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {/* Dual Send Buttons */}
                                        <Box sx={{ pt: 1, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                                            <Button
                                                type="button"
                                                variant="contained"
                                                startIcon={sendingType === "NOTIF_ONLY" ? <CircularProgress size={16} color="inherit" /> : <Send />}
                                                disabled={isSubmitting || sendingType !== null}
                                                onClick={() => handleSendNotification(false)}
                                                sx={{
                                                    bgcolor: "#0f172a",
                                                    "&:hover": { bgcolor: "#1e293b" },
                                                    fontWeight: 700,
                                                    textTransform: "none",
                                                    borderRadius: 2,
                                                    py: 1.1,
                                                    px: 2.5,
                                                }}
                                            >
                                                {sendingType === "NOTIF_ONLY" ? "Sending..." : "Send Notification (Portal Only)"}
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="contained"
                                                startIcon={sendingType === "NOTIF_EMAIL" ? <CircularProgress size={16} color="inherit" /> : <Email />}
                                                disabled={isSubmitting || sendingType !== null}
                                                onClick={() => {
                                                    confirmAction(
                                                        "Send this announcement as both an in-app portal notification AND a direct email to all selected recipients?",
                                                        () => handleSendNotification(true),
                                                        null,
                                                        "Yes, Send Notification & Email",
                                                        "Cancel",
                                                        false
                                                    );
                                                }}
                                                sx={{
                                                    bgcolor: "#2563eb",
                                                    "&:hover": { bgcolor: "#1d4ed8" },
                                                    fontWeight: 700,
                                                    textTransform: "none",
                                                    borderRadius: 2,
                                                    py: 1.1,
                                                    px: 2.5,
                                                }}
                                            >
                                                {sendingType === "NOTIF_EMAIL" ? "Sending..." : "Send Notification & Real Email"}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </form>
                            </Box>

                            <Divider />

                            {/* Sent History & Rich Filtering Section */}
                            <Box>
                                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 2, gap: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            Sent History
                                        </Typography>
                                        <Chip label={`${totalOutgoingCount} total`} size="small" sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }} />
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="text"
                                        startIcon={<RestartAlt />}
                                        onClick={handleResetOutgoingFilters}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Reset Filters
                                    </Button>
                                </Box>

                                {/* Outgoing Filter Bar */}
                                <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200", borderRadius: 2.5 }}>
                                    <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                                        {/* Search Input */}
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                placeholder="Search title, message, student name, group..."
                                                value={outgoingSearch}
                                                onChange={(e) => {
                                                    setOutgoingSearch(e.target.value);
                                                    setOutgoingPage(0);
                                                }}
                                                size="small"
                                                fullWidth
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: outgoingSearch ? (
                                                            <InputAdornment position="end">
                                                                <MuiIconButton size="small" onClick={() => { setOutgoingSearch(""); setOutgoingPage(0); }}>
                                                                    <Close fontSize="small" />
                                                                </MuiIconButton>
                                                            </InputAdornment>
                                                        ) : null,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        {/* Target Filter */}
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <TextField
                                                select
                                                label="Target Type"
                                                value={outgoingFilterTarget}
                                                onChange={(e) => {
                                                    setOutgoingFilterTarget(e.target.value);
                                                    setOutgoingPage(0);
                                                }}
                                                size="small"
                                                fullWidth
                                            >
                                                <MenuItem value="ALL">All Targets</MenuItem>
                                                <MenuItem value="ALL_STUDENTS">All Students</MenuItem>
                                                <MenuItem value="SPECIFIC">Specific Students</MenuItem>
                                                <MenuItem value="COURSE">By Course</MenuItem>
                                                <MenuItem value="GROUP">By Group</MenuItem>
                                            </TextField>
                                        </Grid>

                                        {/* Group Filter */}
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <TextField
                                                select
                                                label="Filter by Group"
                                                value={outgoingFilterGroup}
                                                onChange={(e) => {
                                                    setOutgoingFilterGroup(e.target.value);
                                                    setOutgoingPage(0);
                                                }}
                                                size="small"
                                                fullWidth
                                            >
                                                <MenuItem value="ALL">All Groups</MenuItem>
                                                {groups.map((g) => (
                                                    <MenuItem key={g.id} value={g.id}>
                                                        {g.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        {/* Student Filter */}
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <TextField
                                                select
                                                label="Filter by Student"
                                                value={outgoingFilterStudent}
                                                onChange={(e) => {
                                                    setOutgoingFilterStudent(e.target.value);
                                                    setOutgoingPage(0);
                                                }}
                                                size="small"
                                                fullWidth
                                            >
                                                <MenuItem value="ALL">All Students</MenuItem>
                                                {students.map((s) => (
                                                    <MenuItem key={s.id} value={s.id}>
                                                        {s.first_name} {s.last_name} ({s.username})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        {/* Channel Filter */}
                                        <Grid size={{ xs: 6, sm: 4, md: 1.2 }}>
                                            <TextField
                                                select
                                                label="Channel"
                                                value={outgoingFilterChannel}
                                                onChange={(e) => {
                                                    setOutgoingFilterChannel(e.target.value);
                                                    setOutgoingPage(0);
                                                }}
                                                size="small"
                                                fullWidth
                                            >
                                                <MenuItem value="ALL">All</MenuItem>
                                                <MenuItem value="PORTAL">Portal Only</MenuItem>
                                                <MenuItem value="EMAIL">Portal + Email</MenuItem>
                                            </TextField>
                                        </Grid>

                                        {/* Type Filter */}
                                        <Grid size={{ xs: 12, sm: 4, md: 0.8 }} sx={{ minWidth: 100 }}>
                                            <TextField
                                                select
                                                label="Type"
                                                value={outgoingFilterType}
                                                onChange={(e) => {
                                                    setOutgoingFilterType(e.target.value);
                                                    setOutgoingPage(0);
                                                }}
                                                size="small"
                                                fullWidth
                                            >
                                                <MenuItem value="ALL">All</MenuItem>
                                                <MenuItem value="INFO">Info</MenuItem>
                                                <MenuItem value="WARNING">Warn</MenuItem>
                                                <MenuItem value="SUCCESS">Success</MenuItem>
                                                <MenuItem value="ERROR">Error</MenuItem>
                                            </TextField>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Sent Notifications Table */}
                                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2, position: "relative", minHeight: 250 }}>
                                    {notificationsLoading && (
                                        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                                            <CircularProgress size={32} />
                                        </Box>
                                    )}

                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: "grey.50" }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, width: "35%" }}>Title & Preview</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Channel</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Target</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Recipients</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Sent At</TableCell>
                                                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {notifications.length > 0 ? (
                                                notifications.map((n) => {
                                                    const recipientNames = (n.recipients || [])
                                                        .slice(0, 5)
                                                        .map((r) => r.recipient_name || r.recipient_email)
                                                        .join(", ");
                                                    const extraRecipients = (n.recipients?.length || 0) > 5 ? ` +${n.recipients.length - 5} more` : "";
                                                    const tooltipText = (n.recipients && n.recipients.length > 0)
                                                        ? `${recipientNames}${extraRecipients}`
                                                        : `${n.recipient_count || 0} recipient(s)`;

                                                    return (
                                                        <TableRow key={n.id} hover>
                                                            <TableCell sx={{ maxWidth: 280 }}>
                                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                                    {n.title}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                                                                    {n.message}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={n.type}
                                                                    size="small"
                                                                    color={n.type === "SUCCESS" ? "success" : n.type === "WARNING" ? "warning" : n.type === "ERROR" ? "error" : "info"}
                                                                    variant="outlined"
                                                                    sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {n.send_email ? (
                                                                    <Chip
                                                                        icon={<Email sx={{ fontSize: "13px !important" }} />}
                                                                        label="Portal + Email"
                                                                        size="small"
                                                                        color="primary"
                                                                        sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                                                                    />
                                                                ) : (
                                                                    <Chip
                                                                        label="Portal Only"
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ height: 22, fontSize: "0.7rem", color: "text.secondary" }}
                                                                    />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={formatTargetType(n.target_type)}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ height: 22, fontSize: "0.7rem" }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <MuiTooltip title={tooltipText}>
                                                                    <Chip
                                                                        label={`${n.recipient_count || n.recipients?.length || 0}`}
                                                                        size="small"
                                                                        sx={{ height: 22, fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}
                                                                        onClick={() => viewNotificationHistory(n)}
                                                                    />
                                                                </MuiTooltip>
                                                            </TableCell>
                                                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                                                                <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                                                                    {new Date(n.created_at).toLocaleDateString()}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        startIcon={loadingNotificationId === n.id ? <CircularProgress size={12} /> : <Visibility sx={{ fontSize: 15 }} />}
                                                                        onClick={() => viewNotificationHistory(n)}
                                                                        disabled={loadingNotificationId === n.id}
                                                                        sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.25, px: 1, borderRadius: 1.5 }}
                                                                    >
                                                                        {loadingNotificationId === n.id ? "..." : "View"}
                                                                    </Button>
                                                                    <MuiTooltip title="Delete notification">
                                                                        <MuiIconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => handleDeleteNotification(n.id)}
                                                                            disabled={deletingNotifId === n.id}
                                                                        >
                                                                            {deletingNotifId === n.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                                                                        </MuiIconButton>
                                                                    </MuiTooltip>
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                        <SendOutlined sx={{ fontSize: 40, color: "grey.400", mb: 1 }} />
                                                        <Typography fontWeight={600} color="text.secondary">
                                                            No notifications found
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {outgoingSearch || outgoingFilterType !== "ALL" || outgoingFilterTarget !== "ALL" || outgoingFilterGroup !== "ALL" || outgoingFilterStudent !== "ALL" || outgoingFilterChannel !== "ALL"
                                                                ? "Try adjusting your search criteria or reset filters."
                                                                : "Broadcast announcements to your students using the form above."}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Outgoing Server-side Pagination */}
                                    <TablePagination
                                        component="div"
                                        count={totalOutgoingCount}
                                        page={outgoingPage}
                                        onPageChange={(_, newPage) => setOutgoingPage(newPage)}
                                        rowsPerPage={outgoingRowsPerPage}
                                        onRowsPerPageChange={(e) => {
                                            setOutgoingRowsPerPage(parseInt(e.target.value, 10));
                                            setOutgoingPage(0);
                                        }}
                                        rowsPerPageOptions={[10, 15, 25, 50, 100]}
                                        showFirstButton
                                        showLastButton
                                        sx={{ borderTop: "1px solid", borderColor: "grey.200" }}
                                    />
                                </TableContainer>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* ============================================================== */}
            {/* DIALOGS                                                        */}
            {/* ============================================================== */}

            {/* STUDENT SELECTION DIALOG */}
            <Dialog
                open={showStudentDialog}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setShowStudentDialog(false); }}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, m: 2, maxHeight: "85vh" } } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Select Specific Students</span>
                    {selectedStudents.length > 0 && (
                        <Chip label={`${selectedStudents.length} selected`} size="small" color="primary" />
                    )}
                </DialogTitle>
                <DialogContent sx={{ maxHeight: 400, overflow: "auto" }}>
                    <TextField
                        placeholder="Search students by name, email, or username..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 2, mt: 1 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Stack spacing={1}>
                        {filteredStudentsList.length > 0 ? (
                            filteredStudentsList.map((s) => (
                                <FormControlLabel
                                    key={s.id}
                                    control={<Checkbox checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} size="small" />}
                                    label={
                                        <Box component="span" sx={{ display: "inline-flex", flexDirection: "column" }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {s.first_name} {s.last_name} ({s.username})
                                            </Typography>
                                            {s.email && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {s.email}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                            ))
                        ) : (
                            <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: "center" }}>
                                No students match your search.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
                    <Button color="inherit" onClick={() => setSelectedStudents([])} disabled={selectedStudents.length === 0} size="small">
                        Clear All
                    </Button>
                    <Button onClick={() => setShowStudentDialog(false)} variant="contained" size="small">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* COURSE SELECTION DIALOG */}
            <Dialog
                open={showCourseDialog}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setShowCourseDialog(false); }}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, m: 2, maxHeight: "85vh" } } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Select Target Courses</span>
                    {selectedCourses.length > 0 && (
                        <Chip label={`${selectedCourses.length} selected`} size="small" color="primary" />
                    )}
                </DialogTitle>
                <DialogContent sx={{ maxHeight: 400, overflow: "auto" }}>
                    <TextField
                        placeholder="Search courses by name or code..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 2, mt: 1 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Stack spacing={1}>
                        {filteredCoursesList.length > 0 ? (
                            filteredCoursesList.map((c) => (
                                <FormControlLabel
                                    key={c.id}
                                    control={<Checkbox checked={selectedCourses.includes(c.id)} onChange={() => toggleCourse(c.id)} size="small" />}
                                    label={`${c.name} (${c.code_prefix || "Course"})`}
                                />
                            ))
                        ) : (
                            <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: "center" }}>
                                No courses found.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
                    <Button color="inherit" onClick={() => setSelectedCourses([])} disabled={selectedCourses.length === 0} size="small">
                        Clear All
                    </Button>
                    <Button onClick={() => setShowCourseDialog(false)} variant="contained" size="small">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* GROUP SELECTION DIALOG */}
            <Dialog
                open={showGroupDialog}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setShowGroupDialog(false); }}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, m: 2, maxHeight: "85vh" } } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Select Student Groups</span>
                    {selectedGroups.length > 0 && (
                        <Chip label={`${selectedGroups.length} selected`} size="small" color="primary" />
                    )}
                </DialogTitle>
                <DialogContent sx={{ maxHeight: 400, overflow: "auto" }}>
                    <TextField
                        placeholder="Search groups by name or course..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 2, mt: 1 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    {filteredGroupsList.length > 0 ? (
                        <Stack spacing={1}>
                            {filteredGroupsList.map((g) => {
                                const count = g.member_count ?? g.members_detail?.length ?? 0;
                                return (
                                    <FormControlLabel
                                        key={g.id}
                                        control={<Checkbox checked={selectedGroups.includes(g.id)} onChange={() => toggleGroup(g.id)} size="small" />}
                                        label={
                                            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                <Typography component="span" variant="body2" fontWeight={600}>
                                                    {g.name}
                                                </Typography>
                                                {g.course_name && (
                                                    <Chip label={g.course_name} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                                                )}
                                                <Chip label={`${count} student${count === 1 ? "" : "s"}`} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                                            </Box>
                                        }
                                    />
                                );
                            })}
                        </Stack>
                    ) : (
                        <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: "center" }}>
                            No student groups found.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
                    <Button color="inherit" onClick={() => setSelectedGroups([])} disabled={selectedGroups.length === 0} size="small">
                        Clear All
                    </Button>
                    <Button onClick={() => setShowGroupDialog(false)} variant="contained" size="small">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* INCOMING ALERT DETAILS DIALOG */}
            <Dialog
                open={!!viewingAlert}
                onClose={() => setViewingAlert(null)}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, m: 2 } } }}
            >
                {viewingAlert && (
                    <>
                        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1.5, pt: 2.5, px: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: "#7c3aed", width: 42, height: 42, fontWeight: 700, fontSize: 16 }}>
                                    {viewingAlert.triggered_by_name?.charAt(0) || viewingAlert.triggered_by_username?.charAt(0) || "S"}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                        {viewingAlert.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {viewingAlert.triggered_by_name ? `${viewingAlert.triggered_by_name} (${viewingAlert.triggered_by_username})` : viewingAlert.triggered_by_username || "System Notification"}
                                    </Typography>
                                </Box>
                            </Box>
                            <MuiIconButton size="small" onClick={() => setViewingAlert(null)}>
                                <Close />
                            </MuiIconButton>
                        </DialogTitle>
                        <Divider />
                        <DialogContent sx={{ py: 2.5, px: 3 }}>
                            <Stack spacing={2.5}>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                    <Chip
                                        label={viewingAlert.alert_type || "ALERT"}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                    />
                                    <Chip
                                        label={viewingAlert.is_read ? "Read" : "Unread"}
                                        size="small"
                                        color={viewingAlert.is_read ? "default" : "secondary"}
                                        variant={viewingAlert.is_read ? "outlined" : "filled"}
                                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                    />
                                    <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>
                                        {new Date(viewingAlert.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                                    </Typography>
                                </Box>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: "grey.50",
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                    }}
                                >
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                                        Full Message
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "slate.900" }}>
                                        {viewingAlert.message}
                                    </Typography>
                                </Paper>

                                {(() => {
                                    const actionMeta = getAlertActionMeta(viewingAlert);
                                    if (!actionMeta) return null;
                                    return (
                                        <Box sx={{ pt: 0.5 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color={actionMeta.color}
                                                startIcon={actionMeta.icon}
                                                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                                                onClick={() => {
                                                    const url = actionMeta.url;
                                                    setViewingAlert(null);
                                                    router.push(url);
                                                }}
                                                sx={{ textTransform: "none", py: 1.2, borderRadius: 2, fontWeight: 700 }}
                                            >
                                                {actionMeta.label}
                                            </Button>
                                        </Box>
                                    );
                                })()}
                            </Stack>
                        </DialogContent>
                        <Divider />
                        <DialogActions sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between" }}>
                            <Button
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => {
                                    const id = viewingAlert.id;
                                    setViewingAlert(null);
                                    handleDeleteAlert(id);
                                }}
                            >
                                Delete
                            </Button>
                            <Button variant="contained" size="small" onClick={() => setViewingAlert(null)}>
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* NOTIFICATION DETAILS / HISTORY DIALOG */}
            <Dialog
                open={showHistoryDialog}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setShowHistoryDialog(false); }}
                maxWidth="md"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, m: 2, maxHeight: "85vh" } } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1.5, pt: 2.5, px: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Notification Details
                    </Typography>
                    <MuiIconButton size="small" onClick={() => setShowHistoryDialog(false)}>
                        <Close />
                    </MuiIconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ overflowY: "auto", px: 3, py: 2.5 }}>
                    {selectedNotification && (
                        <Stack spacing={2.5}>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                <Chip
                                    label={selectedNotification.type}
                                    size="small"
                                    color={selectedNotification.type === "SUCCESS" ? "success" : selectedNotification.type === "WARNING" ? "warning" : selectedNotification.type === "ERROR" ? "error" : "info"}
                                    variant="outlined"
                                    sx={{ fontWeight: 700 }}
                                />
                                {selectedNotification.send_email ? (
                                    <Chip icon={<Email sx={{ fontSize: "13px !important" }} />} label="Portal + Real Email" size="small" color="primary" sx={{ height: 24, fontSize: "0.75rem", fontWeight: 700 }} />
                                ) : (
                                    <Chip label="Portal Only" size="small" variant="outlined" sx={{ height: 24, fontSize: "0.75rem", color: "text.secondary" }} />
                                )}
                                <Chip label={`Target: ${formatTargetType(selectedNotification.target_type)}`} size="small" variant="outlined" />
                                <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>
                                    Sent: {new Date(selectedNotification.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                                    Title
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="slate.900">
                                    {selectedNotification.title}
                                </Typography>
                            </Box>

                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200" }}>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                                    Message
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "slate.900" }}>
                                    {selectedNotification.message}
                                </Typography>
                            </Paper>

                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                    Recipients ({notificationRecipients.length})
                                </Typography>
                                {loadingRecipients ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : notificationRecipients.length > 0 ? (
                                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2, maxHeight: 260 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>Recipient Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Portal Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {notificationRecipients.map((r) => (
                                                    <TableRow key={r.id}>
                                                        <TableCell>{r.recipient_name || "—"}</TableCell>
                                                        <TableCell sx={{ wordBreak: "break-word" }}>{r.recipient_email || "—"}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={r.is_read ? "Read" : "Unread"}
                                                                size="small"
                                                                color={r.is_read ? "success" : "default"}
                                                                variant="outlined"
                                                                sx={{ height: 20, fontSize: "0.68rem" }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography color="text.secondary" variant="body2">
                                        No individual recipients listed.
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setShowHistoryDialog(false)} variant="contained" size="small">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
