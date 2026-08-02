"use client";

import { useState } from "react";
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert,
    Stack,
} from "@mui/material";
import { LockReset, ArrowBack, MarkEmailRead } from "@mui/icons-material";
import api from "@/lib/axios";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            setLoading(true);
            setErrorMsg("");

            const response = await api.post("/auth/password-reset/request/", {
                email_or_username: query.trim(),
            });

            setMessage(response.data.message || "Password reset instructions have been sent.");
            setSubmitted(true);
        } catch (err) {
            console.error("Forgot password error:", err);
            const detail = err?.response?.data?.detail || "Failed to send password reset request. Please try again.";
            setErrorMsg(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: 'url(/images/login_image.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                py: 6,
                px: 2,
                position: "relative",
            }}
        >
            {/* Background Dark Overlay */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: "rgba(0, 0, 0, 0.45)",
                }}
            />

            <Container maxWidth="xs" sx={{ position: "relative", zIndex: 10 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 4,
                        border: "1px solid #e2e8f0",
                        bgcolor: "#ffffff",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    }}
                >
                    {/* Header */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        <Box sx={{ display: "inline-flex", alignItems: "center", justifyCenter: "center", p: 1.5, bgcolor: "#f3e8ff", borderRadius: "50%", mb: 1.5, color: "#7c3aed" }}>
                            <LockReset sx={{ fontSize: 36 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} color="slate.900">
                            Reset Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Enter your registered Email or Username to receive password reset instructions.
                        </Typography>
                    </Box>

                    {submitted ? (
                        <Box sx={{ textAlign: "center", py: 2 }}>
                            <Alert
                                severity="success"
                                icon={<MarkEmailRead fontSize="inherit" />}
                                sx={{ borderRadius: 2.5, textAlign: "left", mb: 3 }}
                            >
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Check Your Email
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {message}
                                </Typography>
                            </Alert>

                            <Button
                                component={Link}
                                href="/login"
                                variant="contained"
                                fullWidth
                                sx={{
                                    borderRadius: 2.5,
                                    py: 1.2,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    bgcolor: "#7c3aed",
                                    "&:hover": { bgcolor: "#6d28d9" },
                                }}
                            >
                                Return to Login
                            </Button>
                        </Box>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                {errorMsg && (
                                    <Alert severity="error" sx={{ borderRadius: 2.5 }}>
                                        {errorMsg}
                                    </Alert>
                                )}

                                <TextField
                                    fullWidth
                                    label="Email Address or Student Username"
                                    placeholder="e.g. SE/26/0001 or student@email.com"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    required
                                    size="small"
                                    disabled={loading}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={loading || !query.trim()}
                                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                                    sx={{
                                        borderRadius: 2.5,
                                        py: 1.2,
                                        fontWeight: 700,
                                        textTransform: "none",
                                        bgcolor: "#7c3aed",
                                        "&:hover": { bgcolor: "#6d28d9" },
                                    }}
                                >
                                    {loading ? "Sending..." : "Send Password Reset Email"}
                                </Button>

                                <Box sx={{ textAlign: "center", pt: 1 }}>
                                    <Button
                                        component={Link}
                                        href="/login"
                                        startIcon={<ArrowBack />}
                                        sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
                                    >
                                        Back to Login
                                    </Button>
                                </Box>
                            </Stack>
                        </form>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}
