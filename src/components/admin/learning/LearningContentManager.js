"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Paper,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tabs,
    Tab,
    Checkbox,
    TableSortLabel,
    FormControl,
    InputLabel,
    Select,
    Stack,
} from "@mui/material";
import { Add, CloudUpload, Edit, Delete, Download, Visibility, DeleteOutlined, PersonAdd } from "@mui/icons-material";
import { getCourses } from "@/services/courses";
import api from "@/lib/axios";
import { errorToast, successToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

export default function LearningContentManager() {
    const [courses, setCourses] = useState([]);
    const [contents, setContents] = useState([]);
    const [filteredContents, setFilteredContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [viewingContent, setViewingContent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterPublished, setFilterPublished] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [students, setStudents] = useState([]);
    const [selectedAvailableStudents, setSelectedAvailableStudents] = useState(new Set());
    const [selectedAssignedStudents, setSelectedAssignedStudents] = useState(new Set());
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [assigningStudents, setAssigningStudents] = useState(false);
    const [assignmentTabValue, setAssignmentTabValue] = useState(0);
    const [assignedStudents, setAssignedStudents] = useState(new Set());
    const [formData, setFormData] = useState({
        course: "",
        title: "",
        description: "",
        file: null,
        video_url: "",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [contents, searchTerm, filterCourse, filterType, filterPublished, sortBy, sortOrder]);

    useEffect(() => {
        if (assignOpen && viewingContent?.id) {
            loadStudents();
        }
    }, [assignOpen, viewingContent?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [coursesData, contentsRes] = await Promise.all([
                getCourses().catch(() => []),
                api.get("/learning/learning-content/").catch(() => ({ data: { results: [] } })),
            ]);
            setCourses(coursesData);
            setContents(contentsRes.data.results || contentsRes.data || []);
        } catch (error) {
            errorToast(error, "Failed to load data");
            setCourses([]);
            setContents([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            setLoadingStudents(true);
            const courseId = viewingContent?.course;
            if (!courseId) {
                setStudents([]);
                return;
            }
            const res = await api.get(`/admin/students/?courses__course_id=${courseId}`);
            const studentsList = res.data.results || res.data || [];
            setStudents(studentsList);
            setSelectedAvailableStudents(new Set());
            setSelectedAssignedStudents(new Set());
            
            // Load already assigned students
            if (viewingContent?.id) {
                try {
                    const assignedRes = await api.get(`/learning/student-learning-content/?learning_content=${viewingContent.id}`);
                    const assigned = assignedRes.data.results || assignedRes.data || [];
                    const assignedStudentIds = new Set();
                    assigned.forEach(a => {
                        assignedStudentIds.add(a.student_id);
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

    const applyFiltersAndSort = () => {
        let filtered = [...contents];

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterCourse) {
            filtered = filtered.filter((item) => item.course === parseInt(filterCourse));
        }

        if (filterType) {
            filtered = filtered.filter((item) => item.content_type === filterType);
        }

        if (filterPublished !== "") {
            filtered = filtered.filter((item) => item.is_published === (filterPublished === "true"));
        }

        filtered.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (sortBy === "created_at" || sortBy === "updated_at") {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredContents(filtered);
    };

    const getContentType = () => {
        if (formData.video_url && formData.video_url.trim()) return "VIDEO";
        if (!formData.file) return null;

        const fileName = formData.file.name.toLowerCase();
        if (fileName.endsWith(".pdf") || fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
            return "DOCUMENT";
        }
        if (fileName.endsWith(".txt")) return "ARTICLE";
        if (fileName.endsWith(".zip") || fileName.endsWith(".rar")) return "RESOURCE";
        return "DOCUMENT";
    };

    const handleAddClick = () => {
        setEditingId(null);
        setFormData({
            course: "",
            title: "",
            description: "",
            file: null,
            video_url: "",
        });
        setDialogOpen(true);
    };

    const handleEditClick = (content) => {
        setEditingId(content.id);
        setFormData({
            course: content.course,
            title: content.title,
            description: content.description,
            file: null,
            video_url: content.video_url || "",
        });
        setDialogOpen(true);
    };

    const handleViewClick = (content) => {
        setViewingContent(content);
        setViewOpen(true);
    };

    const handleAssignClick = (content) => {
        setViewingContent(content);
        setAssignOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name.toLowerCase();
            const isVideo = fileName.match(/\.(mp4|avi|mov|mkv|flv|wmv)$/i);
            const isDocument = fileName.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i);
            
            let maxSize, fileType;
            if (isVideo) {
                maxSize = 50 * 1024 * 1024; // 50MB for videos
                fileType = "video";
            } else if (isDocument) {
                maxSize = 10 * 1024 * 1024; // 10MB for documents
                fileType = "document";
            } else {
                errorToast(null, "Invalid file type. Allowed: Videos (MP4, AVI, MOV, MKV, FLV, WMV) or Documents (PDF, Word, Excel, PowerPoint, TXT)");
                return;
            }
            
            if (file.size > maxSize) {
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                const maxSizeMB = maxSize / (1024 * 1024);
                errorToast(null, `${fileType} file size exceeds ${maxSizeMB}MB limit. Your file is ${fileSizeMB}MB`);
                return;
            }
            setFormData({ ...formData, file: file, video_url: "" });
        }
    };

    const handleVideoUrlChange = (e) => {
        setFormData({ ...formData, video_url: e.target.value, file: null });
    };

    const handleSubmit = async () => {
        if (!formData.course || !formData.title) {
            errorToast(null, "Course and title are required");
            return;
        }

        const contentType = getContentType();
        if (!contentType) {
            errorToast(null, "Please upload a file or provide a video URL");
            return;
        }

        try {
            setSubmitting(true);
            const data = new FormData();
            data.append("course", formData.course);
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("content_type", contentType);

            if (formData.file) {
                data.append("file", formData.file);
            }
            if (formData.video_url) {
                data.append("video_url", formData.video_url);
            }

            if (editingId) {
                await api.patch(`/learning/learning-content/${editingId}/`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Learning content updated");
            } else {
                await api.post("/learning/learning-content/", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Learning content added successfully");
            }
            handleClose();
            loadData();
        } catch (error) {
            errorToast(error, "Failed to save learning content");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePublish = async (id, currentStatus) => {
        const action = currentStatus ? "unpublish" : "publish";
        confirmAction(
            `${action.charAt(0).toUpperCase() + action.slice(1)} this content?`,
            async () => {
                try {
                    await api.patch(`/learning/learning-content/${id}/`, {
                        is_published: !currentStatus,
                    });
                    successToast(`Content ${action}ed successfully`);
                    loadData();
                } catch (error) {
                    errorToast(error, `Failed to ${action} content`);
                }
            },
            null,
            action.charAt(0).toUpperCase() + action.slice(1),
            "Cancel",
            true
        );
    };

    const handleDelete = async (id) => {
        confirmAction(
            "Delete this content?",
            async () => {
                try {
                    await api.delete(`/learning/learning-content/${id}/`);
                    successToast("Content deleted");
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
            `Delete ${selectedIds.size} selected items?`,
            async () => {
                try {
                    await Promise.all(
                        Array.from(selectedIds).map((id) =>
                            api.delete(`/learning/learning-content/${id}/`)
                        )
                    );
                    successToast(`${selectedIds.size} items deleted`);
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
            setSelectedIds(new Set(filteredContents.map((item) => item.id)));
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
                content_id: viewingContent.id,
                student_ids: Array.from(selectedAvailableStudents),
            };
            console.log("Assigning with payload:", payload);
            await api.post(`/learning/student-learning-content/assign_to_students/`, payload);
            successToast(`Content assigned to ${selectedAvailableStudents.size} student(s)`);
            setSelectedAvailableStudents(new Set());
            loadStudents();
        } catch (error) {
            console.error("Assignment error:", error);
            errorToast(error, "Failed to assign content");
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
            `Remove this content from ${selectedAssignedStudents.size} student(s)?`,
            async () => {
                try {
                    setAssigningStudents(true);
                    await api.post(`/learning/student-learning-content/unassign_from_students/`, {
                        content_id: viewingContent.id,
                        student_ids: Array.from(selectedAssignedStudents),
                    });
                    successToast(`Content removed from ${selectedAssignedStudents.size} student(s)`);
                    const newAssignedStudents = new Set(assignedStudents);
                    selectedAssignedStudents.forEach(id => newAssignedStudents.delete(id));
                    setAssignedStudents(newAssignedStudents);
                    setSelectedAssignedStudents(new Set());
                } catch (error) {
                    errorToast(error, "Failed to unassign content");
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

    const filteredStudents = students.filter((student) =>
        student.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.username?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );

    const getCourseName = (courseId) => {
        return courses.find((c) => c.id === courseId)?.name || "Unknown";
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Typography variant="h5" fontWeight={700}>
                    Learning Content
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddClick}
                    size="medium"
                >
                    Add Content
                </Button>
            </Box>

            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }}>
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Search by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap" }}>
                        <FormControl sx={{ minWidth: { xs: "100%", sm: 140 } }} size="small">
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

                        <FormControl sx={{ minWidth: { xs: "100%", sm: 140 } }} size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                label="Type"
                            >
                                <MenuItem value="">All Types</MenuItem>
                                <MenuItem value="VIDEO">Video</MenuItem>
                                <MenuItem value="DOCUMENT">Document</MenuItem>
                                <MenuItem value="ARTICLE">Article</MenuItem>
                                <MenuItem value="RESOURCE">Resource</MenuItem>
                                <MenuItem value="QUIZ">Quiz</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: { xs: "100%", sm: 140 } }} size="small">
                            <InputLabel>Published</InputLabel>
                            <Select
                                value={filterPublished}
                                onChange={(e) => setFilterPublished(e.target.value)}
                                label="Published"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="true">Published</MenuItem>
                                <MenuItem value="false">Unpublished</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: { xs: "100%", sm: 130 } }} size="small">
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                label="Sort By"
                            >
                                <MenuItem value="title">Title</MenuItem>
                                <MenuItem value="created_at">Created Date</MenuItem>
                                <MenuItem value="updated_at">Updated Date</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: { xs: "100%", sm: 110 } }} size="small">
                            <InputLabel>Order</InputLabel>
                            <Select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                label="Order"
                            >
                                <MenuItem value="asc">Ascending</MenuItem>
                                <MenuItem value="desc">Descending</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {selectedIds.size > 0 && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "error.50", borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                                {selectedIds.size} selected
                            </Typography>
                            <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteOutlined />}
                                onClick={handleBulkDelete}
                                variant="contained"
                            >
                                Delete
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Paper>

            {filteredContents.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "grey.200",
                        p: { xs: 2, sm: 4 },
                        textAlign: "center",
                    }}
                >
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                        No learning content found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {searchTerm || filterCourse || filterType || filterPublished !== ""
                            ? "Try adjusting your filters"
                            : "Click 'Add Content' to create learning materials for your courses."}
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ overflowX: "auto", borderRadius: 2 }}>
                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: "primary.50" }}>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                                        <Checkbox
                                            checked={selectedIds.size === filteredContents.length && filteredContents.length > 0}
                                            indeterminate={selectedIds.size > 0 && selectedIds.size < filteredContents.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        <TableSortLabel
                                            active={sortBy === "title"}
                                            direction={sortBy === "title" ? sortOrder : "asc"}
                                            onClick={() => {
                                                if (sortBy === "title") {
                                                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                                } else {
                                                    setSortBy("title");
                                                    setSortOrder("asc");
                                                }
                                            }}
                                        >
                                            Title
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: "none", md: "table-cell" }, fontWeight: 700 }}>Course</TableCell>
                                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, fontWeight: 700 }}>Type</TableCell>
                                    <TableCell sx={{ display: { xs: "none", md: "table-cell" }, fontWeight: 700 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredContents.map((content) => (
                                    <TableRow key={content.id} hover sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                                        <TableCell padding="checkbox" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                                            <Checkbox
                                                checked={selectedIds.has(content.id)}
                                                onChange={() => handleSelectItem(content.id)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500} noWrap>
                                                    {content.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", sm: "none" } }}>
                                                    {getCourseName(content.course)}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: "none", md: "table-cell" }, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                            {getCourseName(content.course)}
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                            <Chip label={content.content_type} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: "none", md: "table-cell" }, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                            <Button
                                                size="small"
                                                variant={content.is_published ? "contained" : "outlined"}
                                                color={content.is_published ? "success" : "default"}
                                                onClick={() => handleTogglePublish(content.id, content.is_published)}
                                            >
                                                {content.is_published ? "Published" : "Draft"}
                                            </Button>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewClick(content)}
                                                    title="View details"
                                                    sx={{ color: "primary.main" }}
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAssignClick(content)}
                                                    title="Assign to students"
                                                    sx={{ color: "info.main" }}
                                                >
                                                    <PersonAdd fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(content)}
                                                    title="Edit"
                                                    sx={{ color: "warning.main" }}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(content.id)}
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
                </Box>
            )}
            <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingId ? "Edit Learning Content" : "Add Learning Content"}
                </DialogTitle>
                <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        select
                        label="Course"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        fullWidth
                        required
                    >
                        {courses.map((course) => (
                            <MenuItem key={course.id} value={course.id}>
                                {course.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={3}
                    />

                    <Box sx={{ border: "1px solid #ddd", borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            Add Content
                        </Typography>

                        <TextField
                            label="Video URL (YouTube, Vimeo, etc.)"
                            value={formData.video_url}
                            onChange={handleVideoUrlChange}
                            fullWidth
                            placeholder="https://youtube.com/watch?v=..."
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            OR
                        </Typography>

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            fullWidth
                        >
                            {formData.file ? formData.file.name : "Upload File"}
                            <input
                                type="file"
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
                            Videos: Max 50MB (MP4, AVI, MOV, MKV, FLV, WMV) | Documents: Max 10MB (PDF, Word, Excel, PowerPoint, TXT)
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                        {submitting ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Content Details</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingContent && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Title
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {viewingContent.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Course
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {getCourseName(viewingContent.course)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body2">
                                    {viewingContent.description || "—"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Content Type
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {viewingContent.content_type}
                                </Typography>
                            </Box>

                            {viewingContent.video_url && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Video URL
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="a"
                                        href={viewingContent.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ color: "primary.main", textDecoration: "none", wordBreak: "break-all" }}
                                    >
                                        {viewingContent.video_url}
                                    </Typography>
                                </Box>
                            )}

                            {viewingContent.file && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        File
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            component="a"
                                            href={viewingContent.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ color: "primary.main", textDecoration: "none", flex: 1, wordBreak: "break-all" }}
                                        >
                                            {viewingContent.file.split("/").pop()}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            href={viewingContent.file}
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
                                    Status
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                    <Button
                                        size="small"
                                        variant={viewingContent.is_published ? "contained" : "outlined"}
                                        color={viewingContent.is_published ? "success" : "default"}
                                        onClick={() => {
                                            handleTogglePublish(viewingContent.id, viewingContent.is_published);
                                            setViewOpen(false);
                                        }}
                                    >
                                        {viewingContent.is_published ? "Published" : "Draft"}
                                    </Button>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Created
                                </Typography>
                                <Typography variant="body2">
                                    {new Date(viewingContent.created_at).toLocaleString()}
                                </Typography>
                            </Box>
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
                            Manage Student Access
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {viewingContent?.title}
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
