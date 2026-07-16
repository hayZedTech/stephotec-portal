"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { errorToast, successToast } from "@/lib/toast";
import api from "@/lib/axios";
import {
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
    InputAdornment,
    IconButton,
    Divider,
    Alert,
    MenuItem,
} from "@mui/material";
import { Visibility, VisibilityOff, CloudUpload } from "@mui/icons-material";

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

export default function ActivateProfilePage() {
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [formData, setFormData] = useState({
        phone: "",
        date_of_birth: "",
        gender: "",
        address: "",
        state_of_origin: "",
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

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            errorToast(null, "Only JPEG, PNG, and WebP images are allowed");
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            setProfilePicturePreview(event.target.result);
        };
        reader.readAsDataURL(file);

        // Auto-upload
        setUploading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('file', file);

            const response = await api.post('/upload/profile-picture/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setProfilePictureUrl(response.data.url);
            successToast("Profile picture uploaded successfully!");
            setErrors((prev) => ({
                ...prev,
                profilePicture: "",
            }));
        } catch (error) {
            setProfilePicturePreview(null);
            errorToast(error, "Failed to upload profile picture");
        } finally {
            setUploading(false);
        }
    };

    const passwordsMatch = formData.new_password && formData.confirm_password === formData.new_password;
    const passwordMismatch = formData.confirm_password && formData.confirm_password !== formData.new_password;

    const isFormValid = () => {
        return (
            profilePictureUrl &&
            formData.new_password &&
            formData.confirm_password &&
            formData.new_password.length >= 8 &&
            formData.new_password === formData.confirm_password &&
            formData.phone &&
            formData.date_of_birth &&
            formData.gender &&
            formData.address &&
            formData.state_of_origin
        );
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!profilePictureUrl) {
            newErrors.profilePicture = "Profile picture is required";
        }
        
        if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = "Passwords do not match";
        }
        
        if (formData.new_password.length < 8) {
            newErrors.new_password = "Password must be at least 8 characters";
        }
        
        if (!formData.phone) {
            newErrors.phone = "Phone number is required";
        }

        if (!formData.date_of_birth) {
            newErrors.date_of_birth = "Date of birth is required";
        }

        if (!formData.gender) {
            newErrors.gender = "Gender is required";
        }

        if (!formData.address) {
            newErrors.address = "Address is required";
        }

        if (!formData.state_of_origin) {
            newErrors.state_of_origin = "State of origin is required";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);

        try {
            const { confirm_password, ...submitData } = formData;
            
            const dataToSubmit = {
                ...submitData,
                profile_picture_url: profilePictureUrl,
            };
            
            await api.put("/student/activate-profile/", dataToSubmit);
            successToast("Profile activated successfully!");
            router.push("/dashboard");
        } catch (error) {
            errorToast(error, "Failed to activate profile.");
        } finally {
            setLoading(false);
        }
    };

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
                        Loading...
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 550,
                    p: 4,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                }}
            >
                <Box mb={4}>
                    <Typography variant="h5" fontWeight={700} mb={1}>
                        Activate Your Account
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        Complete your profile setup to get started.
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                            Profile Picture *
                        </Typography>
                        
                        {profilePicturePreview ? (
                            <Box
                                sx={{
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    border: "2px solid",
                                    borderColor: "grey.300",
                                    mb: 2,
                                    position: "relative",
                                }}
                            >
                                <img
                                    src={profilePicturePreview}
                                    alt="Profile preview"
                                    style={{
                                        width: "100%",
                                        height: 250,
                                        objectFit: "cover",
                                    }}
                                />
                                <Box
                                    component="label"
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        bgcolor: "rgba(0, 0, 0, 0.6)",
                                        color: "white",
                                        p: 1.5,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        transition: "all 0.3s",
                                        "&:hover": {
                                            bgcolor: "rgba(0, 0, 0, 0.8)",
                                        },
                                    }}
                                >
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleProfilePictureChange}
                                        disabled={uploading || loading}
                                    />
                                    <Typography variant="caption" fontWeight={500}>
                                        Change Photo
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    border: "2px dashed",
                                    borderColor: errors.profilePicture ? "error.main" : "grey.300",
                                    borderRadius: 2,
                                    p: 4,
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        bgcolor: "action.hover",
                                    },
                                }}
                                component="label"
                            >
                                <input
                                    type="file"
                                    hidden
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleProfilePictureChange}
                                    disabled={uploading || loading}
                                />
                                <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                                <Typography variant="body2" fontWeight={500}>
                                    Click to upload or drag and drop
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    PNG, JPG, WebP up to 5MB
                                </Typography>
                            </Box>
                        )}

                        {uploading && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                                <CircularProgress size={20} />
                                <Typography variant="body2">Uploading...</Typography>
                            </Box>
                        )}

                        {profilePictureUrl && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                Profile picture uploaded successfully
                            </Alert>
                        )}

                        {errors.profilePicture && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                                {errors.profilePicture}
                            </Typography>
                        )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                            Personal Information
                        </Typography>

                        <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            error={!!errors.phone}
                            helperText={errors.phone}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Date of Birth"
                            name="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            required
                            error={!!errors.date_of_birth}
                            helperText={errors.date_of_birth}
                            sx={{ mb: 2 }}
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            select
                            label="Gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                            error={!!errors.gender}
                            helperText={errors.gender}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="MALE">Male</MenuItem>
                            <MenuItem value="FEMALE">Female</MenuItem>
                            <MenuItem value="OTHER">Other</MenuItem>
                        </TextField>

                        <TextField
                            fullWidth
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            error={!!errors.address}
                            helperText={errors.address}
                            multiline
                            rows={2}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            select
                            label="State of Origin"
                            name="state_of_origin"
                            value={formData.state_of_origin}
                            onChange={handleChange}
                            required
                            error={!!errors.state_of_origin}
                            helperText={errors.state_of_origin}
                        >
                            {NIGERIAN_STATES.map((state) => (
                                <MenuItem key={state} value={state}>
                                    {state}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                            Security
                        </Typography>

                        <TextField
                            fullWidth
                            label="New Password"
                            name="new_password"
                            type={showPassword ? "text" : "password"}
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
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                disabled={loading}
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
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
                    </Box>

                    <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={loading || uploading || !isFormValid()}
                        sx={{ mt: 4 }}
                    >
                        {loading ? "Activating..." : "Activate Profile"}
                    </Button>
                </form>
            </Paper>
        </div>
    );
}
