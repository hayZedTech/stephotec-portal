"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import { Info, CheckCircle, WarningAmber, Delete, DoneAll, DeleteSweep } from "@mui/icons-material";
import { getStudentNotifications, markNotificationAsRead } from "@/services/notifications";
import { useNotifications } from "@/providers/NotificationsProvider";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import api from "@/lib/axios";

export default function NotificationsPage() {
    const { decrementUnreadCount, setUnreadCount } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
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
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                            {notification.message}
                                        </Typography>
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
                                    {/* DELETE BUTTON */}
                                    <Tooltip title="Delete notification">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(notification.id)}
                                            disabled={deletingId === notification.id}
                                            sx={{ flexShrink: 0, mt: 0.5 }}
                                        >
                                            {deletingId === notification.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
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
        </div>
    );
}
