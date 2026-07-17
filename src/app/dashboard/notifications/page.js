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
} from "@mui/material";
import { Info, CheckCircle, WarningAmber } from "@mui/icons-material";
import { getStudentNotifications, markNotificationAsRead } from "@/services/notifications";

export default function NotificationsPage() {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [markingAsReadId, setMarkingAsReadId] = useState(null);

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
                    prev.map((notif) =>
                        notif.id === notificationId
                            ? { ...notif, is_read: true }
                            : notif
                    )
                );
            }
        } finally {
            setMarkingAsReadId(null);
        }
    }

    const getIcon = (type) => {
        switch (type) {
            case "SUCCESS":
                return <CheckCircle sx={{ color: "success.main", fontSize: 28 }} />;
            case "WARNING":
                return <WarningAmber sx={{ color: "warning.main", fontSize: 28 }} />;
            case "ERROR":
                return <WarningAmber sx={{ color: "error.main", fontSize: 28 }} />;
            default:
                return <Info sx={{ color: "info.main", fontSize: 28 }} />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "SUCCESS":
                return "success";
            case "WARNING":
                return "warning";
            case "ERROR":
                return "error";
            default:
                return "info";
        }
    };

    return (
        <div className="space-y-6">
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

            <div>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                    Notifications
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Stay updated with important announcements.
                </Typography>
            </div>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                }}
            >
                {notifications.length > 0 ? (
                    <List sx={{ width: "100%" }}>
                        {notifications.map((notification, index) => (
                            <Box key={notification.id || index}>
                                <ListItem
                                    sx={{
                                        py: 2.5,
                                        px: 3,
                                        display: "flex",
                                        gap: 2,
                                        bgcolor: notification.is_read ? "transparent" : "action.hover",
                                    }}
                                >
                                    <Box sx={{ pt: 0.5, flexShrink: 0 }}>
                                        {getIcon(notification.type)}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontWeight={600} sx={{ mb: 0.5, fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                                            {notification.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 1.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                                        >
                                            {notification.message}
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                            <Chip
                                                size="small"
                                                label={new Date(notification.created_at).toLocaleString()}
                                                variant="outlined"
                                                sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                                            />
                                            <Chip
                                                size="small"
                                                label={notification.type}
                                                color={getTypeColor(notification.type)}
                                                variant="outlined"
                                                sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                                            />
                                            {!notification.is_read && (
                                                <Button
                                                    size="small"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    disabled={markingAsReadId === notification.id}
                                                    startIcon={markingAsReadId === notification.id ? <CircularProgress size={14} /> : undefined}
                                                    sx={{ ml: "auto", fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                                                >
                                                    {markingAsReadId === notification.id ? "Marking..." : "Mark as Read"}
                                                </Button>
                                            )}
                                            {notification.is_read && (
                                                <Chip
                                                    size="small"
                                                    label="Read"
                                                    variant="outlined"
                                                    color="success"
                                                    sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </ListItem>

                                {index < notifications.length - 1 && (
                                    <Divider />
                                )}
                            </Box>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                            No notifications yet.
                        </Typography>
                    </Box>
                )}
            </Paper>
        </div>
    );
}
