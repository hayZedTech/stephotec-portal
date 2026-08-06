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
    Button,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from "@mui/material";
import { Edit, CloudUpload, Close } from "@mui/icons-material";
import ImageZoom from "@/components/ui/ImageZoom";

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
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [showPictureDialog, setShowPictureDialog] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [profileData, setProfileData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        additional_phone: "",
        bio: "",
        address: "",
        job_title: "",
    });
    const [editFormData, setEditFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        additional_phone: "",
        bio: "",
        address: "",
        job_title: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await api.get("/admin/profile/");
                const data = res.data;
                setProfileData({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    phone: data.phone || "",
                    additional_phone: data.additional_phone || "",
                    bio: data.bio || "",
                    address: data.address || "",
                    job_title: data.job_title || "",
                });
            } catch (error) {
                errorToast(error, "Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleOpenEditModal = () => {
        setEditFormData({ ...profileData });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await api.patch("/admin/profile/", editFormData);
            const data = res.data;
            setProfileData({
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                phone: data.phone || "",
                additional_phone: data.additional_phone || "",
                bio: data.bio || "",
                address: data.address || "",
                job_title: data.job_title || "",
            });

            const updatedUser = {
                ...user,
                firstName: data.first_name,
                lastName: data.last_name,
                phone: data.phone,
                jobTitle: data.job_title,
            };
            setUser(updatedUser);

            const { saveSession, getAccessToken, getRefreshToken } = await import("@/utils/storage");
            saveSession({ access: getAccessToken(), refresh: getRefreshToken(), user: updatedUser });

            setShowEditModal(false);
            successToast("Profile updated successfully!");
        } catch (error) {
            errorToast(error, "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            errorToast(null, "Only JPEG, PNG, and WebP images are allowed");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            errorToast(null, "File size must be less than 5MB");
            return;
        }

        setProfilePictureFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setProfilePicturePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const uploadProfilePicture = async () => {
        if (!profilePictureFile) return;
        setUploading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("file", profilePictureFile);
            const response = await api.post("/upload/profile-picture/", formDataToSend, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const updatedUser = { ...user, profilePictureUrl: response.data.url };
            setUser(updatedUser);

            const { saveSession, getAccessToken, getRefreshToken } = await import("@/utils/storage");
            saveSession({ access: getAccessToken(), refresh: getRefreshToken(), user: updatedUser });

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

    const handleCloseProfilePictureDialog = () => {
        setShowPictureDialog(false);
        setProfilePictureFile(null);
        setProfilePicturePreview(null);
    };

    return (
        <div className="space-y-6">
            {/* LOADING OVERLAY */}
            {loading && (
                <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(2px)" }}>
                    <Box sx={{ bgcolor: "background.paper", borderRadius: 3, p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                        <CircularProgress size={48} />
                        <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>Loading profile...</Typography>
                    </Box>
                </Box>
            )}

            <div>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>Admin Profile</Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>View and manage your account information.</Typography>
            </div>

            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "grey.200", p: { xs: 2, sm: 4 } }}>
                <Box sx={{ display: "flex", gap: { xs: 2, sm: 3 }, alignItems: "flex-start", mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
                    {/* Avatar with edit button */}
                    <Box sx={{ position: "relative" }}>
                        <ImageZoom
                            src={user?.profilePictureUrl}
                            alt={`${user?.firstName} ${user?.lastName}`}
                            avatarProps={{ sx: { width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 }, bgcolor: "#7c3aed", fontSize: { xs: 32, sm: 40 }, fontWeight: 700 } }}
                        >
                            {user?.firstName?.charAt(0)?.toUpperCase()}
                            {user?.lastName?.charAt(0)?.toUpperCase()}
                        </ImageZoom>
                        <IconButton
                            onClick={() => setShowPictureDialog(true)}
                            sx={{ position: "absolute", bottom: 0, right: 0, bgcolor: "#7c3aed", color: "white", "&:hover": { bgcolor: "#6d28d9" }, width: 32, height: 32 }}
                        >
                            <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={700} mb={1} sx={{ fontSize: { xs: "1.125rem", sm: "1.5rem" } }}>
                            {profileData.first_name || user?.firstName} {profileData.last_name || user?.lastName}
                        </Typography>
                        <Typography color="text.secondary" mb={1} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, wordBreak: "break-word" }}>
                            {user?.email}
                        </Typography>
                        {profileData.job_title && (
                            <Typography color="text.secondary" mb={2} sx={{ fontSize: "0.875rem", fontStyle: "italic" }}>
                                {profileData.job_title}
                            </Typography>
                        )}
                        <Chip label={user?.role || "ADMIN"} color="primary" size="small" />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Personal Info Section */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 0 } }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                            Account Information
                        </Typography>
                        <Button variant="outlined" size="small" onClick={handleOpenEditModal} sx={{ borderColor: "#7c3aed", color: "#7c3aed", "&:hover": { borderColor: "#6d28d9", bgcolor: "#f5f3ff" } }}>
                            Edit Profile
                        </Button>
                    </Box>

                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="Username" value={user?.username} /></Grid>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="Email" value={user?.email} /></Grid>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="Role" value={user?.role} /></Grid>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="First Name" value={profileData.first_name} /></Grid>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="Last Name" value={profileData.last_name} /></Grid>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="Job Title" value={profileData.job_title} /></Grid>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="Phone" value={profileData.phone} /></Grid>
                        <Grid xs={12} sm={6} md={4}><InfoCard label="Additional Phone" value={profileData.additional_phone} /></Grid>
                        <Grid xs={12}><InfoCard label="Address" value={profileData.address} /></Grid>
                        {profileData.bio && <Grid xs={12}><InfoCard label="Bio" value={profileData.bio} /></Grid>}
                    </Grid>
                </Box>
            </Paper>

            {/* Edit Profile Dialog */}
            <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1, sm: 2 } } } }}>
                <DialogTitle sx={{ py: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        Edit Profile
                        <IconButton onClick={() => setShowEditModal(false)} size="small"><Close /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ pt: 2 }}>
                        <Stack spacing={2.5}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField fullWidth label="First Name" name="first_name" value={editFormData.first_name} onChange={handleEditChange} size="small" />
                                <TextField fullWidth label="Last Name" name="last_name" value={editFormData.last_name} onChange={handleEditChange} size="small" />
                            </Stack>
                            <TextField fullWidth label="Job Title" name="job_title" value={editFormData.job_title} onChange={handleEditChange} size="small" placeholder="e.g. System Administrator" />
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField fullWidth label="Phone" name="phone" type="tel" value={editFormData.phone} onChange={handleEditChange} size="small" />
                                <TextField fullWidth label="Additional Phone" name="additional_phone" type="tel" value={editFormData.additional_phone} onChange={handleEditChange} size="small" />
                            </Stack>
                            <TextField fullWidth label="Address" name="address" value={editFormData.address} onChange={handleEditChange} multiline rows={2} size="small" />
                            <TextField fullWidth label="Bio" name="bio" value={editFormData.bio} onChange={handleEditChange} multiline rows={3} placeholder="Tell us about yourself..." size="small" />
                            <Alert severity="info" sx={{ fontSize: "0.8rem" }}>
                                To change your email or username, please contact the system administrator.
                            </Alert>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
                    <Button onClick={() => setShowEditModal(false)} size="small">Cancel</Button>
                    <Button onClick={handleSaveProfile} variant="contained" disabled={saving} size="small" sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Profile Picture Upload Dialog */}
            <Dialog open={showPictureDialog} onClose={handleCloseProfilePictureDialog} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1, sm: 2 } } } }}>
                <DialogTitle sx={{ py: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        Change Profile Picture
                        <IconButton onClick={handleCloseProfilePictureDialog} size="small"><Close /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ pt: 2 }}>
                        {profilePicturePreview && (
                            <Box sx={{ mb: 2, textAlign: "center" }}>
                                <Avatar src={profilePicturePreview} sx={{ width: 120, height: 120, mx: "auto", mb: 2 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>{profilePictureFile?.name}</Typography>
                            </Box>
                        )}
                        <Box sx={{ border: "2px dashed", borderColor: "grey.300", borderRadius: 2, p: 3, textAlign: "center", cursor: "pointer", transition: "all 0.3s", "&:hover": { borderColor: "#7c3aed", bgcolor: "action.hover" } }} component="label">
                            <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleProfilePictureChange} disabled={uploading} />
                            <CloudUpload sx={{ fontSize: 40, color: "#7c3aed", mb: 1 }} />
                            <Typography variant="body2" fontWeight={500}>Click to upload or drag and drop</Typography>
                            <Typography variant="caption" color="text.secondary">PNG, JPG, WebP up to 2MB</Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
                    <Button onClick={handleCloseProfilePictureDialog} size="small">Cancel</Button>
                    <Button onClick={uploadProfilePicture} variant="contained" disabled={!profilePictureFile || uploading} size="small" sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}>
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
