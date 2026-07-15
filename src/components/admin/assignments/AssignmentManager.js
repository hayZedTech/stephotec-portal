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
    Tabs,
    Tab,
    Typography,
    Stack,
    FormControl,
    InputLabel,
    Checkbox,
} from "@mui/material";
import { Edit, Delete, Add, CheckCircle, CloudUpload, Visibility, Download, PersonAdd } from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

export default function AssignmentManager() {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [openGradeDialog, setOpenGradeDialog] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterSubmissionStatus, setFilterSubmissionStatus] = useState("");
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [gradeData, setGradeData] = useState({ score: "", feedback: "" });
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignmentTabValue, setAssignmentTabValue] = useState(0);
    const [students, setStudents] = useState([]);
    const [selectedAvailableStudents, setSelectedAvailableStudents] = useState(new Set());
    const [selectedAssignedStudents, setSelectedAssignedStudents] = useState(new Set());
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [assigningStudents, setAssigningStudents] = useState(false);
    const [assignedStudents, setAssignedStudents] = useState(new Set());
    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [formData, setFormData] = useState({
        course: "",
        title: "",
        description: "",
        instructions: "",
        status: "DRAFT",
        due_date: "",
        max_score: 100,
        file: null,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [assignments, submissions, searchTerm, filterCourse, filterStatus, filterSubmissionStatus]);

    useEffect(() => {
        if (assignOpen && viewingAssignment?.id) {
            loadStudents();
        }
    }, [assignOpen, viewingAssignment?.id]);

    const loadStudents = async () => {
        try {
            setLoadingStudents(true);
            const courseId = viewingAssignment?.course;
            if (!courseId) {
                setStudents([]);
                return;
            }
            const res = await api.get(`/admin/students/?courses__course_id=${courseId}`);
            const studentsList = res.data.results || res.data || [];
            setStudents(studentsList);
            setSelectedAvailableStudents(new Set());
            setSelectedAssignedStudents(new Set());
            
            if (viewingAssignment?.id) {
                try {
                    const assignedRes = await api.get(`/learning/student-assignments/?assignment=${viewingAssignment.id}`);
                    const assigned = assignedRes.data.results || assignedRes.data || [];
                    const assignedStudentIds = new Set();
                    assigned.forEach(a => {
                        assignedStudentIds.add(a.student);
                    });
                    setAssignedStudents(assignedStudentIds);
                } catch (err) {
                    console.error("Failed to load assigned students:", err);
                    setAssignedStudents(new Set());
                }
            }
        } catch (error) {
            console.error("Failed to load students:", error);
            errorToast(error, "Failed to load students");
            setStudents([]);
        } finally {
            setLoadingStudents(false);
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

        if (filterCourse) {
            filtered = filtered.filter((item) => item.course === parseInt(filterCourse));
        }

        if (filterStatus) {
            filtered = filtered.filter((item) => item.status === filterStatus);
        }

        setFilteredAssignments(filtered);

        // Filter submissions
        let filteredSubs = submissions;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredSubs = filteredSubs.filter(
                (item) =>
                    item.student_name.toLowerCase().includes(term) ||
                    item.assignment_title.toLowerCase().includes(term)
            );
        }

        if (filterSubmissionStatus) {
            filteredSubs = filteredSubs.filter((item) => item.status === filterSubmissionStatus);
        }

        setFilteredSubmissions(filteredSubs);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, submissionsRes, coursesData] = await Promise.all([
                api.get("/learning/assignments/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/submissions/").catch(() => ({ data: { results: [] } })),
                getCourses().catch(() => []),
            ]);
            setAssignments(assignmentsRes.data.results || assignmentsRes.data || []);
            setSubmissions(submissionsRes.data.results || submissionsRes.data || []);
            setCourses(coursesData);
        } catch (error) {
            console.error("Error loading data:", error);
            setAssignments([]);
            setSubmissions([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (assignment = null) => {
        if (assignment) {
            setEditingId(assignment.id);
            setFormData(assignment);
        } else {
            setEditingId(null);
            setFormData({
                course: "",
                title: "",
                description: "",
                instructions: "",
                status: "DRAFT",
                due_date: "",
                max_score: 100,
            });
        }
        setOpenDialog(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => (
            {
                ...prev,
                [name]: value,
            }
        ));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB for documents
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
        try {
            const data = new FormData();
            data.append("course", formData.course);
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("instructions", formData.instructions);
            data.append("status", formData.status);
            data.append("due_date", formData.due_date);
            data.append("max_score", formData.max_score);
            if (formData.file) {
                data.append("file", formData.file);
            }

            if (editingId) {
                await api.patch(`/learning/assignments/${editingId}/`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Assignment updated");
            } else {
                await api.post("/learning/assignments/", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Assignment created");
            }
            setOpenDialog(false);
            loadData();
        } catch (error) {
            errorToast(error, "Failed to save");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
        confirmAction(
            `Change status to ${newStatus}?`,
            async () => {
                try {
                    await api.patch(`/learning/assignments/${id}/`, {
                        status: newStatus,
                    });
                    successToast(`Assignment status changed to ${newStatus}`);
                    loadData();
                } catch (error) {
                    errorToast(error, "Failed to update status");
                }
            },
            null,
            "Update",
            "Cancel",
            true
        );
    };

    const handleDelete = async (id) => {
        confirmAction(
            "Delete this assignment?",
            async () => {
                try {
                    await api.delete(`/learning/assignments/${id}/`);
                    successToast("Deleted");
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

    const handleGradeSubmission = async () => {
        try {
            await api.post(`/learning/submissions/${selectedSubmission.id}/grade/`, gradeData);
            successToast("Submission graded");
            setOpenGradeDialog(false);
            loadData();
        } catch (error) {
            errorToast(error, "Failed to grade");
        }
    };

    const handleViewAssignment = (assignment) => {
        setViewingItem({ type: "assignment", data: assignment });
        setViewOpen(true);
    };

    const handleViewSubmission = (submission) => {
        setViewingItem({ type: "submission", data: submission });
        setViewOpen(true);
    };

    const handleAssignClick = (assignment) => {
        setViewingAssignment(assignment);
        setAssignOpen(true);
    };

    const handleToggleAvailableStudent = (studentId) => {
        const newSelected = new Set(selectedAvailableStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedAvailableStudents(newSelected);
    };

    const handleToggleAssignedStudent = (studentId) => {
        const newSelected = new Set(selectedAssignedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedAssignedStudents(newSelected);
    };

    const handleAssignToStudents = async () => {
        if (selectedAvailableStudents.size === 0) {
            errorToast(null, "Please select at least one student");
            return;
        }

        if (students.length === 0) {
            errorToast(null, "Students are still loading. Please wait a moment and try again.");
            return;
        }

        try {
            setAssigningStudents(true);
            const payload = {
                assignment_id: viewingAssignment.id,
                student_ids: Array.from(selectedAvailableStudents),
            };
            await api.post(`/learning/student-assignments/assign_to_students/`, payload);
            successToast(`Assignment assigned to ${selectedAvailableStudents.size} student(s)`);
            setSelectedAvailableStudents(new Set());
            loadStudents();
        } catch (error) {
            console.error("Assignment error:", error);
            errorToast(error, "Failed to assign assignment");
        } finally {
            setAssigningStudents(false);
        }
    };

    const handleUnassignFromStudents = async () => {
        if (selectedAssignedStudents.size === 0) {
            errorToast(null, "Please select at least one student");
            return;
        }

        confirmAction(
            `Remove this assignment from ${selectedAssignedStudents.size} student(s)?`,
            async () => {
                try {
                    setAssigningStudents(true);
                    await api.post(`/learning/student-assignments/unassign_from_students/`, {
                        assignment_id: viewingAssignment.id,
                        student_ids: Array.from(selectedAssignedStudents),
                    });
                    successToast(`Assignment removed from ${selectedAssignedStudents.size} student(s)`);
                    const newAssignedStudents = new Set(assignedStudents);
                    selectedAssignedStudents.forEach(id => newAssignedStudents.delete(id));
                    setAssignedStudents(newAssignedStudents);
                    setSelectedAssignedStudents(new Set());
                } catch (error) {
                    errorToast(error, "Failed to unassign assignment");
                } finally {
                    setAssigningStudents(false);
                }
            },
            null,
            "Remove",
            "Cancel",
            true
        );
    };



    const getCourseName = (courseId) => {
        return courses.find((c) => c.id === courseId)?.name || "Unknown";
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Assignments" />
                <Tab label="Submissions" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="h6" fontWeight={700}>
                        Assignments
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Create Assignment
                    </Button>
                </Box>

                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                        />

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
                                    <MenuItem value="DRAFT">Draft</MenuItem>
                                    <MenuItem value="PUBLISHED">Published</MenuItem>
                                    <MenuItem value="CLOSED">Closed</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                </Paper>

                {filteredAssignments.length === 0 ? (
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
                            No assignments found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm || filterCourse || filterStatus ? "Try adjusting your filters" : "Create your first assignment to get started. Click \"Create Assignment\" above."}
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "grey.200" }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "grey.50" }}>
                                <TableRow>
                                    <TableCell fontWeight={700}>Title</TableCell>
                                    <TableCell>Course</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAssignments.map((assignment) => (
                                    <TableRow key={assignment.id} hover>
                                        <TableCell>{assignment.title}</TableCell>
                                        <TableCell>{getCourseName(assignment.course)}</TableCell>
                                        <TableCell>
                                            {new Date(assignment.due_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant={assignment.status === "PUBLISHED" ? "contained" : "outlined"}
                                                color={assignment.status === "PUBLISHED" ? "success" : "default"}
                                                onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                                            >
                                                {assignment.status}
                                            </Button>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewAssignment(assignment)}
                                                title="View details"
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAssignClick(assignment)}
                                                title="Assign to students"
                                            >
                                                <PersonAdd fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(assignment)}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(assignment.id)}
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
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    Student Submissions
                </Typography>

                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search by student name or assignment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                        />

                        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                            <FormControl sx={{ minWidth: 150 }} size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filterSubmissionStatus}
                                    onChange={(e) => setFilterSubmissionStatus(e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    <MenuItem value="SUBMITTED">Submitted</MenuItem>
                                    <MenuItem value="GRADED">Graded</MenuItem>
                                    <MenuItem value="LATE">Late</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                </Paper>

                {filteredSubmissions.length === 0 ? (
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
                            No submissions found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm || filterSubmissionStatus ? "Try adjusting your filters" : "Student submissions will appear here once they submit their assignments."}
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "grey.200" }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "grey.50" }}>
                                <TableRow>
                                    <TableCell fontWeight={700}>Student</TableCell>
                                    <TableCell>Assignment</TableCell>
                                    <TableCell>Submitted</TableCell>
                                    <TableCell>Score</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSubmissions.map((submission) => (
                                    <TableRow key={submission.id} hover>
                                        <TableCell>{submission.student_name}</TableCell>
                                        <TableCell>{submission.assignment_title}</TableCell>
                                        <TableCell>
                                            {new Date(submission.submitted_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{submission.score || "—"}</TableCell>
                                        <TableCell>
                                            <Chip label={submission.status} size="small" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewSubmission(submission)}
                                                title="View details"
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                            <Button
                                                size="small"
                                                startIcon={<CheckCircle />}
                                                onClick={() => {
                                                    setSelectedSubmission(submission);
                                                    setGradeData({
                                                        score: submission.score || "",
                                                        feedback: submission.feedback || "",
                                                    });
                                                    setOpenGradeDialog(true);
                                                }}
                                            >
                                                Grade
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </TabPanel>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingId ? "Edit Assignment" : "Create Assignment"}
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
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Instructions"
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Due Date"
                        name="due_date"
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={handleChange}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Max Score"
                        name="max_score"
                        type="number"
                        value={formData.max_score}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    />

                    <Select
                        fullWidth
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="DRAFT">Draft</MenuItem>
                        <MenuItem value="PUBLISHED">Published</MenuItem>
                        <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>

                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                        fullWidth
                    >
                        {formData.file ? formData.file.name : "Upload Assignment File"}
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
                        Max file size: 10MB (PDF, Word, Excel, PowerPoint)
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Grade Submission</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField
                        fullWidth
                        label="Score"
                        type="number"
                        value={gradeData.score}
                        onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Feedback"
                        value={gradeData.feedback}
                        onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGradeDialog(false)}>Cancel</Button>
                    <Button onClick={handleGradeSubmission} variant="contained">
                        Submit Grade
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {viewingItem?.type === "assignment" ? "Assignment Details" : "Submission Details"}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingItem && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {viewingItem.type === "assignment" ? (
                                <>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Title
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.title}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Course
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {getCourseName(viewingItem.data.course)}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Description
                                        </Typography>
                                        <Typography variant="body2">
                                            {viewingItem.data.description || "—"}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Instructions
                                        </Typography>
                                        <Typography variant="body2">
                                            {viewingItem.data.instructions || "—"}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Due Date
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(viewingItem.data.due_date).toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Max Score
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.max_score}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                            <Button
                                                size="small"
                                                variant={viewingItem.data.status === "PUBLISHED" ? "contained" : "outlined"}
                                                color={viewingItem.data.status === "PUBLISHED" ? "success" : "default"}
                                                onClick={() => {
                                                    handleToggleStatus(viewingItem.data.id, viewingItem.data.status);
                                                    setViewOpen(false);
                                                }}
                                            >
                                                {viewingItem.data.status}
                                            </Button>
                                        </Box>
                                    </Box>

                                    {viewingItem.data.file && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                File
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                                <Typography
                                                    variant="body2"
                                                    component="a"
                                                    href={viewingItem.data.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ color: "primary.main", textDecoration: "none", flex: 1, wordBreak: "break-all" }}
                                                >
                                                    {viewingItem.data.file.split("/").pop()}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    href={viewingItem.data.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    )}

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Created
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(viewingItem.data.created_at).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Student
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.student_name}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Assignment
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.assignment_title}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Submitted
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(viewingItem.data.submitted_at).toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.status}
                                        </Typography>
                                    </Box>

                                    {viewingItem.data.file && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Submission File
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                                <Typography
                                                    variant="body2"
                                                    component="a"
                                                    href={viewingItem.data.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ color: "primary.main", textDecoration: "none", flex: 1, wordBreak: "break-all" }}
                                                >
                                                    {viewingItem.data.file.split("/").pop()}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    href={viewingItem.data.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    )}

                                    {viewingItem.data.score && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Score
                                            </Typography>
                                            <Typography variant="body2" fontWeight={500}>
                                                {viewingItem.data.score}
                                            </Typography>
                                        </Box>
                                    )}

                                    {viewingItem.data.feedback && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Feedback
                                            </Typography>
                                            <Typography variant="body2">
                                                {viewingItem.data.feedback}
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 0 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Assign to Students
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {viewingAssignment?.title}
                        </Typography>
                    </Box>
                </DialogTitle>

                <Tabs
                    value={assignmentTabValue}
                    onChange={(e, val) => setAssignmentTabValue(val)}
                    sx={{ borderBottom: "1px solid", borderColor: "grey.200", px: 2 }}
                >
                    <Tab label={`Available (${students.filter(s => !assignedStudents.has(s.id)).length})`} />
                    <Tab label={`Assigned (${assignedStudents.size})`} />
                </Tabs>

                <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {loadingStudents ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                placeholder="Search by name or email..."
                                value={studentSearchTerm}
                                onChange={(e) => setStudentSearchTerm(e.target.value)}
                                size="small"
                            />

                            <TabPanel value={assignmentTabValue} index={0}>
                                <Box
                                    sx={{
                                        maxHeight: 350,
                                        overflow: "auto",
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        borderRadius: 1,
                                        bgcolor: "grey.50",
                                    }}
                                >
                                    {students
                                        .filter(s => !assignedStudents.has(s.id))
                                        .filter(
                                            (student) =>
                                                student.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                student.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                        )
                                        .length > 0 ? (
                                        students
                                            .filter(s => !assignedStudents.has(s.id))
                                            .filter(
                                                (student) =>
                                                    student.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    student.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                            )
                                            .map((student, index, arr) => (
                                                <Box
                                                    key={student.id}
                                                    onClick={() => handleToggleAvailableStudent(student.id)}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                        p: 1.5,
                                                        borderBottom: index < arr.length - 1 ? "1px solid" : "none",
                                                        borderColor: "grey.200",
                                                        cursor: "pointer",
                                                        bgcolor: selectedAvailableStudents.has(student.id) ? "primary.50" : "transparent",
                                                        "&:hover": { bgcolor: "primary.50" },
                                                        transition: "background-color 0.2s",
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={selectedAvailableStudents.has(student.id)}
                                                        onChange={() => handleToggleAvailableStudent(student.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        size="small"
                                                    />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={500} noWrap>
                                                            {student.first_name} {student.last_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {student.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))
                                    ) : (
                                        <Box sx={{ p: 3, textAlign: "center" }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {studentSearchTerm ? "No match" : "All assigned"}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleAssignToStudents}
                                    disabled={loadingStudents || assigningStudents || selectedAvailableStudents.size === 0}
                                    sx={{ mt: 2 }}
                                >
                                    {assigningStudents ? "Assigning..." : `Assign (${selectedAvailableStudents.size})`}
                                </Button>
                            </TabPanel>

                            <TabPanel value={assignmentTabValue} index={1}>
                                <Box
                                    sx={{
                                        maxHeight: 350,
                                        overflow: "auto",
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        borderRadius: 1,
                                        bgcolor: "success.50",
                                    }}
                                >
                                    {students
                                        .filter(s => assignedStudents.has(s.id))
                                        .filter(
                                            (student) =>
                                                student.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                student.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                        )
                                        .length > 0 ? (
                                        students
                                            .filter(s => assignedStudents.has(s.id))
                                            .filter(
                                                (student) =>
                                                    student.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    student.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                            )
                                            .map((student, index, arr) => (
                                                <Box
                                                    key={student.id}
                                                    onClick={() => handleToggleAssignedStudent(student.id)}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                        p: 1.5,
                                                        borderBottom: index < arr.length - 1 ? "1px solid" : "none",
                                                        borderColor: "grey.200",
                                                        cursor: "pointer",
                                                        bgcolor: selectedAssignedStudents.has(student.id) ? "error.50" : "transparent",
                                                        "&:hover": { bgcolor: "error.50" },
                                                        transition: "background-color 0.2s",
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={selectedAssignedStudents.has(student.id)}
                                                        onChange={() => handleToggleAssignedStudent(student.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        size="small"
                                                    />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={500} noWrap>
                                                            {student.first_name} {student.last_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {student.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))
                                    ) : (
                                        <Box sx={{ p: 3, textAlign: "center" }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {studentSearchTerm ? "No match" : "None assigned"}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    onClick={handleUnassignFromStudents}
                                    disabled={loadingStudents || assigningStudents || selectedAssignedStudents.size === 0}
                                    sx={{ mt: 2 }}
                                >
                                    {assigningStudents ? "Removing..." : `Remove (${selectedAssignedStudents.size})`}
                                </Button>
                            </TabPanel>
                        </>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
                    <Button onClick={() => setAssignOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
