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
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
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
                <Typography variant="h4" fontWeight={700}>
                    Assignments
                </Typography>
                <Typography color="text.secondary">
                    View and submit your assigned assignments.
                </Typography>
            </div>

            {/* Filters */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
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
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#2563eb">
                            {publishedAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
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
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#16a34a">
                            {upcomingAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
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
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#ef4444">
                            {overdueAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
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
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#0ea5e9">
                            {filteredAssignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Filtered
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Assignments Table */}
            {filteredAssignments.length > 0 ? (
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
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assignment Details</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {selectedAssignment && (
                        <Stack spacing={2}>
                            {submissions[selectedAssignment.id] && (
                                <Box sx={{ bgcolor: "success.light", p: 2, borderRadius: 1, border: "1px solid", borderColor: "success.main" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CheckCircle sx={{ color: "success.main" }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} color="success.main">
                                                Submitted
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Submitted on {new Date(submissions[selectedAssignment.id].submitted_at).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "success.main" }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
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
                                                <Typography variant="caption" color="text.secondary">
                                                    Score: {submissions[selectedAssignment.id].score}/{selectedAssignment.max_score}
                                                </Typography>
                                                {submissions[selectedAssignment.id].feedback && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                                        Feedback: {submissions[selectedAssignment.id].feedback}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Title
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {selectedAssignment.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body2">
                                    {selectedAssignment.description || "—"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Instructions
                                </Typography>
                                <Typography variant="body2">
                                    {selectedAssignment.instructions || "—"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Due Date
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(selectedAssignment.due_date).toLocaleString()}
                                    </Typography>
                                    {isOverdue(selectedAssignment.due_date) && (
                                        <Chip label="Overdue" color="error" size="small" />
                                    )}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Max Score
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {selectedAssignment.max_score}
                                </Typography>
                            </Box>

                            {selectedAssignment.file && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
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
                                        <Typography variant="body2" fontWeight={500}>
                                            {submissionFile ? submissionFile.name : "Click to upload or drag and drop"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                            PDF, Word, Excel, PowerPoint, ZIP, or TXT
                                        </Typography>
                                        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5, fontWeight: 500 }}>
                                            Maximum file size: 10MB
                                        </Typography>
                                    </label>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                    {!submissions[selectedAssignment?.id] && (
                        <Button
                            variant="contained"
                            startIcon={<Send />}
                            onClick={handleSubmitAssignment}
                            disabled={!submissionFile || submitting}
                        >
                            {submitting ? "Submitting..." : "Submit Assignment"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
}
