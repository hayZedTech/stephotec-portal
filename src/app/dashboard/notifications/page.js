"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Paper,
    Typography,
    CircularProgress,
    Box,
    Chip,
    List,
    ListItem,
    Divider,
    Button,
    Stack,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import {
    Info,
    CheckCircle,
    WarningAmber,
    Delete,
    DoneAll,
    DeleteSweep,
    ArrowForward,
    EventAvailable,
    FolderShared,
    Assignment,
    Quiz,
    School,
    Payment,
    Person,
    WorkspacePremium,
    Schedule,
    Visibility,
    Close,
} from "@mui/icons-material";
import { getStudentNotifications, markNotificationAsRead } from "@/services/notifications";
import { useNotifications } from "@/providers/NotificationsProvider";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import api from "@/lib/axios";

function getStudentActionMeta(notification) {
    const title = (notification.title || "").toLowerCase();
    const msg = (notification.message || "").toLowerCase();
    const type = (notification.type || "").toUpperCase();

    if (type.includes("LECTURE") || type.includes("SCHEDULE") || title.includes("class today") || title.includes("lecture") || msg.includes("lecture") || msg.includes("timetable") || msg.includes("scheduled today")) {
        return {
            label: "View Lecture Schedule",
            url: "/dashboard/schedule",
            icon: <Schedule sx={{ fontSize: 16 }} />,
            color: "primary",
        };
    }
    if (type.includes("ATTENDANCE") || title.includes("attendance") || msg.includes("attendance")) {
        return {
            label: "View Attendance Record",
            url: "/dashboard/attendance",
            icon: <EventAvailable sx={{ fontSize: 16 }} />,
            color: "success",
        };
    }
    if (type.includes("ASSIGNMENT") || title.includes("assignment") || msg.includes("assignment") || msg.includes("submission") || msg.includes("graded")) {
        return {
            label: "Open Assignments",
            url: "/dashboard/assignments",
            icon: <Assignment sx={{ fontSize: 16 }} />,
            color: "primary",
        };
    }
    if (type.includes("HANDOUT") || title.includes("material") || title.includes("class file") || msg.includes("class material") || msg.includes("handout") || msg.includes("download")) {
        return {
            label: "Open Learning Materials",
            url: "/dashboard/learning",
            icon: <FolderShared sx={{ fontSize: 16 }} />,
            color: "secondary",
        };
    }
    if (type.includes("QUIZ") || title.includes("quiz") || msg.includes("quiz") || title.includes("assessment") || msg.includes("assessment")) {
        return {
            label: "Go to Quizzes",
            url: "/dashboard/quizzes",
            icon: <Quiz sx={{ fontSize: 16 }} />,
            color: "warning",
        };
    }
    if (title.includes("payment") || msg.includes("payment") || msg.includes("₦") || msg.includes("paid") || msg.includes("receipt")) {
        return {
            label: "View Payments & Receipts",
            url: "/dashboard/payments",
            icon: <Payment sx={{ fontSize: 16 }} />,
            color: "success",
        };
    }
    if (title.includes("certificate") || msg.includes("certificate")) {
        return {
            label: "View Certificate",
            url: "/dashboard/courses",
            icon: <WorkspacePremium sx={{ fontSize: 16 }} />,
            color: "warning",
        };
    }
    if (title.includes("course") || msg.includes("enrolled") || msg.includes("course")) {
        return {
            label: "Go to My Courses",
            url: "/dashboard/courses",
            icon: <School sx={{ fontSize: 16 }} />,
            color: "primary",
        };
    }
    if (title.includes("profile") || title.includes("welcome") || msg.includes("account") || msg.includes("welcome")) {
        return {
            label: "View My Profile",
            url: "/dashboard/profile",
            icon: <Person sx={{ fontSize: 16 }} />,
            color: "info",
        };
    }
    return null;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { decrementUnreadCount, setUnreadCount } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [viewingNotification, setViewingNotification] = useState(null);
    const [markingAsReadId, setMarkingAsReadId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [filter, setFilter] = useState("ALL"); // ALL | UNREAD | READ

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        try {
            setLoading(true);
            const data = await getStudentNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Error loading notifications:", error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkAsRead(notificationId) {
        try {
            setMarkingAsReadId(notificationId);
            const success = await markNotificationAsRead(notificationId);
            if (success) {
                setNotifications((prev) =>
                    prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n)
                );
                decrementUnreadCount();
            }
        } finally {
            setMarkingAsReadId(null);
        }
    }

    async function handleMarkAllRead() {
        setMarkingAll(true);
        try {
            await api.post("/notifications/mark_all_read/");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            successToast("All notifications marked as read");
        } catch (error) {
            errorToast(error, "Failed to mark all as read");
        } finally {
            setMarkingAll(false);
        }
    }

    function handleDelete(notificationId) {
        confirmAction(
            "Delete this notification?",
            async () => {
                setDeletingId(notificationId);
                try {
                    const notif = notifications.find((n) => n.id === notificationId);
                    await api.delete(`/notifications/${notificationId}/delete_for_me/`);
                    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                    if (!notif?.is_read) decrementUnreadCount();
                    successToast("Notification deleted");
                } catch (error) {
                    errorToast(error, "Failed to delete notification");
                } finally {
                    setDeletingId(null);
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    }

    function handleClearAll() {
        confirmAction(
            "Clear all notifications? This cannot be undone.",
            async () => {
                try {
                    await api.delete("/notifications/clear_all_for_me/");
                    setNotifications([]);
                    setUnreadCount(0);
                    successToast("All notifications cleared");
                } catch (error) {
                    errorToast(error, "Failed to clear notifications");
                }
            },
            null,
            "Clear All",
            "Cancel",
            true
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case "SUCCESS": return <CheckCircle sx={{ color: "success.main", fontSize: 28 }} />;
            case "WARNING": return <WarningAmber sx={{ color: "warning.main", fontSize: 28 }} />;
            case "ERROR": return <WarningAmber sx={{ color: "error.main", fontSize: 28 }} />;
            default: return <Info sx={{ color: "info.main", fontSize: 28 }} />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "SUCCESS": return "success";
            case "WARNING": return "warning";
            case "ERROR": return "error";
            default: return "info";
        }
    };

    const filtered = notifications.filter((n) => {
        if (filter === "UNREAD") return !n.is_read;
        if (filter === "READ") return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <div className="space-y-6">
            {loading && (
                <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(2px)" }}>
                    <Box sx={{ bgcolor: "background.paper", borderRadius: 3, p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                        <CircularProgress size={48} />
                        <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>Loading notifications...</Typography>
                    </Box>
                </Box>
            )}

            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <div>
                    <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                        Notifications
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                        Stay updated with important announcements.
                    </Typography>
                </div>
                {notifications.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {unreadCount > 0 && (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DoneAll />}
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                sx={{ textTransform: "none", fontWeight: 600 }}
                            >
                                {markingAll ? "Marking..." : "Mark All as Read"}
                            </Button>
                        )}
                        <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteSweep />}
                            onClick={handleClearAll}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                            Clear All
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* FILTER CHIPS */}
            {notifications.length > 0 && (
                <Stack direction="row" spacing={1}>
                    {["ALL", "UNREAD", "READ"].map((f) => (
                        <Chip
                            key={f}
                            label={f === "ALL" ? `All (${notifications.length})` : f === "UNREAD" ? `Unread (${unreadCount})` : `Read (${notifications.length - unreadCount})`}
                            onClick={() => setFilter(f)}
                            variant={filter === f ? "filled" : "outlined"}
                            color={filter === f ? "primary" : "default"}
                            size="small"
                            sx={{ cursor: "pointer", fontWeight: 600 }}
                        />
                    ))}
                </Stack>
            )}

            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                {filtered.length > 0 ? (
                    <List sx={{ width: "100%" }}>
                        {filtered.map((notification, index) => (
                            <Box key={notification.id || index}>
                                <ListItem
                                    sx={{
                                        py: 2.5,
                                        px: 3,
                                        display: "flex",
                                        gap: 2,
                                        bgcolor: notification.is_read ? "transparent" : "action.hover",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <Box sx={{ pt: 0.5, flexShrink: 0 }}>
                                        {getIcon(notification.type)}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontWeight={600} sx={{ mb: 0.5, fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                                            {notification.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                            {notification.message}
                                        </Typography>

                                        {/* Contextual Action Navigation Link Button */}
                                        {(() => {
                                            const actionMeta = getStudentActionMeta(notification);
                                            if (!actionMeta) return null;
                                            return (
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color={actionMeta.color}
                                                        startIcon={actionMeta.icon}
                                                        endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                                                        onClick={() => {
                                                            if (!notification.is_read) handleMarkAsRead(notification.id);
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

                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                            <Chip size="small" label={new Date(notification.created_at).toLocaleString()} variant="outlined" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }} />
                                            <Chip size="small" label={notification.type} color={getTypeColor(notification.type)} variant="outlined" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }} />
                                            {notification.is_read ? (
                                                <Chip size="small" label="Read" variant="outlined" color="success" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }} />
                                            ) : (
                                                <Button
                                                    size="small"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    disabled={markingAsReadId === notification.id}
                                                    startIcon={markingAsReadId === notification.id ? <CircularProgress size={14} /> : <CheckCircle sx={{ fontSize: 14 }} />}
                                                    sx={{ ml: "auto", fontSize: { xs: "0.65rem", sm: "0.75rem" }, textTransform: "none" }}
                                                >
                                                    {markingAsReadId === notification.id ? "Marking..." : "Mark as Read"}
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                    {/* ACTIONS */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, mt: 0.5 }}>
                                        <Tooltip title="View full details">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => {
                                                    setViewingNotification(notification);
                                                    if (!notification.is_read) handleMarkAsRead(notification.id);
                                                }}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete notification">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(notification.id)}
                                                disabled={deletingId === notification.id}
                                            >
                                                {deletingId === notification.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                                {index < filtered.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                            {filter !== "ALL" ? `No ${filter.toLowerCase()} notifications.` : "No notifications yet."}
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* NOTIFICATION DETAILS DIALOG */}
            <Dialog
                open={!!viewingNotification}
                onClose={() => setViewingNotification(null)}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, m: 2 } } }}
            >
                {viewingNotification && (
                    <>
                        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1.5, pt: 2.5, px: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                {getIcon(viewingNotification.type)}
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                        {viewingNotification.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(viewingNotification.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton size="small" onClick={() => setViewingNotification(null)}>
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <Divider />
                        <DialogContent sx={{ py: 2.5, px: 3 }}>
                            <Stack spacing={2.5}>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                    <Chip
                                        label={viewingNotification.type}
                                        color={getTypeColor(viewingNotification.type)}
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                    />
                                    <Chip
                                        label={viewingNotification.is_read ? "Read" : "Unread"}
                                        color={viewingNotification.is_read ? "success" : "default"}
                                        variant={viewingNotification.is_read ? "outlined" : "filled"}
                                        size="small"
                                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                    />
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
                                        Notification Message
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "slate.900" }}>
                                        {viewingNotification.message}
                                    </Typography>
                                </Paper>

                                {(() => {
                                    const actionMeta = getStudentActionMeta(viewingNotification);
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
                                                    setViewingNotification(null);
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
                                    const id = viewingNotification.id;
                                    setViewingNotification(null);
                                    handleDelete(id);
                                }}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => setViewingNotification(null)}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </div>
    );
}
