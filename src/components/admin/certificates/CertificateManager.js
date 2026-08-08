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
    Menu,
    CircularProgress,
    Chip,
    IconButton,
    Typography,
    FormControl,
    InputLabel,
    Stack,
    Checkbox,
    Autocomplete,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Edit, Delete, Add, CheckCircle, CloudUpload, Visibility, Download, DeleteOutlined } from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import CertificateModal from "@/components/common/CertificateModal";
import { WorkspacePremium } from "@mui/icons-material";

export default function CertificateManager() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [certificates, setCertificates] = useState([]);
    const [filteredCertificates, setFilteredCertificates] = useState([]);
    const [openCertModal, setOpenCertModal] = useState(false);
    const [selectedCertForModal, setSelectedCertForModal] = useState(null);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentCourses, setStudentCourses] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingCert, setViewingCert] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
    const [statusMenuCert, setStatusMenuCert] = useState(null);

    const handleStatusClick = (cert, event) => {
        setStatusMenuCert(cert);
        setStatusMenuAnchor(event.currentTarget);
    };

    const handleStatusChange = async (newStatus) => {
        if (!statusMenuCert) return;
        try {
            await api.patch(`/learning/certificates/${statusMenuCert.id}/`, { status: newStatus });
            successToast(`Certificate status updated to ${newStatus}`);
            setCertificates((prev) =>
                prev.map((c) => (c.id === statusMenuCert.id ? { ...c, status: newStatus } : c))
            );
        } catch (error) {
            errorToast(error, "Failed to update certificate status");
        } finally {
            setStatusMenuAnchor(null);
            setStatusMenuCert(null);
        }
    };
    const [formData, setFormData] = useState({
        student_course: "",
        title: "",
        certificate_number: "",
        status: "EARNED",
        earned_date: new Date().toISOString().split("T")[0],
        file: null,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [certificates, searchTerm, filterCourse, filterStatus]);

    // When student is selected, fetch their student_course records
    useEffect(() => {
        if (!selectedStudent) {
            setStudentCourses([]);
            return;
        }
        api.get(`/admin/students/${selectedStudent.id}/courses/`)
            .then((res) => setStudentCourses(res.data.results || res.data || []))
            .catch(() => setStudentCourses([]));
    }, [selectedStudent]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [certRes, coursesData, studentsRes] = await Promise.all([
                api.get("/learning/certificates/").catch(() => ({ data: { results: [] } })),
                getCourses().catch(() => []),
                api.get("/admin/students/").catch(() => ({ data: { results: [] } })),
            ]);
            setCertificates(certRes.data.results || certRes.data || []);
            setCourses(coursesData);
            setStudents(studentsRes.data.results || studentsRes.data || []);
        } catch (error) {
            console.error("Error loading data:", error);
            errorToast(error, "Failed to load certificates");
            setCertificates([]);
            setCourses([]);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...certificates];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    (item.student_name && item.student_name.toLowerCase().includes(term)) ||
                    (item.title && item.title.toLowerCase().includes(term)) ||
                    (item.certificate_number && item.certificate_number.toLowerCase().includes(term))
            );
        }

        if (filterCourse) {
            filtered = filtered.filter((item) => item.course_name === filterCourse || item.student_course === parseInt(filterCourse));
        }

        if (filterStatus) {
            filtered = filtered.filter((item) => item.status === filterStatus);
        }

        setFilteredCertificates(filtered);
    };

    const handleOpenDialog = (cert = null) => {
        if (cert) {
            setEditingId(cert.id);
            setSelectedStudent(null);
            setFormData({
                student_course: cert.student_course,
                title: cert.title,
                certificate_number: cert.certificate_number,
                status: cert.status,
                earned_date: cert.earned_date,
                file: null,
            });
        } else {
            setEditingId(null);
            setSelectedStudent(null);
            setStudentCourses([]);
            setFormData({
                student_course: "",
                title: "",
                certificate_number: `CERT-${Date.now()}`,
                status: "EARNED",
                earned_date: new Date().toISOString().split("T")[0],
                file: null,
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
        const file = e.target.files[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                errorToast(null, `File size exceeds 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                return;
            }
            setFormData((prev) => ({
                ...prev,
                file: file,
            }));
        }
    };

    const handleSubmit = async () => {
        if (!editingId && !formData.student_course) {
            errorToast(null, "Please select a student and course");
            return;
        }
        if (!formData.title) {
            errorToast(null, "Title is required");
            return;
        }

        try {
            const data = new FormData();
            if (formData.student_course) {
                data.append("student_course", formData.student_course);
            }
            data.append("title", formData.title);
            data.append("certificate_number", formData.certificate_number);
            data.append("earned_date", formData.earned_date);
            data.append("status", formData.status);
            if (formData.file) {
                data.append("file", formData.file);
            }

            let res;
            if (editingId) {
                res = await api.patch(`/learning/certificates/${editingId}/`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Certificate updated successfully");
            } else {
                res = await api.post("/learning/certificates/", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Certificate created successfully");
            }
            setOpenDialog(false);
            loadData();
            return res.data;
        } catch (error) {
            errorToast(error, "Failed to save certificate");
            return null;
        }
    };

    const handleGenerateAndSave = async () => {
        const saved = await handleSubmit();
        if (saved) {
            setSelectedCertForModal(saved);
            setOpenCertModal(true);
        }
    };

    const handlePreviewOnly = () => {
        if (!editingId && !formData.student_course) {
            errorToast(null, "Please select a student and course for preview");
            return;
        }
        if (!formData.title) {
            errorToast(null, "Title is required for preview");
            return;
        }

        const studentCourseObj = studentCourses.find(sc => sc.id === formData.student_course);
        const cert = {
            title: formData.title,
            certificate_number: formData.certificate_number,
            earned_date: formData.earned_date,
            student_name: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : "",
            course_name: studentCourseObj?.course?.name || "Course Name",
        };

        setSelectedCertForModal(cert);
        setOpenCertModal(true);
    };

    const handleIssue = async (id) => {
        confirmAction(
            "Issue this certificate to the student?",
            async () => {
                try {
                    await api.post(`/learning/certificates/${id}/issue/`);
                    successToast("Certificate issued successfully");
                    loadData();
                } catch (error) {
                    errorToast(error, "Failed to issue certificate");
                }
            },
            null,
            "Issue",
            "Cancel",
            false
        );
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

    if (loading) {
        return (
            <Box sx={{ py: 4, textAlign: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    const courseNames = [...new Set(certificates.map((c) => c.course_name).filter(Boolean))];

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
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
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Search by student name, title, or certificate number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap" }}>
                        <FormControl sx={{ minWidth: { xs: "100%", sm: 160 } }} size="small">
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                label="Course"
                            >
                                <MenuItem value="">All Courses</MenuItem>
                                {courses.map((course) => (
                                    <MenuItem key={course.id} value={course.name}>
                                        {course.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }} size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="EARNED">Earned</MenuItem>
                                <MenuItem value="ISSUED">Issued</MenuItem>
                                <MenuItem value="REVOKED">Revoked</MenuItem>
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
                                Delete Selected ({selectedIds.size})
                            </Button>
                        )}
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
                        p: { xs: 3, sm: 5 },
                        textAlign: "center",
                    }}
                >
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                        No certificates found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {searchTerm || filterCourse || filterStatus
                            ? "Try adjusting your filters"
                            : "Create and issue certificates to students. Click 'Create Certificate' to begin."}
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ overflowX: "auto", borderRadius: 2 }}>
                    {isMobile ? (
                        <Stack spacing={2}>
                            {filteredCertificates.map((cert) => (
                                <Card key={cert.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                    <CardContent>
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                                            <Checkbox
                                                checked={selectedIds.has(cert.id)}
                                                onChange={() => handleSelectItem(cert.id)}
                                                sx={{ p: 0 }}
                                            />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    {cert.student_name || "N/A"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" fontFamily="monospace">
                                                    {cert.student_username || "—"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Stack spacing={1.5} mb={2} pl={4}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Title</Typography>
                                                <Typography variant="caption">{cert.title}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Course</Typography>
                                                <Typography variant="caption">{cert.course_name || "N/A"}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Earned Date</Typography>
                                                <Typography variant="caption">{cert.earned_date}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                                                <Chip
                                                    label={cert.status}
                                                    color={cert.status === "ISSUED" ? "success" : cert.status === "EARNED" ? "info" : "error"}
                                                    size="small"
                                                    onClick={(e) => handleStatusClick(cert, e)}
                                                    clickable
                                                />
                                            </Box>
                                        </Stack>
                                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", pt: 1.5, flexWrap: "wrap" }}>
                                            <IconButton size="small" onClick={() => { setSelectedCertForModal(cert); setOpenCertModal(true); }} sx={{ color: "#d97706" }}><WorkspacePremium fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleViewCert(cert)} sx={{ color: "primary.main" }}><Visibility fontSize="small" /></IconButton>
                                            {cert.status === "EARNED" && (
                                                <Button size="small" startIcon={<CheckCircle />} color="success" onClick={() => handleIssue(cert.id)}>Issue</Button>
                                            )}
                                            <IconButton size="small" onClick={() => handleOpenDialog(cert)} sx={{ color: "warning.main" }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(cert.id)} sx={{ color: "error.main" }}><Delete fontSize="small" /></IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "grey.50" }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.size === filteredCertificates.length && filteredCertificates.length > 0}
                                                indeterminate={selectedIds.size > 0 && selectedIds.size < filteredCertificates.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Earned Date</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
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
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {cert.student_name || "N/A"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                                                    {cert.student_username || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{cert.title}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {cert.course_name || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cert.status}
                                                    color={cert.status === "ISSUED" ? "success" : cert.status === "EARNED" ? "info" : "error"}
                                                    size="small"
                                                    onClick={(e) => handleStatusClick(cert, e)}
                                                    clickable
                                                    sx={{ cursor: "pointer" }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {cert.earned_date}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedCertForModal(cert);
                                                            setOpenCertModal(true);
                                                        }}
                                                        title="Generate / Print Certificate"
                                                        sx={{ color: "#d97706" }}
                                                    >
                                                        <WorkspacePremium fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewCert(cert)}
                                                        title="View details"
                                                        sx={{ color: "primary.main" }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                    {cert.status === "EARNED" && (
                                                        <Button
                                                            size="small"
                                                            startIcon={<CheckCircle />}
                                                            color="success"
                                                            onClick={() => handleIssue(cert.id)}
                                                            sx={{ fontSize: "0.75rem", py: 0.2 }}
                                                        >
                                                            Issue
                                                        </Button>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(cert)}
                                                        title="Edit"
                                                        sx={{ color: "warning.main" }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(cert.id)}
                                                        title="Delete"
                                                        sx={{ color: "error.main" }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenDialog(false); }} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingId ? "Edit Certificate" : "Create Certificate"}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
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
                                        <TextField {...params} label="Select Student" size="small" required />
                                    )}
                                />
                                <FormControl size="small" disabled={!selectedStudent || studentCourses.length === 0} required>
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
                            fullWidth
                            label="Certificate Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            size="small"
                            required
                        />

                        <TextField
                            fullWidth
                            label="Certificate Number"
                            name="certificate_number"
                            value={formData.certificate_number}
                            onChange={handleChange}
                            size="small"
                            required
                        />

                        <TextField
                            fullWidth
                            label="Earned Date"
                            name="earned_date"
                            type="date"
                            value={formData.earned_date}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                            size="small"
                            required
                        />

                        <FormControl size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                label="Status"
                            >
                                <MenuItem value="EARNED">Earned</MenuItem>
                                <MenuItem value="ISSUED">Issued</MenuItem>
                                <MenuItem value="REVOKED">Revoked</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            fullWidth
                        >
                            {formData.file ? formData.file.name : "Upload Certificate File (PDF / Image)"}
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc", justifyContent: "space-between" }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button
                            onClick={handlePreviewOnly}
                            variant="outlined"
                            sx={{ fontWeight: 700, textTransform: "none" }}
                        >
                            Preview Only
                        </Button>
                        <Button onClick={handleSubmit} variant="outlined" sx={{ fontWeight: 700, textTransform: "none" }}>
                            Save Only
                        </Button>
                        <Button
                            onClick={handleGenerateAndSave}
                            variant="contained"
                            startIcon={<WorkspacePremium />}
                            sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" }, fontWeight: 700, textTransform: "none" }}
                        >
                            Generate & Preview
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={viewOpen} onClose={(e, reason) => { if (reason === 'backdropClick') return; setViewOpen(false); }} maxWidth="sm" fullWidth>
                <DialogTitle>Certificate Details</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingCert && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Student
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {viewingCert.student_name || "—"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Username
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                                    {viewingCert.student_username || "—"}
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
                                    {viewingCert.course_name || "—"}
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
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={viewingCert.status}
                                        color={viewingCert.status === "ISSUED" ? "success" : viewingCert.status === "EARNED" ? "info" : "error"}
                                        size="small"
                                    />
                                </Box>
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
                                        Certificate Document
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

            {/* STATUS MENU */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={() => setStatusMenuAnchor(null)}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            minWidth: 160,
                            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                        },
                    },
                }}
            >
                <MenuItem onClick={() => handleStatusChange("EARNED")} sx={{ py: 1, px: 2 }}>
                    <Chip size="small" label="EARNED" color="info" />
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange("ISSUED")} sx={{ py: 1, px: 2 }}>
                    <Chip size="small" label="ISSUED" color="success" />
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange("REVOKED")} sx={{ py: 1, px: 2 }}>
                    <Chip size="small" label="REVOKED" color="error" />
                </MenuItem>
            </Menu>

            {/* OFFICIAL CERTIFICATE MODAL */}
            <CertificateModal
                open={openCertModal}
                onClose={() => setOpenCertModal(false)}
                certificate={selectedCertForModal}
            />
        </Box>
    );
}
