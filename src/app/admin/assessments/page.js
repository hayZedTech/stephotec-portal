"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
} from "@mui/material";
import {
    Assignment as AssignmentIcon,
    Quiz as QuizIcon,
} from "@mui/icons-material";
import AssignmentManager from "@/components/admin/assignments/AssignmentManager";
import AdminQuizManager from "@/components/admin/quizzes/AdminQuizManager";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function AdminAssessmentsPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") === "quizzes" ? 1 : 0;
    const [tabValue, setTabValue] = useState(initialTab);

    return (
        <div className="space-y-6">
            <div>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                    Assignments & Quizzes Hub
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Create student assignments, grade submissions, and manage course practice tests and quizzes.
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
                    onChange={(e, val) => setTabValue(val)}
                    aria-label="assessments management tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                        px: { xs: 1, sm: 3 },
                        "& .MuiTab-root": {
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            minHeight: { xs: 48, sm: 56 },
                            px: { xs: 1, sm: 2 },
                            textTransform: "none",
                            fontWeight: 700,
                        },
                    }}
                >
                    <Tab
                        label="Assignments Manager"
                        icon={<AssignmentIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Quizzes & Practice Tests"
                        icon={<QuizIcon />}
                        iconPosition="start"
                    />
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <TabPanel value={tabValue} index={0}>
                        <AssignmentManager />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <AdminQuizManager />
                    </TabPanel>
                </Box>
            </Paper>
        </div>
    );
}
