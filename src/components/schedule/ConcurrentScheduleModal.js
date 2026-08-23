"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Chip,
    Stack,
    Button,
    IconButton,
    Paper,
    Divider,
    Alert,
    AlertTitle,
} from "@mui/material";
import {
    Close,
    WarningAmber,
    CheckCircle,
    AccessTime,
    Person,
    Workspaces,
    LocationOn,
    VideoCameraFront,
    School,
    Edit,
} from "@mui/icons-material";
import { formatTime12 } from "@/utils/scheduleUtils";

export default function ConcurrentScheduleModal({
    open,
    onClose,
    conflictData,
    onEditSchedule,
}) {
    if (!conflictData) return null;

    // conflictData can be a single slot: { dayKey, timeLabel, schedules: [...], clashingStudents: [...] }
    // or multiple slots: { isAllSlots: true, allConflictSlots: [...] }
    const isMultiSlot = Boolean(conflictData.isAllSlots && conflictData.allConflictSlots);
    const slotsToRender = isMultiSlot ? conflictData.allConflictSlots : [conflictData];
    const singleSlotList = conflictData.schedules || conflictData.allSchedules || [];
    const singleSlotCount = singleSlotList.length || conflictData.count || 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: "hidden" },
            }}
        >
            {/* Modal Header */}
            <DialogTitle
                sx={{
                    bgcolor: "#0f172a",
                    color: "white",
                    py: 2,
                    px: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            bgcolor: "rgba(239, 68, 68, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #ef4444",
                        }}
                    >
                        <WarningAmber sx={{ color: "#ef4444", fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>
                            Concurrent Schedules & Clashes
                        </Typography>
                        <Typography variant="caption" sx={{ color: "grey.400" }}>
                            {isMultiSlot
                                ? `Inspecting ${slotsToRender.length} time slot(s) with overlapping classes`
                                : `${conflictData.dayKey} · ${conflictData.timeLabel} (${singleSlotCount} simultaneous class${singleSlotCount === 1 ? "" : "es"})`}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc" }}>
                <Stack spacing={3}>
                    {slotsToRender.map((slot, sIdx) => {
                        const scheduleList = slot.schedules || slot.allSchedules || [];
                        const slotCount = scheduleList.length || slot.count || 0;
                        const clashingStudents = slot.clashingStudents || [];
                        const hasStudentClashes = clashingStudents.length > 0;

                        return (
                            <Paper
                                key={sIdx}
                                elevation={0}
                                sx={{
                                    p: { xs: 2, sm: 2.5 },
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: hasStudentClashes ? "#fecaca" : "grey.300",
                                    bgcolor: "white",
                                    boxShadow: hasStudentClashes ? "0 4px 14px rgba(239, 68, 68, 0.08)" : "none",
                                }}
                            >
                                {/* Slot Time Banner */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 2,
                                        pb: 1.5,
                                        borderBottom: "1px solid",
                                        borderColor: "grey.200",
                                        flexWrap: "wrap",
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Chip
                                            label={slot.dayKey}
                                            size="small"
                                            sx={{ bgcolor: "#0f172a", color: "white", fontWeight: 800, px: 0.5 }}
                                        />
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                                            <Typography variant="subtitle2" fontWeight={800} color="primary">
                                                {slot.timeLabel}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Chip
                                        icon={<WarningAmber sx={{ fontSize: "0.85rem !important", color: "white !important" }} />}
                                        label={`${slotCount} Classes Scheduled`}
                                        size="small"
                                        sx={{
                                            bgcolor: "#dc2626",
                                            color: "white",
                                            fontWeight: 800,
                                            fontSize: "0.7rem",
                                        }}
                                    />
                                </Box>

                                {/* Double-Booking / Safety Alert */}
                                {hasStudentClashes ? (
                                    <Alert
                                        severity="error"
                                        icon={<WarningAmber sx={{ color: "#dc2626" }} />}
                                        sx={{ mb: 2.5, borderRadius: 2, bgcolor: "#fef2f2", border: "1px solid #fecaca" }}
                                    >
                                        <AlertTitle sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#991b1b" }}>
                                            Student Double-Booking Warning ({clashingStudents.length} student{clashingStudents.length === 1 ? "" : "s"})
                                        </AlertTitle>
                                        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#7f1d1d", mb: 1 }}>
                                            The following student(s) are assigned to 2 or more classes happening at this same time slot:
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                            {clashingStudents.map((st) => (
                                                <Chip
                                                    key={st.id}
                                                    icon={<Person sx={{ fontSize: "0.8rem !important", color: "#991b1b !important" }} />}
                                                    label={st.full_name || `${st.first_name || ""} ${st.last_name || ""}`.trim() || st.username || st.email}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "#fee2e2",
                                                        border: "1px solid #f87171",
                                                        color: "#991b1b",
                                                        fontWeight: 800,
                                                        fontSize: "0.72rem",
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Alert>
                                ) : (
                                    <Alert
                                        severity="success"
                                        icon={<CheckCircle sx={{ color: "#16a34a" }} />}
                                        sx={{ mb: 2.5, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                                    >
                                        <AlertTitle sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#166534" }}>
                                            Parallel Sessions (Allowed)
                                        </AlertTitle>
                                        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#14532d" }}>
                                            These classes have separate students and tutors running concurrently. No students are double-booked.
                                        </Typography>
                                    </Alert>
                                )}

                                {/* Schedules Breakdown Grid */}
                                <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={1.2}>
                                    CLASSES IN THIS TIME SLOT:
                                </Typography>

                                <Stack spacing={1.5}>
                                    {scheduleList.map((sched) => {
                                        const cardColor = sched.color_tag || "#2563eb";
                                        const hasDirectStudents = sched.assigned_students_details && sched.assigned_students_details.length > 0;
                                        const hasGroups = sched.assigned_groups_details && sched.assigned_groups_details.length > 0;

                                        return (
                                            <Paper
                                                key={sched.id}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: "#f8fafc",
                                                    border: "1px solid",
                                                    borderColor: "grey.200",
                                                    borderLeft: `5px solid ${cardColor}`,
                                                }}
                                            >
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1, gap: 1 }}>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: "0.92rem", color: "#0f172a" }}>
                                                            {sched.title}
                                                        </Typography>
                                                        {sched.course_name && (
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}>
                                                                <School sx={{ fontSize: 13, color: "text.secondary" }} />
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    {sched.course_name}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                                        <Chip
                                                            label={sched.mode === "PHYSICAL" ? "Physical" : sched.mode}
                                                            size="small"
                                                            color={sched.mode === "PHYSICAL" ? "success" : "primary"}
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800 }}
                                                        />
                                                        {onEditSchedule && (
                                                            <Button
                                                                size="small"
                                                                startIcon={<Edit sx={{ fontSize: "0.85rem !important" }} />}
                                                                onClick={() => {
                                                                    onClose();
                                                                    onEditSchedule(sched);
                                                                }}
                                                                sx={{
                                                                    py: 0.3,
                                                                    px: 1,
                                                                    fontSize: "0.72rem",
                                                                    fontWeight: 700,
                                                                    textTransform: "none",
                                                                    borderRadius: 1.5,
                                                            }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        )}
                                                    </Stack>
                                                </Box>

                                                {/* Tutor & Venue */}
                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mb: 1.2 }}>
                                                    {sched.instructor_name && (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <Person sx={{ fontSize: 14, color: "text.secondary" }} />
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                Instructor: <strong>{sched.instructor_name}</strong>
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {sched.venue_or_link && (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <LocationOn sx={{ fontSize: 14, color: "text.secondary" }} />
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                Venue: <strong>{sched.venue_or_link}</strong>
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Stack>

                                                {/* Assigned Target Breakdown (Groups & Students) */}
                                                <Box sx={{ pt: 1, borderTop: "1px dashed", borderColor: "grey.300" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.6}>
                                                        Target (Assigned Groups & Students):
                                                    </Typography>

                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                                                        {hasGroups &&
                                                            sched.assigned_groups_details.map((g) => (
                                                                <Chip
                                                                    key={g.id}
                                                                    icon={<Workspaces sx={{ fontSize: "0.75rem !important" }} />}
                                                                    label={`${g.name} (${g.member_count ?? g.members_count ?? g.members_detail?.length ?? 0} students)`}
                                                                    size="small"
                                                                    sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#f1f5f9", border: "1px solid", borderColor: "grey.300" }}
                                                                />
                                                            ))}

                                                        {hasDirectStudents &&
                                                            sched.assigned_students_details.map((st) => {
                                                                const isClashing = clashingStudents.some((cs) => String(cs.id) === String(st.id));
                                                                const stName = st.full_name || `${st.first_name || ""} ${st.last_name || ""}`.trim() || st.username || st.email;

                                                                return (
                                                                    <Chip
                                                                        key={st.id}
                                                                        icon={<Person sx={{ fontSize: "0.75rem !important", color: isClashing ? "#dc2626 !important" : "#1d4ed8 !important" }} />}
                                                                        label={stName}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 22,
                                                                            fontSize: "0.68rem",
                                                                            fontWeight: 700,
                                                                            bgcolor: isClashing ? "#fee2e2" : "#eff6ff",
                                                                            color: isClashing ? "#991b1b" : "#1d4ed8",
                                                                            border: "1px solid",
                                                                            borderColor: isClashing ? "#f87171" : "#bfdbfe",
                                                                        }}
                                                                    />
                                                                );
                                                            })}

                                                        {!hasGroups && !hasDirectStudents && (
                                                            <Chip
                                                                label="Entire Course (All Enrolled Students)"
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ height: 22, fontSize: "0.68rem", fontWeight: 600 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: "white" }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        bgcolor: "#0f172a",
                        "&:hover": { bgcolor: "#1e293b" },
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
