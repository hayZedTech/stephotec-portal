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
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
        );
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
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Notifications
                </Typography>
                <Typography color="text.secondary">
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
                                        <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                                            {notification.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 1.5 }}
                                        >
                                            {notification.message}
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                            <Chip
                                                size="small"
                                                label={new Date(
                                                    notification.created_at
                                                ).toLocaleDateString()}
                                                variant="outlined"
                                            />
                                            <Chip
                                                size="small"
                                                label={notification.type}
                                                color={getTypeColor(notification.type)}
                                                variant="outlined"
                                            />
                                            {!notification.is_read && (
                                                <Button
                                                    size="small"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    sx={{ ml: "auto" }}
                                                >
                                                    Mark as Read
                                                </Button>
                                            )}
                                            {notification.is_read && (
                                                <Chip
                                                    size="small"
                                                    label="Read"
                                                    variant="outlined"
                                                    color="success"
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
                        <Typography color="text.secondary">
                            No notifications yet.
                        </Typography>
                    </Box>
                )}
            </Paper>
        </div>
    );
}
