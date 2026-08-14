"use client";

import { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    LinearProgress,
    Stack,
} from "@mui/material";
import { AccessTime, EventAvailable, HourglassEmpty } from "@mui/icons-material";

export function formatWeeksDisplay(totalWeeks, mode) {
    if (totalWeeks === undefined || totalWeeks === null || totalWeeks < 0) return "N/A";

    if (mode === "WEEKS") {
        return `${totalWeeks} ${totalWeeks === 1 ? "Week" : "Weeks"}`;
    }

    const months = Math.floor(totalWeeks / 4);
    const remWeeks = totalWeeks % 4;

    if (months === 0) {
        return `${remWeeks} ${remWeeks === 1 ? "Week" : "Weeks"}`;
    }
    if (remWeeks === 0) {
        return `${months} ${months === 1 ? "Month" : "Months"}`;
    }
    return `${months} ${months === 1 ? "Month" : "Months"} ${remWeeks} ${remWeeks === 1 ? "Week" : "Weeks"}`;
}

export default function CourseDurationProgress({ course, enrollmentDate }) {
    const [viewMode, setViewMode] = useState("MONTHS");

    if (!course || !course.duration_value || course.duration_value <= 0) {
        return null;
    }

    const val = Number(course.duration_value);
    const unit = course.duration_unit || "MONTHS";

    // Convert total course duration into total weeks
    const totalWeeks = unit === "WEEKS" ? val : val * 4;

    // Calculate time elapsed if enrollmentDate is present
    let weeksUsed = null;
    let weeksLeft = null;
    let progressPercent = 0;

    if (enrollmentDate) {
        const start = new Date(enrollmentDate);
        const today = new Date();
        const diffTime = Math.max(0, today - start);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        weeksUsed = Math.floor(diffDays / 7);
        weeksLeft = Math.max(0, totalWeeks - weeksUsed);
        progressPercent = Math.min(100, Math.round((weeksUsed / totalWeeks) * 100));
    }

    const totalText = formatWeeksDisplay(totalWeeks, viewMode);
    const usedText = weeksUsed !== null ? formatWeeksDisplay(weeksUsed, viewMode) : null;
    const leftText = weeksLeft !== null ? formatWeeksDisplay(weeksLeft, viewMode) : null;

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
                mb: 3,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTime sx={{ color: "#2563eb", fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="slate.900">
                        Course Duration & Timeline
                    </Typography>
                </Box>

                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => {
                        if (newMode) setViewMode(newMode);
                    }}
                    size="small"
                >
                    <ToggleButton value="MONTHS" sx={{ px: 1.5, py: 0.4, fontWeight: 700, fontSize: "0.75rem" }}>
                        Months View
                    </ToggleButton>
                    <ToggleButton value="WEEKS" sx={{ px: 1.5, py: 0.4, fontWeight: 700, fontSize: "0.75rem" }}>
                        Weeks View
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {enrollmentDate && weeksUsed !== null ? (
                <>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Course Completion Progress ({progressPercent}%)
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="primary">
                                Total: {totalText}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": {
                                    borderRadius: 4,
                                    bgcolor: progressPercent >= 100 ? "#16a34a" : "#2563eb",
                                },
                            }}
                        />
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                        <Box
                            sx={{
                                flex: 1,
                                bgcolor: "white",
                                p: 1.5,
                                borderRadius: 2,
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                            }}
                        >
                            <EventAvailable sx={{ color: "#16a34a", fontSize: 24 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                    Time Used
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="slate.900">
                                    {usedText}
                                </Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                flex: 1,
                                bgcolor: "white",
                                p: 1.5,
                                borderRadius: 2,
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                            }}
                        >
                            <HourglassEmpty sx={{ color: "#d97706", fontSize: 24 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                    Time Remaining
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="slate.900">
                                    {leftText}
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </>
            ) : (
                <Box sx={{ bgcolor: "white", p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        Total Duration
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                        {totalText}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}
