"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/axios";
import { errorToast, successToast } from "@/lib/toast";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Paper,
    Chip,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { School, Download, Visibility, CheckCircle, CloudUpload, Send, AttachFile } from "@mui/icons-material";

export default function AssignmentsPage() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [submissions, setSubmissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadAssignments();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [assignments, searchTerm, filterStatus, filterCourse]);

    const loadAssignments = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const res = await api.get("/learning/student-assignments/student_assignments/", {
                params: {
                    student_id: user.id,
                },
            });
            console.log("Assignments response:", res.data);
            const data = res.data.results || res.data || [];
            const transformed = Array.isArray(data) ? data.map(item => ({
                id: item.assignment,
                title: item.assignment_title,
                description: item.description || "",
                instructions: item.instructions || "",
                file: item.file || null,
                due_date: item.due_date,
                max_score: item.max_score,
                status: item.status,
                course: item.course_id,
                course_name: item.course_name,
                assigned_at: item.assigned_at
            })) : [];
            setAssignments(transformed);
            
            // Load submissions
            await loadSubmissions();
        } catch (error) {
            console.error("Failed to load assignments:", error);
            errorToast(error, "Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const loadSubmissions = async () => {
        if (!user?.id) return;
        try {
            const res = await api.get("/learning/submissions/", {
                params: {
                    student: user.id,
                },
            });
            const data = res.data.results || res.data || [];
            const submissionMap = {};
            data.forEach(submission => {
                submissionMap[submission.assignment] = submission;
            });
            setSubmissions(submissionMap);
        } catch (error) {
            console.error("Failed to load submissions:", error);
        }
    };

    const applyFilters = () => {
        let filtered = assignments;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(term) ||
                    item.description.toLowerCase().includes(term)
            );
        }

        if (filterStatus) {
            filtered = filtered.filter((item) => item.status === filterStatus);
        }

        if (filterCourse) {
            filtered = filtered.filter((item) => item.course === parseInt(filterCourse));
        }

        setFilteredAssignments(filtered);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "PUBLISHED":
                return "success";
            case "DRAFT":
                return "warning";
            case "CLOSED":
                return "error";
            default:
                return "default";
        }
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    const handleViewAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setViewOpen(true);
        setSubmissionFile(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/zip",
                "application/x-zip-compressed",
                "text/plain",
            ];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!validTypes.includes(file.type)) {
                errorToast(null, "Invalid file type. Allowed: PDF, Word, Excel, PowerPoint, ZIP, or TXT");
                return;
            }

            if (file.size > maxSize) {
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                errorToast(null, `File size exceeds 10MB limit. Your file is ${fileSizeMB}MB`);
                return;
            }

            setSubmissionFile(file);
        }
    };

    const handleSubmitAssignment = async () => {
        if (!submissionFile) {
            errorToast(null, "Please select a file to submit");
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("file", submissionFile);
            formData.append("assignment", selectedAssignment.id);

            await api.post("/learning/submissions/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            successToast("Assignment submitted successfully!");
            setViewOpen(false);
            setSubmissionFile(null);
            await loadSubmissions();
        } catch (error) {
            console.error("Submission error:", error.response?.data || error.message);
            const errorMsg = error.response?.data?.detail || error.response?.data?.file?.[0] || "Failed to submit assignment";
            errorToast(null, errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
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
                        Loading assignments...
                    </Typography>
                </Box>
            </Box>
        );
    }

    const courses = user?.courses || [];
    const publishedAssignments = filteredAssignments.filter((a) => a.status === "PUBLISHED");
    const unsubmittedAssignments = publishedAssignments.filter((a) => !submissions[a.id]);
    const upcomingAssignments = unsubmittedAssignments.filter((a) => !isOverdue(a.due_date));
    const overdueAssignments = unsubmittedAssignments.filter((a) => isOverdue(a.due_date));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                    Assignments
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    View and submit your assigned assignments.
                </Typography>
            </div>

            {/* Filters */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Search by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="PUBLISHED">Published</MenuItem>
                                <MenuItem value="DRAFT">Draft</MenuItem>
                                <MenuItem value="CLOSED">Closed</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                label="Course"
                            >
                                <MenuItem value="">All Courses</MenuItem>
                                {courses.map((course) => (
                                    <MenuItem key={course.id} value={course.course.id}>
                                        {course.course.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Paper>

            {/* Stats */}
            <Grid container spacing={3}>
                <Grid key="total" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: { xs: 2, sm: 3 },
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#2563eb" sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}>
                            {publishedAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                            Total Assignments
                        </Typography>
                    </Paper>
                </Grid>

                <Grid key="upcoming" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: { xs: 2, sm: 3 },
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#16a34a" sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}>
                            {upcomingAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                            Upcoming
                        </Typography>
                    </Paper>
                </Grid>

                <Grid key="overdue" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: { xs: 2, sm: 3 },
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#ef4444" sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}>
                            {overdueAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                            Overdue
                        </Typography>
                    </Paper>
                </Grid>

                <Grid key="filtered" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: { xs: 2, sm: 3 },
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#0ea5e9" sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}>
                            {filteredAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                            Filtered
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Assignments Table/Cards */}
            {filteredAssignments.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <Box sx={{ display: { xs: "none", md: "block" } }}>
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                            <Table>
                                <TableHead sx={{ bgcolor: "grey.50" }}>
                                    <TableRow>
                                        <TableCell fontWeight={700}>Title</TableCell>
                                        <TableCell>Due Date</TableCell>
                                        <TableCell>Max Score</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredAssignments.map((assignment) => {
                                        const isSubmitted = submissions[assignment.id];
                                        return (
                                            <TableRow key={assignment.id} hover>
                                                <TableCell fontWeight={500}>{assignment.title}</TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {new Date(assignment.due_date).toLocaleDateString()}
                                                        </Typography>
                                                        {isOverdue(assignment.due_date) && (
                                                            <Chip label="Overdue" color="error" size="small" sx={{ mt: 0.5 }} />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{assignment.max_score}</TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        startIcon={isSubmitted ? <CheckCircle /> : <Visibility />}
                                                        onClick={() => handleViewAssignment(assignment)}
                                                        color={isSubmitted ? "success" : "primary"}
                                                    >
                                                        {isSubmitted ? "Submitted" : "View"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Mobile Cards */}
                    <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
                        {filteredAssignments.map((assignment) => {
                            const isSubmitted = submissions[assignment.id];
                            return (
                                <Card key={assignment.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                    <CardContent sx={{ pb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                                            {assignment.title}
                                        </Typography>

                                        <Stack spacing={1.5} sx={{ mb: 2 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                                    Due Date
                                                </Typography>
                                                <Box sx={{ textAlign: "right" }}>
                                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                                        {new Date(assignment.due_date).toLocaleDateString()}
                                                    </Typography>
                                                    {isOverdue(assignment.due_date) && (
                                                        <Chip label="Overdue" color="error" size="small" sx={{ mt: 0.5 }} />
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                                    Max Score
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                                    {assignment.max_score}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                                    Status
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    color={isSubmitted ? "success" : "warning"}
                                                    label={isSubmitted ? "Submitted" : "Pending"}
                                                />
                                            </Box>
                                        </Stack>

                                        <Button
                                            fullWidth
                                            size="small"
                                            startIcon={isSubmitted ? <CheckCircle /> : <Visibility />}
                                            onClick={() => handleViewAssignment(assignment)}
                                            color={isSubmitted ? "success" : "primary"}
                                            variant="outlined"
                                        >
                                            {isSubmitted ? "View Submission" : "View & Submit"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                </>
            ) : (
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
                    <School sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography color="text.secondary">
                        No assignments assigned yet.
                    </Typography>
                </Paper>
            )}

            {/* Assignment Details Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1, sm: 2 } } } }}>
                <DialogTitle sx={{ py: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 }, fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>
                    Assignment Details
                </DialogTitle>
                <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
                    {selectedAssignment && (
                        <Stack spacing={2}>
                            {submissions[selectedAssignment.id] && (
                                <Box sx={{ bgcolor: "success.light", p: 2, borderRadius: 1, border: "1px solid", borderColor: "success.main" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CheckCircle sx={{ color: "success.main" }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} color="success.main" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                                Submitted
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                                Submitted on {new Date(submissions[selectedAssignment.id].submitted_at).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "success.main" }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                                Status:
                                            </Typography>
                                            <Chip
                                                label={submissions[selectedAssignment.id].status === "GRADED" ? "Graded" : "Pending"}
                                                color={submissions[selectedAssignment.id].status === "GRADED" ? "success" : "warning"}
                                                size="small"
                                            />
                                        </Box>
                                        {submissions[selectedAssignment.id].status === "GRADED" && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                                    Score: {submissions[selectedAssignment.id].score}/{selectedAssignment.max_score}
                                                </Typography>
                                                {submissions[selectedAssignment.id].feedback && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                                        Feedback: {submissions[selectedAssignment.id].feedback}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                    Title
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                    {selectedAssignment.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                    Description
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                    {selectedAssignment.description || "—"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                    Instructions
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                    {selectedAssignment.instructions || "—"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                    Due Date
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {new Date(selectedAssignment.due_date).toLocaleString()}
                                    </Typography>
                                    {isOverdue(selectedAssignment.due_date) && (
                                        <Chip label="Overdue" color="error" size="small" />
                                    )}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                    Max Score
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                    {selectedAssignment.max_score}
                                </Typography>
                            </Box>

                            {selectedAssignment.file && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                        Assignment File
                                    </Typography>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Download />}
                                        href={selectedAssignment.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ mt: 0.5 }}
                                        size="small"
                                    >
                                        Download
                                    </Button>
                                </Box>
                            )}

                            {!submissions[selectedAssignment.id] && (
                                <Box sx={{ border: "2px dashed", borderColor: "grey.300", borderRadius: 2, p: 2, textAlign: "center", bgcolor: "grey.50" }}>
                                    <input
                                        type="file"
                                        id="assignment-file"
                                        hidden
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="assignment-file" style={{ cursor: "pointer", display: "block" }}>
                                        <AttachFile sx={{ fontSize: 32, color: "primary.main", mb: 1 }} />
                                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                            {submissionFile ? submissionFile.name : "Click to upload or drag and drop"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                            PDF, Word, Excel, PowerPoint, ZIP, or TXT
                                        </Typography>
                                        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5, fontWeight: 500, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                            Maximum file size: 10MB
                                        </Typography>
                                    </label>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
                    <Button onClick={() => setViewOpen(false)} size="small">Close</Button>
                    {!submissions[selectedAssignment?.id] && (
                        <Button
                            variant="contained"
                            startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
                            onClick={handleSubmitAssignment}
                            disabled={!submissionFile || submitting}
                            size="small"
                        >
                            {submitting ? "Submitting..." : "Submit Assignment"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
}
