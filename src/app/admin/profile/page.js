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
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200", p: 2.5, height: "100%" }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
            {label}
        </Typography>
        <Typography variant="body1" fontWeight={600} sx={{ wordBreak: "break-word" }}>
            {value || "—"}
        </Typography>
    </Card>
);

export default function AdminProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!user) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Admin Profile
                </Typography>
                <Typography color="text.secondary">
                    View your admin account information.
                </Typography>
            </div>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    p: 4,
                }}
            >
                <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", mb: 3 }}>
                    <Box sx={{ position: "relative" }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                bgcolor: "#7c3aed",
                                fontSize: 40,
                                fontWeight: 700,
                            }}
                        >
                            {user?.firstName?.charAt(0)?.toUpperCase()}
                            {user?.lastName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={700} mb={1}>
                            {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography color="text.secondary" mb={2}>
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
                    <Typography variant="h6" fontWeight={700} mb={3}>
                        Account Information
                    </Typography>

                    <Grid container spacing={2}>
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
