"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { errorToast, successToast } from "@/lib/toast";
import api from "@/lib/axios";
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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    MenuItem,
    Stack,
} from "@mui/material";
import { School, DateRange, Edit, CloudUpload, Close, Badge } from "@mui/icons-material";

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

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

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [showPictureDialog, setShowPictureDialog] = useState(false);
    const [editFormData, setEditFormData] = useState({
        address: "",
        additional_phone: "",
        bio: "",
    });
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        additional_phone: "",
        date_of_birth: "",
        gender: "",
        address: "",
        state_of_origin: "",
        bio: "",
        username: "",
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const response = await api.get("/student/profile-page/");
                const data = response.data;
                setFormData({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    additional_phone: data.additional_phone || "",
                    date_of_birth: data.date_of_birth || "",
                    gender: data.gender || "",
                    address: data.address || "",
                    state_of_origin: data.state_of_origin || "",
                    bio: data.bio || "",
                    username: data.username || "",
                });
                setEditFormData({
                    address: data.address || "",
                    additional_phone: data.additional_phone || "",
                    bio: data.bio || "",
                });
            } catch (error) {
                errorToast(error, "Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            errorToast(null, "Only JPEG, PNG, and WebP images are allowed");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            errorToast(null, "File size must be less than 5MB");
            return;
        }

        setProfilePictureFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicturePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const uploadProfilePicture = async () => {
        if (!profilePictureFile) return;

        setUploading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('file', profilePictureFile);

            const response = await api.post('/upload/profile-picture/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const updatedUser = { ...user, profilePictureUrl: response.data.url };
            setUser(updatedUser);
            setProfilePictureFile(null);
            setProfilePicturePreview(null);
            setShowPictureDialog(false);
            successToast("Profile picture updated successfully!");
        } catch (error) {
            errorToast(error, "Failed to upload profile picture");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const response = await api.patch("/student/profile/", editFormData);
            setUser(response.data);
            setFormData((prev) => ({
                ...prev,
                ...editFormData,
            }));
            setShowEditModal(false);
            successToast("Profile updated successfully!");
        } catch (error) {
            errorToast(error, "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditModal = () => {
        setEditFormData({
            address: formData.address || "",
            state_of_origin: formData.state_of_origin || "",
            additional_phone: formData.additional_phone || "",
            bio: formData.bio || "",
        });
        setShowEditModal(true);
    };

    if (!user) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    const primaryCourse = user.courses?.find((c) => c.is_primary);
    const activeCourses = user.courses?.filter((c) => c.status === "ACTIVE") || [];

    return (
        <div className="space-y-6">
            <div>
                <Typography variant="h4" fontWeight={700}>
                    My Profile
                </Typography>
                <Typography color="text.secondary">
                    View and manage your profile information.
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
                            src={user?.profilePictureUrl}
                            sx={{
                                width: 100,
                                height: 100,
                                bgcolor: "#2563eb",
                                fontSize: 40,
                                fontWeight: 700,
                            }}
                        >
                            {user?.firstName?.charAt(0)?.toUpperCase()}
                            {user?.lastName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <IconButton
                            onClick={() => setShowPictureDialog(true)}
                            sx={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                bgcolor: "primary.main",
                                color: "white",
                                "&:hover": { bgcolor: "primary.dark" },
                                width: 36,
                                height: 36,
                            }}
                        >
                            <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={700} mb={1}>
                            {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography color="text.secondary" mb={2}>
                            {user?.email}
                        </Typography>
                        <Chip
                            label={user?.status || "ACTIVE"}
                            color={user?.status === "ACTIVE" ? "success" : "warning"}
                            size="small"
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Typography variant="h6" fontWeight={700}>
                            Personal Information
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleOpenEditModal}
                        >
                            Edit Profile
                        </Button>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Student ID" value={formData.username} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="First Name" value={formData.first_name} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Last Name" value={formData.last_name} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Email" value={formData.email} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Phone" value={formData.phone} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Date of Birth" value={formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : ""} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <InfoCard label="Gender" value={formData.gender} />
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box>
                    <Typography variant="h6" fontWeight={700} mb={3}>
                        Additional Information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid xs={12}>
                            <InfoCard label="Address" value={formData.address} />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <InfoCard label="State of Origin" value={formData.state_of_origin} />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <InfoCard label="Additional Phone" value={formData.additional_phone} />
                        </Grid>
                        <Grid xs={12}>
                            <InfoCard label="Bio" value={formData.bio} />
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <div>
                <Typography variant="h6" fontWeight={700} mb={2}>
                    Course Information
                </Typography>

                <Grid container spacing={3}>
                    <Grid xs={12} sm={6} md={3}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "grey.200",
                            }}
                        >
                            <CardContent sx={{ textAlign: "center" }}>
                                <School sx={{ fontSize: 32, color: "#2563eb", mb: 1 }} />
                                <Typography variant="h4" fontWeight={700}>
                                    {user?.courses?.length || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Courses
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid xs={12} sm={6} md={3}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "grey.200",
                            }}
                        >
                            <CardContent sx={{ textAlign: "center" }}>
                                <School sx={{ fontSize: 32, color: "#16a34a", mb: 1 }} />
                                <Typography variant="h4" fontWeight={700}>
                                    {activeCourses.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active Courses
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid xs={12} sm={6} md={3}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "grey.200",
                            }}
                        >
                            <CardContent sx={{ textAlign: "center" }}>
                                <DateRange sx={{ fontSize: 32, color: "#0ea5e9", mb: 1 }} />
                                <Typography variant="h4" fontWeight={700}>
                                    {primaryCourse ? "✓" : "—"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Primary Course
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid xs={12} sm={6} md={3}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "grey.200",
                            }}
                        >
                            <CardContent sx={{ textAlign: "center" }}>
                                <Badge sx={{ fontSize: 32, color: "#8b5cf6", mb: 1 }} />
                                <Typography variant="h4" fontWeight={700}>
                                    {user?.status === "ACTIVE" ? "✓" : "—"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Account Status
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </div>

            {primaryCourse && (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: "2px solid",
                        borderColor: "#2563eb",
                        p: 4,
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={2}>
                        Primary Course Details
                    </Typography>

                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Course Name:</Typography>
                            <Typography fontWeight={600}>{primaryCourse.course.name}</Typography>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Course Code:</Typography>
                            <Typography fontWeight={600}>{primaryCourse.course.code_prefix}</Typography>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Enrollment ID:</Typography>
                            <Typography fontWeight={600}>{primaryCourse.enrollment_id}</Typography>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Admission Year:</Typography>
                            <Typography fontWeight={600}>{primaryCourse.admission_year}</Typography>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Status:</Typography>
                            <Chip
                                label={primaryCourse.status}
                                color={primaryCourse.status === "ACTIVE" ? "success" : "info"}
                                size="small"
                            />
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Started:</Typography>
                            <Typography fontWeight={600}>
                                {new Date(primaryCourse.started_at).toLocaleDateString()}
                            </Typography>
                        </Box>

                        {primaryCourse.completed_at && (
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography color="text.secondary">Completed:</Typography>
                                <Typography fontWeight={600}>
                                    {new Date(primaryCourse.completed_at).toLocaleDateString()}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Paper>
            )}

            <Dialog open={showPictureDialog} onClose={() => setShowPictureDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        Change Profile Picture
                        <IconButton onClick={() => setShowPictureDialog(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        {profilePicturePreview ? (
                            <Box sx={{ mb: 2, textAlign: "center" }}>
                                <Avatar
                                    src={profilePicturePreview}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        mx: "auto",
                                        mb: 2,
                                    }}
                                />
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    {profilePictureFile?.name}
                                </Typography>
                            </Box>
                        ) : null}
                        <Box
                            sx={{
                                border: "2px dashed",
                                borderColor: "grey.300",
                                borderRadius: 2,
                                p: 3,
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
                                disabled={uploading}
                            />
                            <CloudUpload sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                            <Typography variant="body2" fontWeight={500}>
                                Click to upload or drag and drop
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                PNG, JPG, WebP up to 5MB
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPictureDialog(false)}>Cancel</Button>
                    <Button
                        onClick={uploadProfilePicture}
                        variant="contained"
                        disabled={!profilePictureFile || uploading}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        Edit Profile
                        <IconButton onClick={() => setShowEditModal(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={editFormData.address}
                                onChange={handleEditChange}
                                multiline
                                rows={2}
                            />

                            <TextField
                                fullWidth
                                label="Additional Phone Number"
                                name="additional_phone"
                                type="tel"
                                value={editFormData.additional_phone}
                                onChange={handleEditChange}
                            />

                            <TextField
                                fullWidth
                                label="Bio"
                                name="bio"
                                value={editFormData.bio}
                                onChange={handleEditChange}
                                multiline
                                rows={3}
                                placeholder="Tell us about yourself"
                            />

                            <Alert severity="info">
                                To change your state of origin, name, email, phone number, date of birth, or gender, please contact the admin.
                            </Alert>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveProfile}
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
