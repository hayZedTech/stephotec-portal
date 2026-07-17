"use client";

import { useAuth } from "@/providers/AuthProvider";
import {
    Paper,
    Typography,
    CircularProgress,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
} from "@mui/material";
import { Workspaces, CheckCircle, AccessTime } from "@mui/icons-material";

export default function IndustrialTrainingPage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <Box
                sx={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(2px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                }}
            >
                <Box
                    sx={{
                        backgroundColor: "white",
                        borderRadius: 3,
                        p: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <CircularProgress size={48} />
                    <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                        Loading industrial training...
                    </Typography>
                </Box>
            </Box>
        );
    }

    const isInTraining = user?.isIndustrialTraining;

    return (
        <div className="space-y-6">
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Industrial Training
                </Typography>
                <Typography color="text.secondary">
                    Track your industrial training progress.
                </Typography>
            </div>

            {isInTraining ? (
                <Grid container spacing={3}>
                    {/* Status Card */}
                    <Grid xs={12} md={6}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "grey.200",
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        mb: 2,
                                    }}
                                >
                                    <Workspaces
                                        sx={{
                                            fontSize: 32,
                                            color: "#ea580c",
                                        }}
                                    />
                                    <Typography variant="h6" fontWeight={700}>
                                        Training Status
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 3 }}>
                                    <Chip
                                        icon={<CheckCircle />}
                                        label="Active"
                                        color="success"
                                        sx={{ mb: 2 }}
                                    />

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        You are currently enrolled in the
                                        industrial training program.
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Details Card */}
                    <Grid xs={12} md={6}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "grey.200",
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} mb={2}>
                                    Details
                                </Typography>

                                <Box sx={{ space: 2 }}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight={600}
                                        >
                                            Status
                                        </Typography>
                                        <Typography variant="body2">
                                            Currently in Industrial Training
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "grey.200",
                        p: 4,
                        textAlign: "center",
                    }}
                >
                    <AccessTime sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} mb={1}>
                        Not Enrolled
                    </Typography>
                    <Typography color="text.secondary">
                        You are not currently enrolled in the industrial
                        training program.
                    </Typography>
                </Paper>
            )}
        </div>
    );
}
