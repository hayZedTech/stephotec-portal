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
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Add, CloudUpload, Edit, Delete, Download, Visibility, DeleteOutlined, PersonAdd } from "@mui/icons-material";
import { getCourses } from "@/services/courses";
import api from "@/lib/axios";
import { errorToast, successToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import { downloadFileWithRealName } from "@/utils/fileDownloader";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

export default function LearningContentManager() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
    // Group assignment state
    const [assignModalTab, setAssignModalTab] = useState(0); // 0=Individual, 1=Group
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [groupSearchTerm, setGroupSearchTerm] = useState("");
    const [assigningGroup, setAssigningGroup] = useState(false);
    const [formData, setFormData] = useState({
        course: "",
        title: "",
        description: "",
        file: null,
        existingFile: null,
        video_url: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const getGroupMemberIds = (g) => {
        if (!g) return [];
        return g.members_detail ? g.members_detail.map(m => m.id) : (g.members || []);
    };
    
    const isGroupAssigned = (g) => {
        if (!g) return false;
        if (g.members_detail && g.members_detail.length > 0) {
            return g.members_detail.every(m => assignedStudents.has(m.id));
        }
        if (g.members && g.members.length > 0) {
            return g.members.every(id => assignedStudents.has(id));
        }
        return false;
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [contents, searchTerm, filterCourse, filterType, filterPublished, sortBy, sortOrder]);

    useEffect(() => {
        if (assignOpen && viewingContent?.id) {
            loadStudents();
            loadGroups(viewingContent.course);
            setAssignModalTab(0);
            setSelectedGroupId("");
            setGroupSearchTerm("");
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

    const loadStudents = async (background = false) => {
        try {
            if (!background) setLoadingStudents(true);
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
            if (!background) setLoadingStudents(false);
        }
    };

    const loadGroups = async (courseId) => {
        if (!courseId) { setGroups([]); return; }
        try {
            setLoadingGroups(true);
            const res = await api.get(`/admin/groups/?course=${courseId}`);
            setGroups(res.data.results || res.data || []);
        } catch {
            setGroups([]);
        } finally {
            setLoadingGroups(false);
        }
    };

    const handleAssignToGroup = async () => {
        if (!selectedGroupId) { errorToast(null, "Please select a group."); return; }
        try {
            setAssigningGroup(true);
            await api.post("/learning/student-learning-content/assign_to_students/", {
                content_id: viewingContent.id,
                group_id: selectedGroupId,
            });
            successToast("Content assigned to group members!");
            const group = groups.find(g => g.id === selectedGroupId);
            if (group) {
                const newAssigned = new Set(assignedStudents);
                getGroupMemberIds(group).forEach(id => newAssigned.add(id));
                setAssignedStudents(newAssigned);
            }
            setSelectedGroupId("");
            loadStudents(true);
        } catch (err) {
            errorToast(err, "Failed to assign to group");
        } finally {
            setAssigningGroup(false);
        }
    };

    const handleUnassignFromGroup = async () => {
        if (!selectedGroupId) { errorToast(null, "Please select a group."); return; }
        try {
            setAssigningGroup(true);
            await api.post("/learning/student-learning-content/unassign_from_students/", {
                content_id: viewingContent.id,
                group_id: selectedGroupId,
            });
            successToast("Content removed from group members!");
            const group = groups.find(g => g.id === selectedGroupId);
            if (group) {
                const newAssigned = new Set(assignedStudents);
                getGroupMemberIds(group).forEach(id => newAssigned.delete(id));
                setAssignedStudents(newAssigned);
            }
            setSelectedGroupId("");
            loadStudents(true);
        } catch (err) {
            errorToast(err, "Failed to remove from group");
        } finally {
            setAssigningGroup(false);
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
            existingFile: content.file || null,
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
                maxSize = 50 * 1024 * 1024;
                fileType = "video";
            } else if (isDocument) {
                maxSize = 10 * 1024 * 1024;
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
            // new file chosen: clear video_url and existingFile
            setFormData({ ...formData, file, video_url: "", existingFile: null });
        }
    };

    const handleVideoUrlChange = (e) => {
        // switching to URL: clear file and existingFile
        setFormData({ ...formData, video_url: e.target.value, file: null, existingFile: null });
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
            const newAssigned = new Set(assignedStudents);
            selectedAvailableStudents.forEach(id => newAssigned.add(id));
            setAssignedStudents(newAssigned);
            setSelectedAvailableStudents(new Set());
            loadStudents(true);
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
                    {isMobile ? (
                        <Stack spacing={2}>
                            {filteredContents.map((content) => (
                                <Card key={content.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                    <CardContent>
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                                            <Checkbox
                                                checked={selectedIds.has(content.id)}
                                                onChange={() => handleSelectItem(content.id)}
                                                sx={{ p: 0 }}
                                            />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    {content.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {getCourseName(content.course)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Stack spacing={1.5} mb={2} pl={4}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Type</Typography>
                                                <Chip label={content.content_type} size="small" variant="outlined" />
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                                                <Button size="small" variant={content.is_published ? "contained" : "outlined"} color={content.is_published ? "success" : "default"} onClick={() => handleTogglePublish(content.id, content.is_published)}>{content.is_published ? "Published" : "Draft"}</Button>
                                            </Box>
                                        </Stack>
                                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
                                            <IconButton size="small" onClick={() => handleViewClick(content)} sx={{ color: "primary.main" }}><Visibility fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleAssignClick(content)} sx={{ color: "info.main" }}><PersonAdd fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleEditClick(content)} sx={{ color: "warning.main" }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(content.id)} sx={{ color: "error.main" }}><Delete fontSize="small" /></IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "primary.50" }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.size === filteredContents.length && filteredContents.length > 0}
                                                indeterminate={selectedIds.size > 0 && selectedIds.size < filteredContents.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>
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
                                        <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredContents.map((content) => (
                                        <TableRow key={content.id} hover sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.has(content.id)}
                                                    onChange={() => handleSelectItem(content.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{content.title}</TableCell>
                                            <TableCell>{getCourseName(content.course)}</TableCell>
                                            <TableCell>
                                                <Chip label={content.content_type} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant={content.is_published ? "contained" : "outlined"}
                                                    color={content.is_published ? "success" : "default"}
                                                    onClick={() => handleTogglePublish(content.id, content.is_published)}
                                                >
                                                    {content.is_published ? "Published" : "Draft"}
                                                </Button>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleViewClick(content)} sx={{ color: "primary.main" }}><Visibility fontSize="small" /></IconButton>
                                                <IconButton size="small" onClick={() => handleAssignClick(content)} sx={{ color: "info.main" }}><PersonAdd fontSize="small" /></IconButton>
                                                <IconButton size="small" onClick={() => handleEditClick(content)} sx={{ color: "warning.main" }}><Edit fontSize="small" /></IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(content.id)} sx={{ color: "error.main" }}><Delete fontSize="small" /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}
            <Dialog open={dialogOpen} onClose={(e, reason) => { if (reason === 'backdropClick') return; handleClose(e, reason); }} maxWidth="sm" fullWidth>
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
                            {formData.file
                                ? formData.file.name
                                : formData.existingFile
                                ? `Current: ${formData.existingFile.split("/").pop()}`
                                : "Upload File"}
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

            <Dialog open={viewOpen} onClose={(e, reason) => { if (reason === 'backdropClick') return; setViewOpen(false); }} maxWidth="sm" fullWidth>
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
                                            component="button"
                                            onClick={() => downloadFileWithRealName(viewingContent.file, `${viewingContent.title || "learning_content"}.${viewingContent.file.split(".").pop() || "pdf"}`)}
                                            sx={{ color: "primary.main", textDecoration: "underline", flex: 1, wordBreak: "break-all", background: "none", border: "none", p: 0, textAlign: "left", cursor: "pointer", fontSize: "0.875rem" }}
                                        >
                                            {viewingContent.title || "Content File"}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => downloadFileWithRealName(viewingContent.file, `${viewingContent.title || "learning_content"}.${viewingContent.file.split(".").pop() || "pdf"}`)}
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

            <Dialog open={assignOpen} onClose={(e, reason) => { if (reason === 'backdropClick') return; setAssignOpen(false); }} maxWidth="sm" fullWidth>
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

                {/* Top-level: Individual vs Group */}
                <Tabs
                    value={assignModalTab}
                    onChange={(e, val) => { setAssignModalTab(val); setStudentSearchTerm(""); setGroupSearchTerm(""); }}
                    sx={{ px: 2, borderBottom: "2px solid", borderColor: "primary.main", "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 44 } }}
                >
                    <Tab label="Individual" />
                    <Tab label="Group" />
                </Tabs>

                {assignModalTab === 0 && (
                    <>
                        <Tabs
                            value={assignmentTabValue}
                            onChange={(e, val) => setAssignmentTabValue(val)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: "1px solid", borderColor: "grey.200", px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } } }}
                        >
                            <Tab label={loadingStudents ? "Available (...)" : `Available (${students.filter(s => !assignedStudents.has(s.id)).length})`} disabled={loadingStudents} />
                            <Tab label={loadingStudents ? "Assigned (...)" : `Assigned (${assignedStudents.size})`} disabled={loadingStudents} />
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
                                        <Box sx={{ maxHeight: 350, overflow: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 1, bgcolor: "grey.50" }}>
                                            {students.filter(s => !assignedStudents.has(s.id)).filter(s =>
                                                s.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                s.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                            ).length > 0 ? (
                                                students.filter(s => !assignedStudents.has(s.id)).filter(s =>
                                                    s.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    s.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                                ).map((student, index, arr) => (
                                                    <Box key={student.id} onClick={() => handleToggleAvailableStudent(student.id)}
                                                        sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderBottom: index < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200", cursor: "pointer", bgcolor: selectedAvailableStudents.has(student.id) ? "primary.50" : "transparent", "&:hover": { bgcolor: "primary.50" }, transition: "background-color 0.2s" }}>
                                                        <Checkbox checked={selectedAvailableStudents.has(student.id)} onChange={() => handleToggleAvailableStudent(student.id)} onClick={(e) => e.stopPropagation()} size="small" />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" fontWeight={500} noWrap>{student.first_name} {student.last_name}</Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>{student.email}</Typography>
                                                        </Box>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{ p: 3, textAlign: "center" }}>
                                                    <Typography variant="body2" color="text.secondary">{studentSearchTerm ? "No match" : "All assigned"}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Button fullWidth variant="contained" onClick={handleAssignToStudents} disabled={loadingStudents || assigningStudents || selectedAvailableStudents.size === 0} sx={{ mt: 2, display: "flex", gap: 1 }}>
                                            {assigningStudents && <CircularProgress size={16} color="inherit" />}
                                            {assigningStudents ? "Assigning..." : `Assign (${selectedAvailableStudents.size})`}
                                        </Button>
                                    </TabPanel>

                                    <TabPanel value={assignmentTabValue} index={1}>
                                        <Box sx={{ maxHeight: 350, overflow: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 1, bgcolor: "success.50" }}>
                                            {students.filter(s => assignedStudents.has(s.id)).filter(s =>
                                                s.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                s.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                            ).length > 0 ? (
                                                students.filter(s => assignedStudents.has(s.id)).filter(s =>
                                                    s.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    s.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                                    s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                                ).map((student, index, arr) => (
                                                    <Box key={student.id} onClick={() => handleToggleAssignedStudent(student.id)}
                                                        sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderBottom: index < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200", cursor: "pointer", bgcolor: selectedAssignedStudents.has(student.id) ? "error.50" : "transparent", "&:hover": { bgcolor: "error.50" }, transition: "background-color 0.2s" }}>
                                                        <Checkbox checked={selectedAssignedStudents.has(student.id)} onChange={() => handleToggleAssignedStudent(student.id)} onClick={(e) => e.stopPropagation()} size="small" />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" fontWeight={500} noWrap>{student.first_name} {student.last_name}</Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>{student.email}</Typography>
                                                        </Box>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{ p: 3, textAlign: "center" }}>
                                                    <Typography variant="body2" color="text.secondary">{studentSearchTerm ? "No match" : "None assigned"}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Button fullWidth variant="outlined" color="error" onClick={handleUnassignFromStudents} disabled={loadingStudents || assigningStudents || selectedAssignedStudents.size === 0} sx={{ mt: 2, display: "flex", gap: 1 }}>
                                            {assigningStudents && <CircularProgress size={16} color="inherit" />}
                                            {assigningStudents ? "Removing..." : `Remove (${selectedAssignedStudents.size})`}
                                        </Button>
                                    </TabPanel>
                                </>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
                            <Button onClick={() => setAssignOpen(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}

                {assignModalTab === 1 && (
                    <>
                        <Tabs
                            value={assignmentTabValue}
                            onChange={(e, val) => setAssignmentTabValue(val)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: "1px solid", borderColor: "grey.200", px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } } }}
                        >
                            <Tab label={loadingGroups || loadingStudents ? "Available (...)" : `Available (${groups.filter(g => !isGroupAssigned(g)).length})`} disabled={loadingGroups || loadingStudents} />
                            <Tab label={loadingGroups || loadingStudents ? "Assigned (...)" : `Assigned (${groups.filter(g => isGroupAssigned(g)).length})`} disabled={loadingGroups || loadingStudents} />
                        </Tabs>

                        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                            {(loadingGroups || loadingStudents) ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                            ) : groups.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">No groups found for this course.</Typography>
                                    <Typography variant="caption" color="text.disabled">Create a group first from the Groups page.</Typography>
                                </Box>
                            ) : (
                                <>
                                    <TextField fullWidth size="small" placeholder="Search groups by name..." value={groupSearchTerm} onChange={e => setGroupSearchTerm(e.target.value)} />
                                    
                                    <TabPanel value={assignmentTabValue} index={0}>
                                        <Box sx={{ maxHeight: 320, overflow: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 1, bgcolor: "grey.50" }}>
                                            {groups.filter(g => !isGroupAssigned(g)).filter(g => !groupSearchTerm || g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())).length > 0 ? (
                                                groups.filter(g => !isGroupAssigned(g)).filter(g => !groupSearchTerm || g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())).map((group, idx, arr) => (
                                                    <Box key={group.id} onClick={() => setSelectedGroupId(group.id === selectedGroupId ? "" : group.id)}
                                                        sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderBottom: idx < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200", cursor: "pointer", bgcolor: selectedGroupId === group.id ? "primary.50" : "transparent", "&:hover": { bgcolor: "primary.50" }, transition: "background-color 0.2s" }}>
                                                        <Checkbox checked={selectedGroupId === group.id} onChange={() => setSelectedGroupId(group.id === selectedGroupId ? "" : group.id)} onClick={e => e.stopPropagation()} size="small" />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" fontWeight={600} noWrap>{group.name}</Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>{group.member_count} member(s){group.description ? ` — ${group.description}` : ""}</Typography>
                                                        </Box>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{ p: 3, textAlign: "center" }}>
                                                    <Typography variant="body2" color="text.secondary">{groupSearchTerm ? "No match" : "All assigned"}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Button fullWidth variant="contained" onClick={handleAssignToGroup} disabled={!selectedGroupId || assigningGroup} sx={{ fontWeight: 700, mt: 2, display: "flex", gap: 1 }}>
                                            {assigningGroup && <CircularProgress size={16} color="inherit" />}
                                            {assigningGroup ? "Assigning..." : "Assign to Group"}
                                        </Button>
                                    </TabPanel>

                                    <TabPanel value={assignmentTabValue} index={1}>
                                        <Box sx={{ maxHeight: 320, overflow: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 1, bgcolor: "success.50" }}>
                                            {groups.filter(g => isGroupAssigned(g)).filter(g => !groupSearchTerm || g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())).length > 0 ? (
                                                groups.filter(g => isGroupAssigned(g)).filter(g => !groupSearchTerm || g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())).map((group, idx, arr) => (
                                                    <Box key={group.id} onClick={() => setSelectedGroupId(group.id === selectedGroupId ? "" : group.id)}
                                                        sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderBottom: idx < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200", cursor: "pointer", bgcolor: selectedGroupId === group.id ? "error.50" : "transparent", "&:hover": { bgcolor: "error.50" }, transition: "background-color 0.2s" }}>
                                                        <Checkbox checked={selectedGroupId === group.id} onChange={() => setSelectedGroupId(group.id === selectedGroupId ? "" : group.id)} onClick={e => e.stopPropagation()} size="small" />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" fontWeight={600} noWrap>{group.name}</Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>{group.member_count} member(s){group.description ? ` — ${group.description}` : ""}</Typography>
                                                        </Box>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{ p: 3, textAlign: "center" }}>
                                                    <Typography variant="body2" color="text.secondary">{groupSearchTerm ? "No match" : "None assigned"}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Button fullWidth variant="outlined" color="error" onClick={handleUnassignFromGroup} disabled={!selectedGroupId || assigningGroup} sx={{ fontWeight: 700, mt: 2, display: "flex", gap: 1 }}>
                                            {assigningGroup && <CircularProgress size={16} color="inherit" />}
                                            {assigningGroup ? "Removing..." : "Remove from Group"}
                                        </Button>
                                    </TabPanel>
                                </>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
                            <Button onClick={() => setAssignOpen(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
