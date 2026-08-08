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
} from "@mui/material";
import {
    Add,
    Edit,
    Delete,
    AccountBalance,
    CheckCircle,
    Cancel,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

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
                    Manage system configuration and preferences.
                </Typography>
            </div>

            {/* Bank Accounts */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 4, border: "1px solid", borderColor: "grey.200", p: 4 }}
            >
                <BankAccountsManager />
            </Paper>

            <Divider />

            {/* System Settings */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 4, border: "1px solid", borderColor: "grey.200", p: 4 }}
            >
                <div className="space-y-6">
                    <div>
                        <Typography variant="h6" fontWeight={600} mb={3}>
                            Notifications
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.emailNotifications}
                                    onChange={() => handleToggle("emailNotifications")}
                                />
                            }
                            label="Email Notifications"
                        />

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mt={1}
                        >
                            Send email notifications for important system events.
                        </Typography>
                    </div>

                    <Divider />

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

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outlined"
                            onClick={() =>
                                setSettings({
                                    emailNotifications: true,
                                    autoApproveStudents: false,
                                    maintenanceMode: false,
                                    allowNewRegistrations: true,
                                    allowIdCardDownload: true,
                                })
                            }
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
