"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
    IconButton,
    InputAdornment,
} from "@mui/material";
import {
    LockReset,
    CheckCircle,
    Visibility,
    VisibilityOff,
    Key,
} from "@mui/icons-material";
import api from "@/lib/axios";
import Link from "next/link";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const uid = searchParams.get("uid") || "";
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!uid || !token) {
            setErrorMsg("Invalid or missing password reset link. Please request a new link.");
        }
    }, [uid, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (newPassword.length < 6) {
            setErrorMsg("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg("Passwords do not match. Please try again.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/auth/password-reset/confirm/", {
                uid,
                token,
                new_password: newPassword,
            });

            setMessage(response.data.message || "Password reset successful!");
            setSuccess(true);
        } catch (err) {
            console.error("Reset password confirm error:", err);
            const detail = err?.response?.data?.detail || "Failed to reset password. The reset link may be invalid or expired.";
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
                        <Box sx={{ display: "inline-flex", alignItems: "center", justifyCenter: "center", p: 1.5, bgcolor: "#dbeafe", borderRadius: "50%", mb: 1.5, color: "#2563eb" }}>
                            <Key sx={{ fontSize: 36 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} color="slate.900">
                            Set New Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Enter your new account password below.
                        </Typography>
                    </Box>

                    {success ? (
                        <Box sx={{ textAlign: "center", py: 2 }}>
                            <Alert
                                severity="success"
                                icon={<CheckCircle fontSize="inherit" />}
                                sx={{ borderRadius: 2.5, textAlign: "left", mb: 3 }}
                            >
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Password Reset Complete!
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
                                    bgcolor: "#2563eb",
                                    "&:hover": { bgcolor: "#1d4ed8" },
                                }}
                            >
                                Sign In Now
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
                                    type={showPassword ? "text" : "password"}
                                    label="New Password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    size="small"
                                    disabled={loading || !uid || !token}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    type={showPassword ? "text" : "password"}
                                    label="Confirm New Password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    size="small"
                                    disabled={loading || !uid || !token}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={loading || !newPassword || !confirmPassword || !uid || !token}
                                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                                    sx={{
                                        borderRadius: 2.5,
                                        py: 1.2,
                                        fontWeight: 700,
                                        textTransform: "none",
                                        bgcolor: "#2563eb",
                                        "&:hover": { bgcolor: "#1d4ed8" },
                                    }}
                                >
                                    {loading ? "Resetting Password..." : "Update Password"}
                                </Button>

                                <Box sx={{ textAlign: "center", pt: 1 }}>
                                    <Button
                                        component={Link}
                                        href="/login"
                                        sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
                                    >
                                        Return to Login
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <Box sx={{ py: 10, textAlign: "center" }}>
                <CircularProgress />
            </Box>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
