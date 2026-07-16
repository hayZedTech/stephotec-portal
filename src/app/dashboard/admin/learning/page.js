"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Tabs,
    Tab,
    Paper,
    Typography,
    CircularProgress,
} from "@mui/material";
import {
    School,
    Assignment,
    CheckCircle,
    CardGiftcard,
} from "@mui/icons-material";
import LearningContentManager from "@/components/admin/learning/LearningContentManager";
import AssignmentManager from "@/components/admin/assignments/AssignmentManager";
import AttendanceManager from "@/components/admin/attendance/AttendanceManager";
import CertificateManager from "@/components/admin/certificates/CertificateManager";
import HandoutManager from "@/components/admin/handouts/HandoutManager";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function AdminLearningPage() {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <div className="space-y-6">
            {loading && (
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
                            Loading learning materials...
                        </Typography>
                    </Box>
                </Box>
            )}
            <div>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                    Learning Management
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Manage courses, assignments, attendance, certificates, and handouts.
                </Typography>
            </div>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "grey.200",
                }}
            >
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="learning management tabs"
                    sx={{
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                        px: { xs: 1, sm: 3 },
                        "& .MuiTab-root": {
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            minHeight: { xs: 48, sm: 56 },
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 1, sm: 2 },
                            textTransform: "none",
                            fontWeight: 500,
                        },
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label="Learning"
                        icon={<School />}
                        iconPosition="start"
                        id="tab-0"
                    />
                    <Tab
                        label="Assignments"
                        icon={<Assignment />}
                        iconPosition="start"
                        id="tab-1"
                    />
                    <Tab
                        label="Attendance"
                        icon={<CheckCircle />}
                        iconPosition="start"
                        id="tab-2"
                    />
                    <Tab
                        label="Certificates"
                        icon={<CardGiftcard />}
                        iconPosition="start"
                        id="tab-3"
                    />
                    <Tab
                        label="Handouts"
                        icon={<School />}
                        iconPosition="start"
                        id="tab-4"
                    />
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <TabPanel value={tabValue} index={0}>
                        <LearningContentManager />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <AssignmentManager />
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                        <AttendanceManager />
                    </TabPanel>

                    <TabPanel value={tabValue} index={3}>
                        <CertificateManager />
                    </TabPanel>

                    <TabPanel value={tabValue} index={4}>
                        <HandoutManager />
                    </TabPanel>
                </Box>
            </Paper>
        </div>
    );
}
