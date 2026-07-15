"use client";

import { useState } from "react";
import {
    Box,
    Tabs,
    Tab,
    Paper,
    Typography,
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

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <div className="space-y-6">
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Learning Management
                </Typography>
                <Typography color="text.secondary">
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
                        px: 3,
                    }}
                >
                    <Tab
                        label="Learning Content"
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

                <Box sx={{ p: 3 }}>
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
