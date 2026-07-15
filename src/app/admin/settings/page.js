"use client";

import { useState } from "react";
import {
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    Button,
    Divider,
    Box,
} from "@mui/material";
import { successToast, errorToast } from "@/lib/toast";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        autoApproveStudents: false,
        maintenanceMode: false,
        allowNewRegistrations: true,
    });

    const [saving, setSaving] = useState(false);

    const handleToggle = (key) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
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

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    p: 4,
                }}
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
                                    onChange={() =>
                                        handleToggle("emailNotifications")
                                    }
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
                            Send email notifications for important system
                            events.
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
                                    onChange={() =>
                                        handleToggle("autoApproveStudents")
                                    }
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
                                    onChange={() =>
                                        handleToggle("maintenanceMode")
                                    }
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
                                        checked={
                                            settings.allowNewRegistrations
                                        }
                                        onChange={() =>
                                            handleToggle(
                                                "allowNewRegistrations"
                                            )
                                        }
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
