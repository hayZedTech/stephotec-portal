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
    IconButton,
    FormControl,
    InputLabel,
    Select,
    Stack,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Add, CloudUpload, Edit, Delete, Download, Visibility } from "@mui/icons-material";
import { getCourses } from "@/services/courses";
import api from "@/lib/axios";
import { errorToast, successToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

export default function BrochureManager() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [courses, setCourses] = useState([]);
    const [brochures, setBrochures] = useState([]);
    const [filteredBrochures, setFilteredBrochures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingBrochure, setViewingBrochure] = useState(null);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");

    // Form
    const [formData, setFormData] = useState({
        course: "",
        title: "",
        description: "",
        file: null,
        existingFile: null,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [brochures, searchTerm, filterCourse]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [coursesRes, brochuresRes] = await Promise.all([
                getCourses().catch(() => []),
                api.get("/learning/brochures/").catch(() => ({ data: { results: [] } })),
            ]);

            setCourses(Array.isArray(coursesRes) ? coursesRes : coursesRes.results || []);
            const brochureList = brochuresRes.data.results || brochuresRes.data || [];
            setBrochures(Array.isArray(brochureList) ? brochureList : []);
        } catch (err) {
            errorToast(err, "Failed to load brochures data");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...brochures];

        if (filterCourse) {
            filtered = filtered.filter(
                (item) => String(item.course) === String(filterCourse)
            );
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    (item.title && item.title.toLowerCase().includes(term)) ||
                    (item.description && item.description.toLowerCase().includes(term)) ||
                    (item.course_name && item.course_name.toLowerCase().includes(term))
            );
        }

        setFilteredBrochures(filtered);
    };

    const handleOpenDialog = (brochure = null) => {
        if (brochure) {
            setEditingId(brochure.id);
            setFormData({
                course: brochure.course,
                title: brochure.title,
                description: brochure.description || "",
                file: null,
                existingFile: brochure.file,
            });
        } else {
            setEditingId(null);
            setFormData({
                course: courses.length > 0 ? courses[0].id : "",
                title: "",
                description: "",
                file: null,
                existingFile: null,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        if (submitting) return;
        setDialogOpen(false);
        setEditingId(null);
        setFormData({
            course: "",
            title: "",
            description: "",
            file: null,
            existingFile: null,
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.course || !formData.title.trim()) {
            errorToast(null, "Please fill in all required fields.");
            return;
        }

        if (!editingId && !formData.file) {
            errorToast(null, "Please upload a brochure / course outline file.");
            return;
        }

        try {
            setSubmitting(true);
            const data = new FormData();
            data.append("course", formData.course);
            data.append("title", formData.title.trim());
            data.append("description", formData.description.trim());

            if (formData.file) {
                data.append("file", formData.file);
            }

            if (editingId) {
                await api.patch(`/learning/brochures/${editingId}/`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Brochure updated successfully!");
            } else {
                await api.post("/learning/brochures/", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Brochure created successfully!");
            }

            handleCloseDialog();
            loadData();
        } catch (err) {
            errorToast(err, "Failed to save brochure");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmAction("Are you sure you want to delete this brochure?");
        if (!confirmed) return;

        try {
            await api.delete(`/learning/brochures/${id}/`);
            successToast("Brochure deleted successfully!");
            loadData();
        } catch (err) {
            errorToast(err, "Failed to delete brochure");
        }
    };

    const handleViewBrochure = (brochure) => {
        setViewingBrochure(brochure);
        setViewOpen(true);
    };

    const getCourseName = (courseId) => {
        const found = courses.find((c) => String(c.id) === String(courseId));
        return found ? found.name : "N/A";
    };

    return (
        <Box className="space-y-6">
            {/* Header & Controls */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: 2,
                }}
            >
                <Typography variant="h6" fontWeight={700}>
                    Course Brochures & Outlines
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2 }}
                >
                    Add Brochure
                </Button>
            </Box>

            {/* Filter Bar */}
            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search brochures by title, description or course..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Course</InputLabel>
                        <Select
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            label="Filter by Course"
                        >
                            <MenuItem value="">All Courses</MenuItem>
                            {courses.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Table / List */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : filteredBrochures.length === 0 ? (
                <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{ p: 5, textAlign: "center", borderRadius: 2 }}
                >
                    <Typography color="text.secondary">
                        No brochures found. Upload course outlines to make them available to students.
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ overflowX: "auto", borderRadius: 2 }}>
                    {isMobile ? (
                        <Stack spacing={2}>
                            {filteredBrochures.map((item) => (
                                <Card key={item.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                    <CardContent>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.course_name || getCourseName(item.course)}
                                            </Typography>
                                        </Box>
                                        <Stack spacing={1.5} mb={2}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Date Created</Typography>
                                                <Typography variant="caption">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Description</Typography>
                                                <Typography variant="caption">{item.description || "—"}</Typography>
                                            </Box>
                                        </Stack>
                                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", pt: 1.5, flexWrap: "wrap" }}>
                                            <IconButton size="small" onClick={() => handleViewBrochure(item)} sx={{ color: "primary.main" }}><Visibility fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleOpenDialog(item)} sx={{ color: "warning.main" }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: "error.main" }}><Delete fontSize="small" /></IconButton>
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
                                        <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Description</TableCell>
                                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Date Created</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredBrochures.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.title}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {item.course_name || getCourseName(item.course)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                                                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                                                    {item.description || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewBrochure(item)}
                                                        title="View details"
                                                        sx={{ color: "primary.main" }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(item)}
                                                        title="Edit"
                                                        sx={{ color: "warning.main" }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(item.id)}
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
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? "Edit Brochure" : "Upload Course Brochure / Outline"}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ pt: 2 }}>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <FormControl size="small" required fullWidth>
                                <InputLabel>Course</InputLabel>
                                <Select
                                    name="course"
                                    value={formData.course}
                                    onChange={handleChange}
                                    label="Course"
                                >
                                    {courses.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Brochure Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                fullWidth
                                size="small"
                                placeholder="e.g. Web Development Full Course Syllabus & Brochure"
                            />

                            <TextField
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                fullWidth
                                size="small"
                                placeholder="Brief summary or description of this brochure..."
                            />

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                    Upload Brochure / Outline File (PDF, DOCX, ZIP, etc.) — Max 10MB
                                </Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUpload />}
                                    fullWidth
                                    sx={{ borderStyle: "dashed" }}
                                >
                                    {formData.file ? formData.file.name : "Select File"}
                                    <input type="file" hidden onChange={handleFileChange} />
                                </Button>
                                {formData.existingFile && !formData.file && (
                                    <Typography variant="caption" color="primary" sx={{ display: "block", mt: 0.5 }}>
                                        Current file attached. Select a new file above to replace it.
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseDialog} disabled={submitting} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                            {submitting ? "Saving..." : editingId ? "Update Brochure" : "Upload Brochure"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Brochure Details</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingBrochure && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Title
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {viewingBrochure.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Course
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {viewingBrochure.course_name || getCourseName(viewingBrochure.course)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body2">
                                    {viewingBrochure.description || "No description provided."}
                                </Typography>
                            </Box>

                            {viewingBrochure.file && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        File Attachment
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Download />}
                                            href={viewingBrochure.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                        >
                                            Download Brochure
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Upload Date
                                </Typography>
                                <Typography variant="body2">
                                    {viewingBrochure.created_at ? new Date(viewingBrochure.created_at).toLocaleString() : "—"}
                                </Typography>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
