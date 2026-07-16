"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { errorToast, successToast } from "@/lib/toast";
import {
    Paper,
    Typography,
    TextField,
    CircularProgress,
    Box,
    Avatar,
    Grid,
    Chip,
    Divider,
    Card,
    CardContent,
    Button,
    Stack,
} from "@mui/material";
import { Person } from "@mui/icons-material";

const InfoCard = ({ label, value }) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200", p: { xs: 1.5, sm: 2 }, height: "100%", overflow: "hidden" }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, wordBreak: "break-word", overflow: "hidden" }}>
            {value || "—"}
        </Typography>
    </Card>
);

export default function AdminProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(false);
        }
    }, [user]);

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
                            Loading profile...
                        </Typography>
                    </Box>
                </Box>
            )}

            <div>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                    Admin Profile
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    View your admin account information.
                </Typography>
            </div>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    p: { xs: 2, sm: 4 },
                }}
            >
                <Box sx={{ display: "flex", gap: { xs: 2, sm: 3 }, alignItems: "flex-start", mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
                    <Box sx={{ position: "relative" }}>
                        <Avatar
                            sx={{
                                width: { xs: 80, sm: 100 },
                                height: { xs: 80, sm: 100 },
                                bgcolor: "#7c3aed",
                                fontSize: { xs: 32, sm: 40 },
                                fontWeight: 700,
                            }}
                        >
                            {user?.firstName?.charAt(0)?.toUpperCase()}
                            {user?.lastName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={700} mb={1} sx={{ fontSize: { xs: "1.125rem", sm: "1.5rem" } }}>
                            {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography color="text.secondary" mb={2} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, wordBreak: "break-word" }}>
                            {user?.email}
                        </Typography>
                        <Chip
                            label={user?.role || "ADMIN"}
                            color="primary"
                            size="small"
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box>
                    <Typography variant="h6" fontWeight={700} mb={3} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                        Account Information
                    </Typography>

                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Username" value={user?.username} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Email" value={user?.email} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Role" value={user?.role} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="First Name" value={user?.firstName} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Last Name" value={user?.lastName} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Phone" value={user?.phone || "—"} />
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </div>
    );
}
