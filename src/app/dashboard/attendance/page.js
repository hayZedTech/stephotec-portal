"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/axios";
import { successToast, errorToast } from "@/lib/toast";
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Chip,
    Stack,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    LinearProgress,
} from "@mui/material";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    HourglassEmpty,
    Cancel,
    EventAvailable,
    CalendarMonth,
    TrendingUp,
    Close,
} from "@mui/icons-material";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function getStatusMeta(approvalStatus) {
    switch (approvalStatus) {
        case "APPROVED":
            return { color: "#16a34a", bg: "#dcfce7", border: "#86efac", icon: "✓", label: "Approved" };
        case "REJECTED":
            return { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", icon: "✗", label: "Rejected" };
        case "PENDING":
            return { color: "#d97706", bg: "#fef3c7", border: "#fcd34d", icon: "⏳", label: "Pending" };
        default:
            return null;
    }
}

export default function StudentAttendancePage() {
    const { user } = useAuth();
    const today = new Date();

    const [selectedCourse, setSelectedCourse] = useState("");
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [attendanceMap, setAttendanceMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0, total: 0 });
    const [filterStatus, setFilterStatus] = useState("");

    const courses = user?.courses || [];

    useEffect(() => {
        if (courses.length > 0 && !selectedCourse) {
            const primary = courses.find((c) => c.is_primary) || courses[0];
            setSelectedCourse(primary.id);
        }
    }, [courses]);

    const fetchAttendance = useCallback(async () => {
        if (!selectedCourse) return;
        setLoading(true);
        try {
            const month = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
            const res = await api.get("/learning/attendance/my_attendance/", {
                params: { student_course: selectedCourse, month },
            });
            const records = res.data || [];
            const map = {};
            records.forEach((r) => { map[r.date] = r; });
            setAttendanceMap(map);

            // compute stats for the whole course (no month filter)
            const allRes = await api.get("/learning/attendance/my_attendance/", {
                params: { student_course: selectedCourse },
            });
            const all = allRes.data || [];
            setStats({
                approved: all.filter((r) => r.approval_status === "APPROVED").length,
                pending: all.filter((r) => r.approval_status === "PENDING").length,
                rejected: all.filter((r) => r.approval_status === "REJECTED").length,
                total: all.length,
            });
        } catch (err) {
            errorToast(err, "Failed to load attendance");
        } finally {
            setLoading(false);
        }
    }, [selectedCourse, currentMonth, currentYear]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleDayClick = (dateStr) => {
        const clickedDate = new Date(dateStr);
        const todayStr = today.toISOString().split("T")[0];

        // Can only mark today or past dates, not future
        if (dateStr > todayStr) return;

        // Already has a record
        if (attendanceMap[dateStr]) return;

        setSelectedDate(dateStr);
        setRemarks("");
        setConfirmOpen(true);
    };

    const handleMarkAttendance = async () => {
        if (!selectedDate || !selectedCourse) return;
        setMarking(true);
        try {
            await api.post("/learning/attendance/mark/", {
                student_course: selectedCourse,
                date: selectedDate,
                remarks,
            });
            successToast("Attendance marked — awaiting admin approval");
            setConfirmOpen(false);
            fetchAttendance();
        } catch (err) {
            errorToast(err, "Failed to mark attendance");
        } finally {
            setMarking(false);
        }
    };

    const handleCancelAttendance = async (record) => {
        if (record.approval_status !== "PENDING") return;
        try {
            await api.delete(`/learning/attendance/${record.id}/cancel/`);
            successToast("Attendance request cancelled");
            fetchAttendance();
        } catch (err) {
            errorToast(err, "Failed to cancel");
        }
    };

    // Build calendar grid
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayStr = today.toISOString().split("T")[0];

    const calendarCells = [];
    for (let i = 0; i < firstDay; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

    const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

    const selectedCourseName = courses.find((c) => c.id === selectedCourse)?.course?.name || "";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Typography variant="h4" fontWeight={700}>
                    My Attendance
                </Typography>
                <Typography color="text.secondary">
                    Mark your attendance on days you come in. Each mark requires admin approval.
                </Typography>
            </div>

            {/* Course Selector */}
            {courses.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Select Course</InputLabel>
                    <Select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        label="Select Course"
                    >
                        {courses.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                                {c.course.name}
                                {c.is_primary && (
                                    <Chip label="Primary" size="small" sx={{ ml: 1 }} color="primary" />
                                )}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: "Total Marked", value: stats.total, color: "#2563eb", bg: "#eff6ff" },
                    { label: "Approved", value: stats.approved, color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Pending", value: stats.pending, color: "#d97706", bg: "#fffbeb" },
                    { label: "Rejected", value: stats.rejected, color: "#dc2626", bg: "#fef2f2" },
                ].map((s) => (
                    <Paper
                        key={s.label}
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 2.5,
                            textAlign: "center",
                            background: s.bg,
                        }}
                    >
                        <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>
                            {s.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {s.label}
                        </Typography>
                    </Paper>
                ))}
            </div>

            {/* Approval Rate Bar */}
            {stats.total > 0 && (
                <Paper
                    elevation={0}
                    sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", p: 3 }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <TrendingUp sx={{ color: "#16a34a", fontSize: 20 }} />
                            <Typography variant="body2" fontWeight={600}>
                                Approval Rate
                            </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="#16a34a">
                            {approvalRate}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={approvalRate}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: "#e5e7eb",
                            "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 4 },
                        }}
                    />
                </Paper>
            )}

            {/* Filter Bar */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", p: 2 }}
            >
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "nowrap" }}>
                        Filter by:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Approval Status</InputLabel>
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            label="Approval Status"
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="APPROVED">Approved</MenuItem>
                            <MenuItem value="REJECTED">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                    {filterStatus && (
                        <Button size="small" variant="outlined" color="inherit" onClick={() => setFilterStatus("")}>
                            Clear Filter
                        </Button>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                        {filterStatus
                            ? `Showing ${Object.values(attendanceMap).filter((r) => r.approval_status === filterStatus).length} ${filterStatus.toLowerCase()} records`
                            : `${Object.keys(attendanceMap).length} records this month`}
                    </Typography>
                </Box>
            </Paper>

            {/* Calendar */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}
            >
                {/* Calendar Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 2,
                        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                        color: "white",
                    }}
                >
                    <IconButton
                        onClick={() => {
                            if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
                            else setCurrentMonth((m) => m - 1);
                        }}
                        sx={{ color: "white" }}
                    >
                        <ChevronLeft />
                    </IconButton>

                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" fontWeight={700}>
                            {MONTHS[currentMonth]} {currentYear}
                        </Typography>
                        {selectedCourseName && (
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                {selectedCourseName}
                            </Typography>
                        )}
                    </Box>

                    <IconButton
                        onClick={() => {
                            if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
                            else setCurrentMonth((m) => m + 1);
                        }}
                        sx={{ color: "white" }}
                        disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
                    >
                        <ChevronRight />
                    </IconButton>
                </Box>

                {loading && <LinearProgress />}

                {/* Day Labels */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        bgcolor: "#f8fafc",
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                    }}
                >
                    {DAYS.map((d) => (
                        <Box key={d} sx={{ py: 1.5, textAlign: "center" }}>
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                color="text.secondary"
                                sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                            >
                                {d}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Calendar Grid */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "1px",
                        bgcolor: "grey.200",
                    }}
                >
                    {calendarCells.map((day, idx) => {
                        if (!day) {
                            return <Box key={`empty-${idx}`} sx={{ bgcolor: "#fafafa", minHeight: 72 }} />;
                        }

                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const record = attendanceMap[dateStr];
                        const isToday = dateStr === todayStr;
                        const isFuture = dateStr > todayStr;
                        const meta = record ? getStatusMeta(record.approval_status) : null;
                        const isWeekend = [0, 6].includes(new Date(dateStr).getDay());
                        const dimmed = filterStatus && record && record.approval_status !== filterStatus;

                        return (
                            <Tooltip
                                key={dateStr}
                                title={
                                    record
                                        ? `${meta.label}${record.remarks ? ` — ${record.remarks}` : ""}`
                                        : isFuture
                                        ? "Future date"
                                        : "Click to mark attendance"
                                }
                                arrow
                            >
                                <Box
                                    onClick={() => !isFuture && handleDayClick(dateStr)}
                                    sx={{
                                        bgcolor: record
                                            ? meta.bg
                                            : isToday
                                            ? "#eff6ff"
                                            : isFuture
                                            ? "#fafafa"
                                            : isWeekend
                                            ? "#fdf4ff"
                                            : "white",
                                        minHeight: 72,
                                        p: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: record || isFuture ? "default" : "pointer",
                                        opacity: dimmed ? 0.25 : 1,
                                        transition: "all 0.15s ease",
                                        position: "relative",
                                        "&:hover": !record && !isFuture
                                            ? {
                                                bgcolor: "#f0fdf4",
                                                transform: "scale(1.02)",
                                                zIndex: 1,
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                            }
                                            : {},
                                    }}
                                >
                                    {/* Day number */}
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            bgcolor: isToday ? "#2563eb" : "transparent",
                                            color: isToday ? "white" : isWeekend ? "#7c3aed" : "text.primary",
                                            fontWeight: isToday ? 700 : isWeekend ? 600 : 500,
                                            fontSize: "0.875rem",
                                        }}
                                    >
                                        {day}
                                    </Box>

                                    {/* Status indicator */}
                                    {record && (
                                        <Box sx={{ textAlign: "center" }}>
                                            <Typography
                                                sx={{
                                                    fontSize: "1rem",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {meta.icon}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: meta.color,
                                                    fontWeight: 700,
                                                    fontSize: "0.6rem",
                                                    display: { xs: "none", sm: "block" },
                                                }}
                                            >
                                                {meta.label}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Cancel button for pending */}
                                    {record?.approval_status === "PENDING" && (
                                        <Tooltip title="Cancel this request">
                                            <Box
                                                onClick={(e) => { e.stopPropagation(); handleCancelAttendance(record); }}
                                                sx={{
                                                    position: "absolute",
                                                    top: 2,
                                                    right: 2,
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: "50%",
                                                    bgcolor: "#fcd34d",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    cursor: "pointer",
                                                    "&:hover": { bgcolor: "#f59e0b" },
                                                }}
                                            >
                                                <Close sx={{ fontSize: 10, color: "#92400e" }} />
                                            </Box>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Box>

                {/* Legend */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        borderTop: "1px solid",
                        borderColor: "grey.200",
                        display: "flex",
                        gap: 3,
                        flexWrap: "wrap",
                        bgcolor: "#fafafa",
                    }}
                >
                    {[
                        { color: "#d97706", bg: "#fef3c7", label: "Pending" },
                        { color: "#16a34a", bg: "#dcfce7", label: "Approved" },
                        { color: "#dc2626", bg: "#fee2e2", label: "Rejected" },
                        { color: "#2563eb", bg: "#eff6ff", label: "Today" },
                        { color: "#7c3aed", bg: "#fdf4ff", label: "Weekend" },
                    ].map((l) => (
                        <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                                sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: 1,
                                    bgcolor: l.bg,
                                    border: "1.5px solid",
                                    borderColor: l.color,
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                {l.label}
                            </Typography>
                        </Box>
                    ))}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            sx={{
                                width: 14,
                                height: 14,
                                borderRadius: 1,
                                bgcolor: "white",
                                border: "1.5px dashed #9ca3af",
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            Click to mark
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Records List */}
            {Object.keys(attendanceMap).length > 0 && (
                <Paper
                    elevation={0}
                    sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}
                >
                    <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "grey.200", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            This Month's Records
                        </Typography>
                        {filterStatus && (
                            <Chip
                                label={filterStatus}
                                size="small"
                                onDelete={() => setFilterStatus("")}
                                sx={{
                                    bgcolor: filterStatus === "APPROVED" ? "#dcfce7" : filterStatus === "REJECTED" ? "#fee2e2" : "#fef3c7",
                                    color: filterStatus === "APPROVED" ? "#16a34a" : filterStatus === "REJECTED" ? "#dc2626" : "#d97706",
                                    fontWeight: 700,
                                }}
                            />
                        )}
                    </Box>
                    <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "grey.100" }} />}>
                        {Object.values(attendanceMap)
                            .filter((r) => !filterStatus || r.approval_status === filterStatus)
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((record) => {
                                const meta = getStatusMeta(record.approval_status);
                                return (
                                    <Box
                                        key={record.id}
                                        sx={{
                                            px: 3,
                                            py: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 2,
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 2,
                                                    bgcolor: meta.bg,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "1.2rem",
                                                }}
                                            >
                                                {meta.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {new Date(record.date).toLocaleDateString("en-US", {
                                                        weekday: "long",
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </Typography>
                                                {record.remarks && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {record.remarks}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Chip
                                                label={meta.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: meta.bg,
                                                    color: meta.color,
                                                    fontWeight: 700,
                                                    border: "1px solid",
                                                    borderColor: meta.border,
                                                }}
                                            />
                                            {record.approval_status === "PENDING" && (
                                                <Tooltip title="Cancel request">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCancelAttendance(record)}
                                                        sx={{ color: "#d97706" }}
                                                    >
                                                        <Close fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        {Object.values(attendanceMap).filter((r) => !filterStatus || r.approval_status === filterStatus).length === 0 && (
                            <Box sx={{ px: 3, py: 3, textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    No {filterStatus?.toLowerCase() || ""} records this month.
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Paper>
            )}

            {/* Mark Attendance Confirm Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: "#eff6ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <EventAvailable sx={{ color: "#2563eb" }} />
                        </Box>
                        <Box>
                            <Typography fontWeight={700}>Mark Attendance</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedDate &&
                                    new Date(selectedDate).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Your attendance will be submitted for admin approval. You can add an optional note below.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Remarks (optional)"
                        placeholder="e.g. Arrived at 9am"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        multiline
                        rows={2}
                        size="small"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleMarkAttendance}
                        variant="contained"
                        disabled={marking}
                        startIcon={marking ? <CircularProgress size={16} /> : <CheckCircle />}
                        sx={{ bgcolor: "#2563eb" }}
                    >
                        {marking ? "Submitting..." : "Mark Present"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
