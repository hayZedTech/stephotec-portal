"use client";

import { useState, useEffect } from "react";
import {
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    Button,
    Divider,
    Box,
    Stack,
    TextField,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Tooltip,
    Card,
    CardContent,
    Grid,
} from "@mui/material";
import {
    Add,
    Edit,
    Delete,
    AccountBalance,
    CheckCircle,
    Cancel,
    Email as EmailIcon,
    Key as KeyIcon,
    PersonAdd as PersonAddIcon,
    ManageAccounts as ManageAccountsIcon,
    EventAvailable as EventAvailableIcon,
    FolderShared as FolderSharedIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    FactCheck as FactCheckIcon,
    Quiz as QuizIcon,
    WorkspacePremium as WorkspacePremiumIcon,
    Payment as PaymentIcon,
    NotificationsActive as NotificationsActiveIcon,
    Check as CheckIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

const EMAIL_NOTIFICATION_ACTIONS = [
    {
        category: "Authentication & Security",
        items: [
            {
                key: "email_password_reset",
                title: "Password Reset Requests",
                description: "Dispatches secure password reset link with verification token when requested on login page.",
                Icon: KeyIcon,
                color: "#7c3aed",
            },
            {
                key: "email_welcome",
                title: "New Student Welcome & Login Credentials",
                description: "Sends initial login details (Student ID & Temporary Password) and activation link upon account creation.",
                Icon: PersonAddIcon,
                color: "#2563eb",
            },
            {
                key: "email_status_change",
                title: "Account Status Updates",
                description: "Sends an alert when student account status is modified (e.g. Activated, Suspended, Graduated).",
                Icon: ManageAccountsIcon,
                color: "#0891b2",
            },
        ],
    },
    {
        category: "Learning & Course Activities",
        items: [
            {
                key: "email_attendance",
                title: "Daily Attendance Approvals & Rejections",
                description: "Sends an email to the student when an instructor/admin approves or rejects their daily attendance mark.",
                Icon: EventAvailableIcon,
                color: "#16a34a",
            },
            {
                key: "email_class_materials",
                title: "Daily Class Materials & Code Drops",
                description: "Notifies students and group members when instructors upload daily lecture files, notes, or code zips.",
                Icon: FolderSharedIcon,
                color: "#ea580c",
            },
            {
                key: "email_course_enrollment",
                title: "Course & Study Group Enrollment",
                description: "Notifies students when they are enrolled in a new course or assigned to a specific study group.",
                Icon: SchoolIcon,
                color: "#4f46e5",
            },
            {
                key: "email_new_assignment",
                title: "New Assignment Announcements",
                description: "Notifies enrolled students immediately when a new assignment, project, or homework task is published.",
                Icon: AssignmentIcon,
                color: "#9333ea",
            },
            {
                key: "email_assignment_grading",
                title: "Assignment Review & Grading Feedback",
                description: "Sends review feedback, remarks, and scores to students after an instructor grades their submission.",
                Icon: FactCheckIcon,
                color: "#0284c7",
            },
        ],
    },
    {
        category: "Assessments, Awards & Billing",
        items: [
            {
                key: "email_quiz_results",
                title: "Quiz & Assessment Result Releases",
                description: "Sends test scores, percentage grades, and performance ranking when quiz assessments are submitted.",
                Icon: QuizIcon,
                color: "#d97706",
            },
            {
                key: "email_certificate",
                title: "Certificate Issuance & Awards",
                description: "Sends celebratory emails with direct PDF download links when a course completion certificate is issued.",
                Icon: WorkspacePremiumIcon,
                color: "#ca8a04",
            },
            {
                key: "email_payment_receipt",
                title: "Payment Approvals & Tuition Receipts",
                description: "Sends official digital transaction receipts and updated balance breakdown when fee payments are recorded.",
                Icon: PaymentIcon,
                color: "#059669",
            },
        ],
    },
];

const emptyAccount = {
    bank_name: "",
    account_name: "",
    account_number: "",
    description: "",
    is_active: true,
};

function BankAccountsManager() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyAccount);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/payments/bank-accounts/");
            setAccounts(res.data.results || res.data || []);
        } catch {
            // Silently fall back to empty list — no toast on initial load failure
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAccounts(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setFormData(emptyAccount);
        setDialogOpen(true);
    };

    const openEdit = (account) => {
        setEditingId(account.id);
        setFormData({
            bank_name: account.bank_name,
            account_name: account.account_name,
            account_number: account.account_number,
            description: account.description || "",
            is_active: account.is_active,
        });
        setDialogOpen(true);
    };

    const handleClose = () => {
        if (saving) return;
        setDialogOpen(false);
        setEditingId(null);
        setFormData(emptyAccount);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSave = async () => {
        if (!formData.bank_name || !formData.account_name || !formData.account_number) {
            errorToast(null, "Bank Name, Account Name, and Account Number are required.");
            return;
        }
        try {
            setSaving(true);
            if (editingId) {
                await api.put(`/payments/bank-accounts/${editingId}/`, formData);
                successToast("Bank account updated.");
            } else {
                await api.post("/payments/bank-accounts/", formData);
                successToast("Bank account added.");
            }
            handleClose();
            loadAccounts();
        } catch (err) {
            errorToast(err, "Failed to save bank account");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (account) => {
        const confirmed = await confirmAction(
            `Delete "${account.bank_name} — ${account.account_name}"? Students will no longer see this account.`
        );
        if (!confirmed) return;
        try {
            await api.delete(`/payments/bank-accounts/${account.id}/`);
            successToast("Bank account deleted.");
            loadAccounts();
        } catch (err) {
            errorToast(err, "Failed to delete bank account");
        }
    };

    const handleToggleActive = async (account) => {
        try {
            await api.patch(`/payments/bank-accounts/${account.id}/`, {
                is_active: !account.is_active,
            });
            loadAccounts();
        } catch (err) {
            errorToast(err, "Failed to update status");
        }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccountBalance sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>School Bank Accounts</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    size="small"
                    onClick={openCreate}
                >
                    Add Account
                </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
                These accounts will be shown to students whenever they need to make a payment (e.g. handouts, course fees).
            </Typography>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={32} />
                </Box>
            ) : accounts.length === 0 ? (
                <Box
                    sx={{
                        border: "1px dashed",
                        borderColor: "grey.300",
                        borderRadius: 2,
                        p: 4,
                        textAlign: "center",
                    }}
                >
                    <AccountBalance sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography color="text.secondary">
                        No bank accounts added yet. Click &quot;Add Account&quot; to get started.
                    </Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "grey.50" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Bank</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Account Number</TableCell>
                                <TableCell sx={{ display: { xs: "none", md: "table-cell" }, fontWeight: 700 }}>Label</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{account.bank_name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{account.account_name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontFamily="monospace" fontWeight={600} letterSpacing={1}>
                                            {account.account_number}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {account.description || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={account.is_active ? "Click to deactivate" : "Click to activate"}>
                                            <Chip
                                                icon={account.is_active ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                                                label={account.is_active ? "Active" : "Inactive"}
                                                color={account.is_active ? "success" : "default"}
                                                size="small"
                                                onClick={() => handleToggleActive(account)}
                                                sx={{ cursor: "pointer" }}
                                            />
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEdit(account)} sx={{ color: "primary.main" }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(account)} sx={{ color: "error.main" }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onClose={(e, reason) => { if (reason === 'backdropClick') return; handleClose(e, reason); }} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingId ? "Edit Bank Account" : "Add Bank Account"}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Bank Name"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleChange}
                            fullWidth
                            required
                            size="small"
                            placeholder="e.g. Zenith Bank"
                        />
                        <TextField
                            label="Account Name"
                            name="account_name"
                            value={formData.account_name}
                            onChange={handleChange}
                            fullWidth
                            required
                            size="small"
                            placeholder="e.g. Stephotec Academy Ltd"
                        />
                        <TextField
                            label="Account Number"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            fullWidth
                            required
                            size="small"
                            placeholder="e.g. 1234567890"
                            slotProps={{ input: { inputMode: "numeric" } }}
                        />
                        <TextField
                            label="Description / Label (optional)"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            placeholder="e.g. For Course Fees, For Handouts..."
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    color="success"
                                />
                            }
                            label="Show to students (Active)"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={handleClose} disabled={saving} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {saving ? "Saving..." : editingId ? "Update" : "Add Account"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

const DEFAULT_SETTINGS = {
    emailNotifications: true,
    email_welcome: true,
    email_password_reset: true,
    email_status_change: true,
    email_course_enrollment: true,
    email_class_materials: true,
    email_new_assignment: true,
    email_assignment_grading: true,
    email_attendance: false,
    email_quiz_results: true,
    email_certificate: true,
    email_payment_receipt: true,
    autoApproveStudents: false,
    maintenanceMode: false,
    allowNewRegistrations: true,
    allowIdCardDownload: true,
};

export default function SettingsPage() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get("/admin/settings/");
                console.log("Settings page: loaded settings from API =", data);
                setTimeout(() => {
                    setSettings({ ...DEFAULT_SETTINGS, ...data });
                }, 0);
            } catch (e) {
                console.error("Failed to load settings from API", e);
                const savedSettings = localStorage.getItem("system_settings");
                if (savedSettings) {
                    try {
                        const parsed = JSON.parse(savedSettings);
                        setTimeout(() => {
                            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                        }, 0);
                    } catch (err) {
                        console.error("Failed to load settings from localStorage", err);
                    }
                }
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = (key) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSetAllEmails = (enable) => {
        setSettings((prev) => {
            const updated = { ...prev, emailNotifications: enable };
            EMAIL_NOTIFICATION_ACTIONS.forEach((cat) => {
                cat.items.forEach((item) => {
                    updated[item.key] = enable;
                });
            });
            return updated;
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            console.log("Settings page: saving settings to API =", settings);
            const { data } = await api.put("/admin/settings/", settings);
            localStorage.setItem("system_settings", JSON.stringify(data));
            setTimeout(() => {
                setSettings({ ...DEFAULT_SETTINGS, ...data });
            }, 0);
            successToast("Settings saved successfully.");
        } catch (error) {
            errorToast(error, "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Settings
                </Typography>
                <Typography color="text.secondary">
                    Manage system configuration, email triggers, and operational preferences.
                </Typography>
            </div>

            {/* Bank Accounts */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 4, border: "1px solid", borderColor: "grey.200", p: { xs: 2.5, sm: 4 } }}
            >
                <BankAccountsManager />
            </Paper>

            <Divider />

            {/* System & Notification Settings */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 4, border: "1px solid", borderColor: "grey.200", p: { xs: 2.5, sm: 4 } }}
            >
                <div className="space-y-6">
                    {/* EMAIL NOTIFICATIONS SECTION */}
                    <div>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.50", color: "primary.main", display: "flex" }}>
                                    <EmailIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        Email Notifications
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Configure automatic email dispatching for specific student and system events.
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleSetAllEmails(true)}
                                    startIcon={<CheckIcon fontSize="small" />}
                                    sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 2 }}
                                >
                                    Enable All
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => handleSetAllEmails(false)}
                                    startIcon={<CloseIcon fontSize="small" />}
                                    sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 2 }}
                                >
                                    Disable All
                                </Button>
                            </Box>
                        </Box>

                        {/* Master Switch Card */}
                        <Box
                            sx={{
                                p: 2.5,
                                mb: 3,
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: settings.emailNotifications ? "primary.200" : "grey.200",
                                bgcolor: settings.emailNotifications ? "primary.50" : "grey.50",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color={settings.emailNotifications ? "primary.900" : "text.secondary"}>
                                    Master Email Switch
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", mt: 0.25 }}>
                                    {settings.emailNotifications
                                        ? "Email service is actively sending emails according to the selected event toggles below."
                                        : "Email service is completely paused. No emails will be sent for any events."}
                                </Typography>
                            </Box>
                            <Switch
                                checked={settings.emailNotifications}
                                onChange={() => handleToggle("emailNotifications")}
                                color="primary"
                            />
                        </Box>

                        {/* Granular Action Toggles Grouped by Category */}
                        <Stack spacing={3}>
                            {EMAIL_NOTIFICATION_ACTIONS.map((category) => (
                                <Box
                                    key={category.category}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        borderRadius: 3,
                                        p: { xs: 2, sm: 2.5 },
                                        bgcolor: "#ffffff",
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        fontWeight={800}
                                        sx={{
                                            textTransform: "uppercase",
                                            letterSpacing: 0.75,
                                            color: "text.secondary",
                                            display: "block",
                                            mb: 1.5,
                                        }}
                                    >
                                        {category.category}
                                    </Typography>

                                    <Stack spacing={1.5} divider={<Divider />}>
                                        {category.items.map((item) => {
                                            const ItemIcon = item.Icon;
                                            const isChecked = !!settings[item.key];
                                            const isEffectivelyActive = settings.emailNotifications && isChecked;

                                            return (
                                                <Box
                                                    key={item.key}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: { xs: "flex-start", sm: "center" },
                                                        justifyContent: "space-between",
                                                        gap: 2,
                                                        py: 1,
                                                        opacity: settings.emailNotifications ? 1 : 0.6,
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                                        <Box
                                                            sx={{
                                                                p: 1,
                                                                borderRadius: 2,
                                                                bgcolor: `${item.color}15`,
                                                                color: item.color,
                                                                display: "flex",
                                                                mt: { xs: 0.25, sm: 0 },
                                                            }}
                                                        >
                                                            <ItemIcon sx={{ fontSize: 20 }} />
                                                        </Box>
                                                        <Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                                <Typography variant="body2" fontWeight={600} color="slate.900">
                                                                    {item.title}
                                                                </Typography>
                                                                {item.key === "email_attendance" && (
                                                                    <Chip
                                                                        label="Daily Attendance"
                                                                        size="small"
                                                                        sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                                                                    />
                                                                )}
                                                            </Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.4 }}>
                                                                {item.description}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Tooltip
                                                        title={
                                                            !settings.emailNotifications
                                                                ? "Master email switch is turned off"
                                                                : isChecked
                                                                ? "Click to disable this email"
                                                                : "Click to enable this email"
                                                        }
                                                    >
                                                        <span>
                                                            <Switch
                                                                size="small"
                                                                checked={isChecked}
                                                                disabled={!settings.emailNotifications}
                                                                onChange={() => handleToggle(item.key)}
                                                                color="primary"
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </div>

                    <Divider />

                    {/* STUDENT MANAGEMENT SECTION */}
                    <div>
                        <Typography variant="h6" fontWeight={600} mb={3}>
                            Student Management
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.autoApproveStudents}
                                    onChange={() => handleToggle("autoApproveStudents")}
                                />
                            }
                            label="Auto-Approve New Students"
                        />

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mt={1}
                        >
                            Automatically approve new student registrations.
                        </Typography>

                        <Box mt={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.allowIdCardDownload}
                                        onChange={() => handleToggle("allowIdCardDownload")}
                                    />
                                }
                                label="Allow Student ID Card Downloads"
                            />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                mt={1}
                            >
                                Enable or disable digital ID card viewing and downloads for students.
                            </Typography>
                        </Box>
                    </div>

                    <Divider />

                    {/* SYSTEM MAINTENANCE SECTION */}
                    <div>
                        <Typography variant="h6" fontWeight={600} mb={3}>
                            System
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.maintenanceMode}
                                    onChange={() => handleToggle("maintenanceMode")}
                                />
                            }
                            label="Maintenance Mode"
                        />

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mt={1}
                        >
                            Disable access for all users except administrators.
                        </Typography>

                        <Box mt={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.allowNewRegistrations}
                                        onChange={() => handleToggle("allowNewRegistrations")}
                                    />
                                }
                                label="Allow New Registrations"
                            />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                mt={1}
                            >
                                Allow new students to register in the system.
                            </Typography>
                        </Box>
                    </div>

                    <Divider />

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outlined"
                            onClick={() => setSettings(DEFAULT_SETTINGS)}
                        >
                            Reset
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </Paper>
        </div>
    );
}
