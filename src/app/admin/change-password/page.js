"use client";

import { useState } from "react";
import {
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
    InputAdornment,
    IconButton,
    Card,
    CardContent,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    Lock,
    CheckCircle,
    Shield,
    Key,
    Info,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { errorToast, successToast } from "@/lib/toast";
import api from "@/lib/axios";

const tips = [
    "Use at least 8 characters",
    "Mix uppercase and lowercase letters",
    "Include numbers and symbols",
    "Avoid using your name or username",
    "Don't reuse old passwords",
];

export default function ChangePasswordPage() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const passwordsMatch =
        formData.new_password && formData.confirm_password === formData.new_password;
    const passwordMismatch =
        formData.confirm_password && formData.confirm_password !== formData.new_password;

    const isFormValid = () =>
        formData.old_password &&
        formData.new_password &&
        formData.confirm_password &&
        formData.new_password.length >= 8 &&
        formData.new_password === formData.confirm_password;

    const validateForm = () => {
        const newErrors = {};
        if (!formData.old_password) newErrors.old_password = "Current password is required";
        if (!formData.new_password) newErrors.new_password = "New password is required";
        else if (formData.new_password.length < 8)
            newErrors.new_password = "Password must be at least 8 characters";
        if (!formData.confirm_password)
            newErrors.confirm_password = "Please confirm your new password";
        else if (formData.new_password !== formData.confirm_password)
            newErrors.confirm_password = "Passwords do not match";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            await api.post("/admin/change-password/", {
                old_password: formData.old_password,
                new_password: formData.new_password,
                confirm_password: formData.confirm_password,
            });
            successToast("Password changed successfully! Please log in again.");
            setTimeout(() => logout(), 1500);
        } catch (error) {
            errorToast(error, "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    bgcolor: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(2px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                }}
            >
                <Box
                    sx={{
                        bgcolor: "white",
                        borderRadius: 3,
                        p: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <CircularProgress size={48} />
                    <Typography>Loading...</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                    Change Password
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Keep your account secure by updating your password regularly.
                </Typography>
            </div>

            <Box sx={{ maxWidth: 900, mx: "auto", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: "flex-start" }}>
                {/* Form Card */}
                <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 58%" }, minWidth: 0 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "grey.200",
                            overflow: "hidden",
                        }}
                    >
                        {/* Card Header */}
                        <Box
                            sx={{
                                px: { xs: 2.5, sm: 4 },
                                py: 3,
                                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 2.5,
                                    bgcolor: "rgba(255,255,255,0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Lock sx={{ color: "white", fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={700} color="white" sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                                    Update Password
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem" }}>
                                    You'll be required to log in again after changing
                                </Typography>
                            </Box>
                        </Box>

                        {/* Form Body */}
                        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Current Password */}
                                <Box>
                                    <Typography variant="body2" fontWeight={600} mb={1} color="text.primary">
                                        Current Password
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="old_password"
                                        placeholder="Enter your current password"
                                        type={showOld ? "text" : "password"}
                                        value={formData.old_password}
                                        onChange={handleChange}
                                        error={!!errors.old_password}
                                        helperText={errors.old_password}
                                        size="small"
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Key sx={{ fontSize: 18, color: "text.secondary" }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowOld(!showOld)} edge="end" tabIndex={-1} disabled={loading}>
                                                            {showOld ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>

                                <Divider />

                                {/* New Password */}
                                <Box>
                                    <Typography variant="body2" fontWeight={600} mb={1} color="text.primary">
                                        New Password
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="new_password"
                                        placeholder="Enter your new password"
                                        type={showNew ? "text" : "password"}
                                        value={formData.new_password}
                                        onChange={handleChange}
                                        error={!!errors.new_password}
                                        helperText={errors.new_password || "Must be at least 8 characters"}
                                        size="small"
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Lock sx={{ fontSize: 18, color: "text.secondary" }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowNew(!showNew)} edge="end" tabIndex={-1} disabled={loading}>
                                                            {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>

                                {/* Confirm Password */}
                                <Box>
                                    <Typography variant="body2" fontWeight={600} mb={1} color="text.primary">
                                        Confirm New Password
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="confirm_password"
                                        placeholder="Re-enter your new password"
                                        type={showConfirm ? "text" : "password"}
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        error={passwordMismatch}
                                        helperText={
                                            passwordMismatch
                                                ? "Passwords do not match"
                                                : passwordsMatch
                                                ? "✓ Passwords match"
                                                : " "
                                        }
                                        size="small"
                                        sx={{
                                            "& .MuiFormHelperText-root": {
                                                color: passwordsMatch
                                                    ? "#16a34a"
                                                    : passwordMismatch
                                                    ? "#ef4444"
                                                    : undefined,
                                            },
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Lock sx={{ fontSize: 18, color: "text.secondary" }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" tabIndex={-1} disabled={loading}>
                                                            {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    type="submit"
                                    disabled={loading || !isFormValid()}
                                    size="large"
                                    sx={{
                                        mt: 1,
                                        borderRadius: 2.5,
                                        py: 1.5,
                                        fontWeight: 700,
                                        fontSize: "0.95rem",
                                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                        boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                                            boxShadow: "0 6px 20px rgba(37,99,235,0.45)",
                                        },
                                        "&.Mui-disabled": { opacity: 0.6 },
                                    }}
                                >
                                    {loading ? (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <CircularProgress size={18} sx={{ color: "white" }} />
                                            Changing Password...
                                        </Box>
                                    ) : (
                                        "Change Password"
                                    )}
                                </Button>
                            </form>
                        </Box>
                    </Paper>
                </Box>

                {/* Tips Card */}
                <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 38%" }, minWidth: 0 }}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "grey.200",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2.5,
                                bgcolor: "#f0fdf4",
                                borderBottom: "1px solid",
                                borderColor: "#bbf7d0",
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                            }}
                        >
                            <Shield sx={{ color: "#16a34a", fontSize: 22 }} />
                            <Typography fontWeight={700} color="#15803d" sx={{ fontSize: "0.95rem" }}>
                                Password Tips
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <List dense disablePadding>
                                {tips.map((tip, i) => (
                                    <ListItem key={i} disablePadding sx={{ mb: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <CheckCircle sx={{ fontSize: 18, color: "#16a34a" }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={tip}
                                            slotProps={{ primary: { style: { fontSize: "0.875rem", color: "#374151" } } }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "#bfdbfe",
                            bgcolor: "#eff6ff",
                            mt: 3,
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, sm: 3 }, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                            <Info sx={{ color: "#2563eb", fontSize: 20, mt: 0.2, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.85rem", color: "#1e40af", lineHeight: 1.6 }}>
                                After changing your password, you will be logged out of all active sessions and will need to sign in again.
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </div>
    );
}
