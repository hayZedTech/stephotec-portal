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
    Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { errorToast, successToast } from "@/lib/toast";
import api from "@/lib/axios";

export default function ChangePasswordPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const passwordsMatch = formData.new_password && formData.confirm_password === formData.new_password;
    const passwordMismatch = formData.confirm_password && formData.confirm_password !== formData.new_password;

    const isFormValid = () => {
        return (
            formData.old_password &&
            formData.new_password &&
            formData.confirm_password &&
            formData.new_password.length >= 8 &&
            formData.new_password === formData.confirm_password
        );
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.old_password) {
            newErrors.old_password = "Old password is required";
        }

        if (!formData.new_password) {
            newErrors.new_password = "New password is required";
        }

        if (formData.new_password.length < 8) {
            newErrors.new_password = "Password must be at least 8 characters";
        }

        if (!formData.confirm_password) {
            newErrors.confirm_password = "Confirm password is required";
        }

        if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            await api.post("/student/change-password/", {
                old_password: formData.old_password,
                new_password: formData.new_password,
                confirm_password: formData.confirm_password,
            });

            successToast("Password changed successfully!");
            setFormData({
                old_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (error) {
            errorToast(error, "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 500,
                    p: 4,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                }}
            >
                <Box mb={4}>
                    <Typography variant="h5" fontWeight={700} mb={1}>
                        Change Password
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        Update your account password to keep your account secure.
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <TextField
                        fullWidth
                        label="Old Password"
                        name="old_password"
                        type={showOldPassword ? "text" : "password"}
                        value={formData.old_password}
                        onChange={handleChange}
                        required
                        error={!!errors.old_password}
                        helperText={errors.old_password}
                        sx={{ mb: 2 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            edge="end"
                                            disabled={loading}
                                            tabIndex={-1}
                                        >
                                            {showOldPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="New Password"
                        name="new_password"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.new_password}
                        onChange={handleChange}
                        required
                        error={!!errors.new_password}
                        helperText={errors.new_password || "Must be at least 8 characters"}
                        sx={{ mb: 2 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            edge="end"
                                            disabled={loading}
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Confirm Password"
                        name="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        error={passwordMismatch}
                        helperText={passwordMismatch ? "Passwords do not match" : passwordsMatch ? "Passwords match" : ""}
                        sx={{
                            mb: 2,
                            "& .MuiOutlinedInput-root": {
                                borderColor: passwordsMatch ? "#4caf50" : passwordMismatch ? "#f44336" : undefined,
                                "&.Mui-focused fieldset": {
                                    borderColor: passwordsMatch ? "#4caf50" : passwordMismatch ? "#f44336" : undefined,
                                },
                            },
                            "& .MuiFormHelperText-root": {
                                color: passwordsMatch ? "#4caf50" : passwordMismatch ? "#f44336" : undefined,
                            },
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                            disabled={loading}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
                        Make sure your new password is strong and unique. You will need to log in again after changing your password.
                    </Alert>

                    <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={loading || !isFormValid()}
                        sx={{ mt: 4 }}
                    >
                        {loading ? "Changing Password..." : "Change Password"}
                    </Button>
                </form>
            </Paper>
        </div>
    );
}
