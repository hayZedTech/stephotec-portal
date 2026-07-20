"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    CircularProgress,
    Chip,
    IconButton,
    Typography,
    FormControl,
    InputLabel,
    Stack,
    Checkbox,
    Tabs,
    Tab,
    Tooltip,
    LinearProgress,
    Avatar,
    Autocomplete,
} from "@mui/material";
import {
    Edit,
    Delete,
    Add,
    DeleteOutlined,
    CheckCircle,
    Cancel,
    HourglassEmpty,
    Person,
    FilterList,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

const STATUS_META = {
    APPROVED: { color: "success", label: "Approved" },
    PENDING: { color: "warning", label: "Pending" },
    REJECTED: { color: "error", label: "Rejected" },
};

const ATTENDANCE_STATUS_COLORS = {
    PRESENT: "success",
    ABSENT: "error",
    LATE: "warning",
    EXCUSED: "info",
};

export default function AttendanceManager() {
    const [tabValue, setTabValue] = useState(0); // 0=Pending, 1=All Records, 2=Add New
    const [attendance, setAttendance] = useState([]);
    const [pending, setPending] = useState([]);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentCourses, setStudentCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterApproval, setFilterApproval] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [rejectDialogId, setRejectDialogId] = useState(null);
    const [rejectRemark, setRejectRemark] = useState("");

    // Form for adding/editing
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formData, setFormData] = useState({
        student_course: "",
        date: new Date().toISOString().split("T")[0],
        status: "PRESENT",
        remarks: "",
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [attendanceRes, pendingRes, coursesData, studentsRes] = await Promise.all([
                api.get("/learning/attendance/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/attendance/pending/").catch(() => ({ data: [] })),
                getCourses().catch(() => []),
                api.get("/admin/students/").catch(() => ({ data: { results: [] } })),
            ]);
            setAttendance(attendanceRes.data.results || attendanceRes.data || []);
            setPending(Array.isArray(pendingRes.data) ? pendingRes.data : pendingRes.data.results || []);
            setCourses(coursesData);
            setStudents(studentsRes.data.results || studentsRes.data || []);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    // When student is selected, load their student_course records
    useEffect(() => {
        if (!selectedStudent) { setStudentCourses([]); return; }
        api.get(`/admin/students/${selectedStudent.id}/courses/`)
            .then((res) => setStudentCourses(res.data.results || res.data || []))
            .catch(() => setStudentCourses([]));
    }, [selectedStudent]);

    const handleApprove = async (id) => {
        setActionLoading((p) => ({ ...p, [id]: "approve" }));
        try {
            await api.post(`/learning/attendance/${id}/approve/`);
            successToast("Attendance approved");
            loadData();
        } catch (err) {
            errorToast(err, "Failed to approve");
        } finally {
            setActionLoading((p) => ({ ...p, [id]: null }));
        }
    };

    const handleReject = async () => {
        if (!rejectDialogId) return;
        setActionLoading((p) => ({ ...p, [rejectDialogId]: "reject" }));
        try {
            await api.post(`/learning/attendance/${rejectDialogId}/reject/`, { remarks: rejectRemark });
            successToast("Attendance rejected");
            setRejectDialogId(null);
            setRejectRemark("");
            loadData();
        } catch (err) {
            errorToast(err, "Failed to reject");
        } finally {
            setActionLoading((p) => ({ ...p, [rejectDialogId]: null }));
        }
    };

    const handleOpenDialog = (record = null) => {
        if (record) {
            setEditingId(record.id);
            setFormData({
                student_course: record.student_course,
                date: record.date,
                status: record.status,
                remarks: record.remarks || "",
            });
        } else {
            setEditingId(null);
            setSelectedStudent(null);
            setFormData({
                student_course: "",
                date: new Date().toISOString().split("T")[0],
                status: "PRESENT",
                remarks: "",
            });
        }
        setOpenDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.patch(`/learning/attendance/${editingId}/`, {
                    status: formData.status,
                    remarks: formData.remarks,
                });
                successToast("Attendance updated");
            } else {
                await api.post("/learning/attendance/", formData);
                successToast("Attendance recorded");
            }
            setOpenDialog(false);
            loadData();
        } catch (error) {
            errorToast(error, "Failed to save");
        }
    };

    const handleDelete = async (id) => {
        confirmAction("Delete this attendance record?", async () => {
            try {
                await api.delete(`/learning/attendance/${id}/`);
                successToast("Deleted");
                loadData();
            } catch (error) {
                errorToast(error, "Failed to delete");
            }
        }, null, "Delete", "Cancel", true);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        confirmAction(`Delete ${selectedIds.size} record(s)?`, async () => {
            try {
                await Promise.all(Array.from(selectedIds).map((id) => api.delete(`/learning/attendance/${id}/`)));
                successToast(`${selectedIds.size} records deleted`);
                setSelectedIds(new Set());
                loadData();
            } catch (error) {
                errorToast(error, "Failed to delete");
            }
        }, null, "Delete", "Cancel", true);
    };

    const filteredAttendance = attendance.filter((item) => {
        const matchSearch = !searchTerm ||
            item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.student_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.enrollment_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCourse = !filterCourse || item.course_name === filterCourse;
        const matchApproval = !filterApproval || item.approval_status === filterApproval;
        return matchSearch && matchCourse && matchApproval;
    });

    if (loading) return (
        <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress />
        </Box>
    );

    const courseNames = [...new Set(attendance.map((a) => a.course_name).filter(Boolean))];

    return (
        <Box>
            {/* Tab Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                    Attendance Management
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Record Attendance
                </Button>
            </Box>

            <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                sx={{ mb: 3, borderBottom: "1px solid", borderColor: "grey.200" }}
            >
                <Tab
                    label={
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            Pending Approvals
                            {pending.length > 0 && (
                                <Chip
                                    label={pending.length}
                                    size="small"
                                    color="warning"
                                    sx={{ height: 20, fontSize: "0.7rem" }}
                                />
                            )}
                        </span>
                    }
                />
                <Tab label="All Records" />
            </Tabs>

            {/* PENDING TAB */}
            {tabValue === 0 && (
                <Box>
                    {pending.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "grey.200",
                                p: 6,
                                textAlign: "center",
                            }}
                        >
                            <CheckCircle sx={{ fontSize: 48, color: "#16a34a", mb: 2 }} />
                            <Typography fontWeight={600} mb={0.5}>
                                All caught up!
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                No pending attendance requests.
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {pending.map((record) => (
                                <Paper
                                    key={record.id}
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "#fcd34d",
                                        bgcolor: "#fffbeb",
                                        p: 2.5,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <Avatar sx={{ bgcolor: "#7c3aed", width: 44, height: 44, fontWeight: 700 }}>
                                            {record.student_name?.charAt(0) || "S"}
                                        </Avatar>
                                        <Box>
                                            <Typography fontWeight={700} variant="body2">
                                                {record.student_name || record.student_username}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {record.enrollment_id} · {record.course_name}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Typography variant="caption" fontWeight={600} color="#d97706">
                                                    📅{" "}
                                                    {new Date(record.date).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </Typography>
                                                {record.remarks && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                        — {record.remarks}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            color="success"
                                            startIcon={
                                                actionLoading[record.id] === "approve"
                                                    ? <CircularProgress size={14} color="inherit" />
                                                    : <CheckCircle />
                                            }
                                            onClick={() => handleApprove(record.id)}
                                            disabled={!!actionLoading[record.id]}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            startIcon={<Cancel />}
                                            onClick={() => { setRejectDialogId(record.id); setRejectRemark(""); }}
                                            disabled={!!actionLoading[record.id]}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Reject
                                        </Button>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* ALL RECORDS TAB */}
            {tabValue === 1 && (
                <Box>
                    {/* Filters */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                            <TextField
                                placeholder="Search student name, username, enrollment ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                            <FormControl sx={{ minWidth: 150 }} size="small">
                                <InputLabel>Course</InputLabel>
                                <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} label="Course">
                                    <MenuItem value="">All Courses</MenuItem>
                                    {courseNames.map((name) => (
                                        <MenuItem key={name} value={name}>{name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 150 }} size="small">
                                <InputLabel>Approval</InputLabel>
                                <Select value={filterApproval} onChange={(e) => setFilterApproval(e.target.value)} label="Approval">
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="PENDING">Pending</MenuItem>
                                    <MenuItem value="APPROVED">Approved</MenuItem>
                                    <MenuItem value="REJECTED">Rejected</MenuItem>
                                </Select>
                            </FormControl>
                            {selectedIds.size > 0 && (
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteOutlined />}
                                    onClick={handleBulkDelete}
                                    variant="outlined"
                                >
                                    Delete ({selectedIds.size})
                                </Button>
                            )}
                        </Stack>
                    </Paper>

                    {filteredAttendance.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", p: 4, textAlign: "center" }}
                        >
                            <Typography color="text.secondary">No attendance records found.</Typography>
                        </Paper>
                    ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.size === filteredAttendance.length && filteredAttendance.length > 0}
                                                indeterminate={selectedIds.size > 0 && selectedIds.size < filteredAttendance.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedIds(new Set(filteredAttendance.map((i) => i.id)));
                                                    else setSelectedIds(new Set());
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Approval</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredAttendance.map((record) => (
                                        <TableRow key={record.id} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.has(record.id)}
                                                    onChange={() => {
                                                        const s = new Set(selectedIds);
                                                        s.has(record.id) ? s.delete(record.id) : s.add(record.id);
                                                        setSelectedIds(s);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: "#7c3aed", fontSize: 13, fontWeight: 700 }}>
                                                        {record.student_name?.charAt(0) || "S"}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {record.student_name || record.student_username}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {record.enrollment_id}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{record.course_name}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {new Date(record.date).toLocaleDateString("en-US", {
                                                        month: "short", day: "numeric", year: "numeric",
                                                    })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={record.status}
                                                    color={ATTENDANCE_STATUS_COLORS[record.status] || "default"}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <Chip
                                                        label={STATUS_META[record.approval_status]?.label || record.approval_status}
                                                        color={STATUS_META[record.approval_status]?.color || "default"}
                                                        size="small"
                                                    />
                                                    {record.approval_status === "PENDING" && (
                                                        <>
                                                            <Tooltip title="Approve">
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleApprove(record.id)}
                                                                    disabled={!!actionLoading[record.id]}
                                                                >
                                                                    {actionLoading[record.id] === "approve"
                                                                        ? <CircularProgress size={14} />
                                                                        : <CheckCircle fontSize="small" />}
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => { setRejectDialogId(record.id); setRejectRemark(""); }}
                                                                >
                                                                    <Cancel fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {record.remarks || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleOpenDialog(record)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(record.id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? "Edit Attendance" : "Record Attendance"}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2.5}>
                        {!editingId && (
                            <>
                                <Autocomplete
                                    options={students}
                                    getOptionLabel={(s) => `${s.first_name} ${s.last_name} (${s.username})`}
                                    value={selectedStudent}
                                    onChange={(_, val) => {
                                        setSelectedStudent(val);
                                        setFormData((p) => ({ ...p, student_course: "" }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Select Student" size="small" />
                                    )}
                                />
                                <FormControl size="small" disabled={!selectedStudent || studentCourses.length === 0}>
                                    <InputLabel>Student Course</InputLabel>
                                    <Select
                                        value={formData.student_course}
                                        onChange={(e) => setFormData((p) => ({ ...p, student_course: e.target.value }))}
                                        label="Student Course"
                                    >
                                        {studentCourses.map((sc) => (
                                            <MenuItem key={sc.id} value={sc.id}>
                                                {sc.course?.name || sc.course} — {sc.enrollment_id}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        <TextField
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                            slotProps={{ inputLabel: { shrink: true } }}
                            size="small"
                        />

                        <FormControl size="small">
                            <InputLabel>Attendance Status</InputLabel>
                            <Select
                                value={formData.status}
                                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                                label="Attendance Status"
                            >
                                <MenuItem value="PRESENT">Present</MenuItem>
                                <MenuItem value="ABSENT">Absent</MenuItem>
                                <MenuItem value="LATE">Late</MenuItem>
                                <MenuItem value="EXCUSED">Excused</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Remarks"
                            value={formData.remarks}
                            onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!editingId && (!formData.student_course || !formData.date)}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!rejectDialogId} onClose={() => setRejectDialogId(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Reject Attendance</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Reason for rejection (optional)"
                        value={rejectRemark}
                        onChange={(e) => setRejectRemark(e.target.value)}
                        multiline
                        rows={2}
                        size="small"
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogId(null)}>Cancel</Button>
                    <Button onClick={handleReject} variant="contained" color="error">
                        Reject
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
