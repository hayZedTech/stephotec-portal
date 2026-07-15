"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import { Edit, Delete, Add, DeleteOutlined } from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

export default function AttendanceManager() {
    const [attendance, setAttendance] = useState([]);
    const [filteredAttendance, setFilteredAttendance] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [formData, setFormData] = useState({
        course: "",
        date: "",
        status: "PRESENT",
        remarks: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [attendance, searchTerm, filterCourse, filterStatus]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [attendanceRes, coursesData] = await Promise.all([
                api.get("/learning/attendance/").catch(() => ({ data: { results: [] } })),
                getCourses().catch(() => []),
            ]);
            setAttendance(attendanceRes.data.results || attendanceRes.data || []);
            setCourses(coursesData);
        } catch (error) {
            console.error("Error loading data:", error);
            setAttendance([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...attendance];

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.remarks.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterCourse) {
            filtered = filtered.filter((item) => item.course === parseInt(filterCourse));
        }

        if (filterStatus) {
            filtered = filtered.filter((item) => item.status === filterStatus);
        }

        setFilteredAttendance(filtered);
    };

    const handleOpenDialog = (record = null) => {
        if (record) {
            setEditingId(record.id);
            setFormData(record);
        } else {
            setEditingId(null);
            setFormData({
                course: "",
                date: new Date().toISOString().split("T")[0],
                status: "PRESENT",
                remarks: "",
            });
        }
        setOpenDialog(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.patch(`/learning/attendance/${editingId}/`, formData);
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
        confirmAction(
            "Delete this attendance record?",
            async () => {
                try {
                    await api.delete(`/learning/attendance/${id}/`);
                    successToast("Attendance record deleted");
                    loadData();
                } catch (error) {
                    errorToast(error, "Failed to delete");
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) {
            errorToast(null, "No items selected");
            return;
        }

        confirmAction(
            `Delete ${selectedIds.size} selected attendance record(s)?`,
            async () => {
                try {
                    await Promise.all(
                        Array.from(selectedIds).map((id) =>
                            api.delete(`/learning/attendance/${id}/`)
                        )
                    );
                    successToast(`${selectedIds.size} records deleted`);
                    setSelectedIds(new Set());
                    loadData();
                } catch (error) {
                    errorToast(error, "Failed to delete items");
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredAttendance.map((item) => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectItem = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    if (loading) {
        return <CircularProgress />;
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "PRESENT":
                return "success";
            case "ABSENT":
                return "error";
            case "LATE":
                return "warning";
            case "EXCUSED":
                return "info";
            default:
                return "default";
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight={700}>
                    Attendance Records
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Record Attendance
                </Button>
            </Box>

            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Search by student name or remarks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                    />

                    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                        {selectedIds.size > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="body2">
                                    {selectedIds.size} selected
                                </Typography>
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteOutlined />}
                                    onClick={handleBulkDelete}
                                >
                                    Delete Selected
                                </Button>
                            </Box>
                        )}
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                label="Course"
                            >
                                <MenuItem value="">All Courses</MenuItem>
                                {courses.map((course) => (
                                    <MenuItem key={course.id} value={course.id}>
                                        {course.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="PRESENT">Present</MenuItem>
                                <MenuItem value="ABSENT">Absent</MenuItem>
                                <MenuItem value="LATE">Late</MenuItem>
                                <MenuItem value="EXCUSED">Excused</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Paper>

            {filteredAttendance.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "grey.200",
                        p: 4,
                        textAlign: "center",
                    }}
                >
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                        No attendance records yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Start recording student attendance. Click "Record Attendance" to begin.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "grey.200" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "grey.50" }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedIds.size === filteredAttendance.length && filteredAttendance.length > 0}
                                        indeterminate={selectedIds.size > 0 && selectedIds.size < filteredAttendance.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell fontWeight={700}>Student</TableCell>
                                <TableCell>Course</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Remarks</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAttendance.map((record) => (
                                <TableRow key={record.id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedIds.has(record.id)}
                                            onChange={() => handleSelectItem(record.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{record.student_name}</TableCell>
                                    <TableCell>{record.course_name}</TableCell>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={record.status}
                                            color={getStatusColor(record.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{record.remarks}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(record)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(record.id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingId ? "Edit Attendance" : "Record Attendance"}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, space: 2 }}>
                    <Select
                        fullWidth
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="">Select Course</MenuItem>
                        {courses.map((course) => (
                            <MenuItem key={course.id} value={course.id}>
                                {course.name}
                            </MenuItem>
                        ))}
                    </Select>

                    <TextField
                        fullWidth
                        label="Date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />

                    <Select
                        fullWidth
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="PRESENT">Present</MenuItem>
                        <MenuItem value="ABSENT">Absent</MenuItem>
                        <MenuItem value="LATE">Late</MenuItem>
                        <MenuItem value="EXCUSED">Excused</MenuItem>
                    </Select>

                    <TextField
                        fullWidth
                        label="Remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        multiline
                        rows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
