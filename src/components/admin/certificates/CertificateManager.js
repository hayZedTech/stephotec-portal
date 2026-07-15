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
import { Edit, Delete, Add, CheckCircle, CloudUpload, Visibility, Download, DeleteOutlined } from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

export default function CertificateManager() {
    const [certificates, setCertificates] = useState([]);
    const [filteredCertificates, setFilteredCertificates] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingCert, setViewingCert] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [formData, setFormData] = useState({
        course: "",
        title: "",
        certificate_number: "",
        status: "EARNED",
        earned_date: "",
        file: null,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [certificates, searchTerm, filterCourse, filterStatus]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [certRes, coursesData] = await Promise.all([
                api.get("/learning/certificates/").catch(() => ({ data: { results: [] } })),
                getCourses().catch(() => []),
            ]);
            setCertificates(certRes.data.results || certRes.data || []);
            setCourses(coursesData);
        } catch (error) {
            console.error("Error loading data:", error);
            setCertificates([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...certificates];

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.certificate_number.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterCourse) {
            filtered = filtered.filter((item) => item.course === parseInt(filterCourse));
        }

        if (filterStatus) {
            filtered = filtered.filter((item) => item.status === filterStatus);
        }

        setFilteredCertificates(filtered);
    };

    const handleOpenDialog = (cert = null) => {
        if (cert) {
            setEditingId(cert.id);
            setFormData(cert);
        } else {
            setEditingId(null);
            setFormData({
                course: "",
                title: "",
                certificate_number: `CERT-${Date.now()}`,
                status: "EARNED",
                earned_date: new Date().toISOString().split("T")[0],
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

    const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            file: e.target.files[0],
        }));
    };

    const handleSubmit = async () => {
        try {
            const data = new FormData();
            data.append("course", formData.course);
            data.append("title", formData.title);
            data.append("certificate_number", formData.certificate_number);
            data.append("earned_date", formData.earned_date);
            if (formData.file) {
                data.append("file", formData.file);
            }

            if (editingId) {
                await api.patch(`/learning/certificates/${editingId}/`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Certificate updated");
            } else {
                await api.post("/learning/certificates/", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Certificate created");
            }
            setOpenDialog(false);
            loadData();
        } catch (error) {
            errorToast(error, "Failed to save");
        }
    };

    const handleIssue = async (id) => {
        try {
            await api.post(`/learning/certificates/${id}/issue/`);
            successToast("Certificate issued");
            loadData();
        } catch (error) {
            errorToast(error, "Failed to issue");
        }
    };

    const handleDelete = async (id) => {
        confirmAction(
            "Delete this certificate?",
            async () => {
                try {
                    await api.delete(`/learning/certificates/${id}/`);
                    successToast("Certificate deleted");
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
            `Delete ${selectedIds.size} selected certificate(s)?`,
            async () => {
                try {
                    await Promise.all(
                        Array.from(selectedIds).map((id) =>
                            api.delete(`/learning/certificates/${id}/`)
                        )
                    );
                    successToast(`${selectedIds.size} certificates deleted`);
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
            setSelectedIds(new Set(filteredCertificates.map((item) => item.id)));
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

    const handleViewCert = (cert) => {
        setViewingCert(cert);
        setViewOpen(true);
    };

    const getCourseName = (courseId) => {
        return courses.find((c) => c.id === courseId)?.name || "Unknown";
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight={700}>
                    Certificates
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Create Certificate
                </Button>
            </Box>

            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Search by student name, title, or certificate number..."
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
                                <MenuItem value="EARNED">Earned</MenuItem>
                                <MenuItem value="ISSUED">Issued</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Paper>

            {filteredCertificates.length === 0 ? (
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
                        No certificates yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create and issue certificates to students. Click "Create Certificate" to begin.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "grey.200" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "grey.50" }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedIds.size === filteredCertificates.length && filteredCertificates.length > 0}
                                        indeterminate={selectedIds.size > 0 && selectedIds.size < filteredCertificates.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell fontWeight={700}>Student</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>Certificate #</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Earned Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCertificates.map((cert) => (
                                <TableRow key={cert.id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedIds.has(cert.id)}
                                            onChange={() => handleSelectItem(cert.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{cert.student_name}</TableCell>
                                    <TableCell>{cert.title}</TableCell>
                                    <TableCell>{cert.certificate_number}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={cert.status}
                                            color={cert.status === "ISSUED" ? "success" : "default"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{cert.earned_date}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleViewCert(cert)}
                                            title="View details"
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        {cert.status === "EARNED" && (
                                            <Button
                                                size="small"
                                                startIcon={<CheckCircle />}
                                                onClick={() => handleIssue(cert.id)}
                                            >
                                                Issue
                                            </Button>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(cert)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(cert.id)}
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
                    {editingId ? "Edit Certificate" : "Create Certificate"}
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
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Certificate Number"
                        name="certificate_number"
                        value={formData.certificate_number}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Earned Date"
                        name="earned_date"
                        type="date"
                        value={formData.earned_date}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />

                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                        fullWidth
                    >
                        {formData.file ? formData.file.name : "Upload Certificate File"}
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Certificate Details</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingCert && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Student
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {viewingCert.student_name}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Title
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {viewingCert.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Course
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {getCourseName(viewingCert.course)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Certificate Number
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {viewingCert.certificate_number}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Status
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {viewingCert.status}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Earned Date
                                </Typography>
                                <Typography variant="body2">
                                    {viewingCert.earned_date}
                                </Typography>
                            </Box>

                            {viewingCert.issued_date && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Issued Date
                                    </Typography>
                                    <Typography variant="body2">
                                        {viewingCert.issued_date}
                                    </Typography>
                                </Box>
                            )}

                            {viewingCert.file && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Certificate File
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            component="a"
                                            href={viewingCert.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ color: "primary.main", textDecoration: "none", flex: 1, wordBreak: "break-all" }}
                                        >
                                            {viewingCert.file.split("/").pop()}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            href={viewingCert.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Download fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
