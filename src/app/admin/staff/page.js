"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Avatar,
    InputAdornment,
    MenuItem,
    Alert,
} from "@mui/material";
import {
    Search,
    Add,
    VisibilityOutlined,
    EditOutlined,
    DeleteOutlineOutlined,
    Badge as BadgeIcon,
    Close,
    ContentCopy,
    Check,
    AdminPanelSettings,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import ImageZoom from "@/components/ui/ImageZoom";
import StaffIDCardModal from "@/components/common/StaffIDCardModal";
import { useAuth } from "@/providers/AuthProvider";

const DEFAULT_STAFF_TITLE_OPTIONS = [
    "CEO & Founder",
    "Chief Executive Officer (CEO)",
    "Managing Director",
    "Academic Director",
    "School Registrar",
    "Senior Lecturer & Instructor",
    "Academic Staff / Facilitator",
    "IT Director & Systems Manager",
    "Bursar / Lead Accountant",
    "Administrative Officer",
    "System Administrator",
];

export default function AdminStaffPage() {
    const { user, refreshUser } = useAuth();
    const isSuperuser = Boolean(user?.is_superuser || user?.isSuperUser);

    useEffect(() => {
        if (refreshUser) {
            refreshUser();
        }
    }, []);

    const [staffList, setStaffList] = useState([]);
    const [titleOptions, setTitleOptions] = useState(DEFAULT_STAFF_TITLE_OPTIONS);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog state
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [openIDModal, setOpenIDModal] = useState(false);

    const [selectedStaff, setSelectedStaff] = useState(null);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        job_title: "System Administrator",
        status: "ACTIVE",
    });
    const [formLoading, setFormLoading] = useState(false);

    const loadStaff = async () => {
        try {
            setLoading(true);
            const [staffRes, titlesRes] = await Promise.allSettled([
                api.get("/admin/staff/"),
                api.get("/admin/staff/titles/"),
            ]);

            if (staffRes.status === "fulfilled") {
                setStaffList(Array.isArray(staffRes.value.data) ? staffRes.value.data : staffRes.value.data.results || []);
            }

            if (titlesRes.status === "fulfilled" && Array.isArray(titlesRes.value.data?.titles)) {
                setTitleOptions(titlesRes.value.data.titles);
            }
        } catch (error) {
            errorToast(error, "Failed to load staff list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const filteredStaff = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return staffList;
        return staffList.filter(
            (s) =>
                s.first_name?.toLowerCase().includes(keyword) ||
                s.last_name?.toLowerCase().includes(keyword) ||
                s.username?.toLowerCase().includes(keyword) ||
                s.email?.toLowerCase().includes(keyword) ||
                s.job_title?.toLowerCase().includes(keyword)
        );
    }, [staffList, search]);

    const handleOpenAdd = () => {
        if (!isSuperuser) return;
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            job_title: "System Administrator",
            status: "ACTIVE",
        });
        setOpenAddDialog(true);
    };

    const handleOpenEdit = (staff) => {
        if (!isSuperuser && staff.id !== user?.id) return;
        setSelectedStaff(staff);
        setFormData({
            first_name: staff.first_name || "",
            last_name: staff.last_name || "",
            email: staff.email || "",
            phone: staff.phone || "",
            job_title: staff.job_title || "System Administrator",
            status: staff.status || "ACTIVE",
        });
        setOpenEditDialog(true);
    };

    const handleOpenView = (staff) => {
        setSelectedStaff(staff);
        setCopiedPassword(false);
        setOpenViewDialog(true);
    };

    const handleOpenIDCard = (staff) => {
        setSelectedStaff({
            ...staff,
            role_title: staff.job_title || "System Administrator",
        });
        setOpenIDModal(true);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!isSuperuser) return;
        try {
            setFormLoading(true);
            const response = await api.post("/admin/staff/", formData);
            successToast("Staff / Administrator created successfully!");
            setOpenAddDialog(false);
            if (response.data?.staff_details) {
                handleOpenView(response.data.staff_details);
            }
            await loadStaff();
        } catch (error) {
            errorToast(error, "Failed to create staff account.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaff) return;
        if (!isSuperuser && selectedStaff.id !== user?.id) return;
        try {
            setFormLoading(true);
            await api.patch(`/admin/staff/${selectedStaff.id}/`, formData);
            successToast("Staff account updated successfully!");
            setOpenEditDialog(false);
            await loadStaff();
        } catch (error) {
            errorToast(error, "Failed to update staff account.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteStaff = (staff) => {
        if (!isSuperuser) return;
        confirmAction(
            `Delete administrator ${staff.first_name} ${staff.last_name} (${staff.username})?`,
            async () => {
                try {
                    await api.delete(`/admin/staff/${staff.id}/`);
                    successToast("Staff deleted successfully.");
                    await loadStaff();
                } catch (error) {
                    errorToast(error, "Failed to delete staff.");
                }
            },
            null,
            "Delete Staff",
            "Cancel",
            true
        );
    };

    const handleCopyPassword = () => {
        if (selectedStaff?.temporary_password) {
            navigator.clipboard.writeText(selectedStaff.temporary_password);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2500);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Page Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <AdminPanelSettings sx={{ color: "#d97706", fontSize: { xs: 28, sm: 36 } }} /> Staff & Administrators
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                        {isSuperuser
                            ? "Manage academic administrators, staff credentials, and ID cards."
                            : "View your official staff designation and print your Staff ID Card."}
                    </Typography>
                </Box>

                {isSuperuser && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenAdd}
                        sx={{ borderRadius: 2.5, px: 3, textTransform: "none", fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                    >
                        Add Administrator
                    </Button>
                )}
            </Box>

            {/* Non-Superuser Notice Banner */}
            {!isSuperuser && (
                <Alert severity="info" icon={<AdminPanelSettings fontSize="inherit" />} sx={{ borderRadius: 3, fontWeight: 600 }}>
                    <Typography variant="subtitle2" fontWeight={800}>
                        Staff Self-Service View
                    </Typography>
                    <Typography variant="caption">
                        You are currently viewing your official staff record. Superuser privileges are required to view or manage other staff members.
                    </Typography>
                </Alert>
            )}

            {/* Search Bar (Only shown to superuser if multiple staff exist) */}
            {isSuperuser && (
                <TextField
                    placeholder="Search staff by name, title, email, or staff ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            )}

            {/* Staff List Table */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {loading ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <CircularProgress sx={{ color: "#d97706" }} />
                    </Box>
                ) : filteredStaff.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: "center" }}>
                        <Typography color="text.secondary">No staff records found.</Typography>
                    </Box>
                ) : (
                    <Stack divider={<Box sx={{ borderBottom: "1px solid #f1f5f9" }} />}>
                        {filteredStaff.map((staff) => (
                            <Box
                                key={staff.id}
                                sx={{
                                    p: 2,
                                    px: { xs: 2, sm: 3 },
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 2,
                                    "&:hover": { bgcolor: "#f8fafc" },
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 260 }}>
                                    <ImageZoom
                                        src={staff.profile_picture_url}
                                        alt={staff.first_name}
                                        avatarProps={{ sx: { width: 48, height: 48, bgcolor: "#0f172a", fontSize: 18, fontWeight: 700, border: "2px solid #fbbf24" } }}
                                    >
                                        {staff.first_name?.charAt(0)?.toUpperCase() || "A"}
                                    </ImageZoom>
                                    <Box>
                                        <Typography fontWeight={700} variant="body1" color="slate.900">
                                            {staff.first_name} {staff.last_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                                            {staff.job_title || "System Administrator"} - {staff.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="caption" color="text.disabled" display="block">
                                            Staff ID
                                        </Typography>
                                        <Typography variant="body2" fontWeight={800} fontFamily="monospace" color="slate.900">
                                            {staff.username}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        label={staff.status || "ACTIVE"}
                                        color={staff.status === "ACTIVE" ? "success" : "default"}
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                    />

                                    {/* Action Buttons */}
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="Generate / Print Staff ID Card">
                                            <IconButton size="small" onClick={() => handleOpenIDCard(staff)} sx={{ color: "#d97706" }}>
                                                <BadgeIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="View Profile">
                                            <IconButton size="small" onClick={() => handleOpenView(staff)}>
                                                <VisibilityOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {(isSuperuser || staff.id === user?.id) && (
                                            <Tooltip title="Edit Profile">
                                                <IconButton size="small" onClick={() => handleOpenEdit(staff)}>
                                                    <EditOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {isSuperuser && (
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDeleteStaff(staff)}>
                                                    <DeleteOutlineOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>

            {/* ADD STAFF DIALOG (Superuser Only) */}
            {isSuperuser && (
                <Dialog open={openAddDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenAddDialog(false); }} maxWidth="xs" fullWidth>
                    <form onSubmit={handleAddSubmit}>
                        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            Add Administrator / Staff
                            <IconButton onClick={() => setOpenAddDialog(false)} size="small">
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Stack spacing={2} sx={{ pt: 1 }}>
                                <TextField
                                    label="First Name"
                                    required
                                    fullWidth
                                    size="small"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                                <TextField
                                    label="Last Name"
                                    required
                                    fullWidth
                                    size="small"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                                <TextField
                                    select
                                    label="Staff Role / Title"
                                    fullWidth
                                    size="small"
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                >
                                    {titleOptions.map((title) => (
                                        <MenuItem key={title} value={title}>
                                            {title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Email Address"
                                    type="email"
                                    required
                                    fullWidth
                                    size="small"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <TextField
                                    label="Phone Number"
                                    fullWidth
                                    size="small"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={formLoading} sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}>
                                {formLoading ? "Creating..." : "Create Staff Account"}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            )}

            {/* VIEW STAFF DIALOG */}
            <Dialog open={openViewDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenViewDialog(false); }} maxWidth="xs" fullWidth>
                {selectedStaff && (
                    <>
                        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            Staff Details — {selectedStaff.username}
                            <IconButton onClick={() => setOpenViewDialog(false)} size="small">
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Stack spacing={2} sx={{ pt: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar src={selectedStaff.profile_picture_url} sx={{ width: 64, height: 64, bgcolor: "#0f172a", fontSize: 24, border: "2px solid #fbbf24" }}>
                                        {selectedStaff.first_name?.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            {selectedStaff.first_name} {selectedStaff.last_name}
                                        </Typography>
                                        <Typography variant="body2" color="warning.main" fontWeight={700}>
                                            {selectedStaff.job_title || "System Administrator"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                            Staff ID: {selectedStaff.username}
                                        </Typography>
                                    </Box>
                                </Box>

                                {isSuperuser && selectedStaff.temporary_password && (
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 2.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                                            TEMPORARY PASSWORD
                                        </Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
                                            <Typography variant="body1" fontWeight={800} fontFamily="monospace" color="slate.900">
                                                {selectedStaff.temporary_password}
                                            </Typography>
                                            <Button
                                                size="small"
                                                startIcon={copiedPassword ? <Check color="success" /> : <ContentCopy />}
                                                onClick={handleCopyPassword}
                                                sx={{ textTransform: "none" }}
                                            >
                                                {copiedPassword ? "Copied!" : "Copy"}
                                            </Button>
                                        </Box>
                                    </Paper>
                                )}

                                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                                    <Typography variant="caption" color="text.secondary">Email Address</Typography>
                                    <Typography variant="body2" fontWeight={600}>{selectedStaff.email}</Typography>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
                            <Button
                                startIcon={<BadgeIcon />}
                                onClick={() => {
                                    setOpenViewDialog(false);
                                    handleOpenIDCard(selectedStaff);
                                }}
                                sx={{ color: "#d97706", fontWeight: 700 }}
                            >
                                Generate Staff ID Card
                            </Button>
                            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* EDIT STAFF DIALOG */}
            <Dialog open={openEditDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenEditDialog(false); }} maxWidth="xs" fullWidth>
                <form onSubmit={handleEditSubmit}>
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        Edit Profile Details
                        <IconButton onClick={() => setOpenEditDialog(false)} size="small">
                            <Close />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField
                                label="First Name"
                                required
                                fullWidth
                                size="small"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                            <TextField
                                label="Last Name"
                                required
                                fullWidth
                                size="small"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                            {isSuperuser && (
                                <TextField
                                    select
                                    label="Staff Role / Title"
                                    fullWidth
                                    size="small"
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                >
                                    {titleOptions.map((title) => (
                                        <MenuItem key={title} value={title}>
                                            {title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                            <TextField
                                label="Email Address"
                                type="email"
                                required
                                fullWidth
                                size="small"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <TextField
                                label="Phone Number"
                                fullWidth
                                size="small"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            {isSuperuser && (
                                <TextField
                                    select
                                    label="Account Status"
                                    fullWidth
                                    size="small"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                    <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
                                    <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                                </TextField>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={formLoading} sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}>
                            {formLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* STAFF ID CARD MODAL */}
            <StaffIDCardModal
                open={openIDModal}
                onClose={() => setOpenIDModal(false)}
                staff={selectedStaff}
            />
        </Box>
    );
}
