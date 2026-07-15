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
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Stack,
} from "@mui/material";
import { Edit, Delete, Add, Download, CloudUpload, Visibility, DeleteOutlined } from "@mui/icons-material";
import { Checkbox } from "@mui/material";
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

export default function HandoutManager() {
    const [handouts, setHandouts] = useState([]);
    const [filteredHandouts, setFilteredHandouts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [searchTermHandouts, setSearchTermHandouts] = useState("");
    const [filterCourseHandouts, setFilterCourseHandouts] = useState("");
    const [filterStatusHandouts, setFilterStatusHandouts] = useState("");
    const [searchTermPurchases, setSearchTermPurchases] = useState("");
    const [filterStatusPurchases, setFilterStatusPurchases] = useState("");
    const [selectedHandoutIds, setSelectedHandoutIds] = useState(new Set());
    const [selectedPurchaseIds, setSelectedPurchaseIds] = useState(new Set());
    const [formData, setFormData] = useState({
        course: "",
        title: "",
        description: "",
        price: "",
        status: "DRAFT",
        file: null,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyHandoutFilters();
    }, [handouts, searchTermHandouts, filterCourseHandouts, filterStatusHandouts]);

    useEffect(() => {
        applyPurchaseFilters();
    }, [purchases, searchTermPurchases, filterStatusPurchases]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [handoutsRes, purchasesRes, coursesData] = await Promise.all([
                api.get("/learning/handouts/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/handout-purchases/").catch(() => ({ data: { results: [] } })),
                getCourses().catch(() => []),
            ]);
            setHandouts(handoutsRes.data.results || handoutsRes.data || []);
            setPurchases(purchasesRes.data.results || purchasesRes.data || []);
            setCourses(coursesData);
        } catch (error) {
            console.error("Error loading data:", error);
            setHandouts([]);
            setPurchases([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const applyHandoutFilters = () => {
        let filtered = [...handouts];

        if (searchTermHandouts) {
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(searchTermHandouts.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchTermHandouts.toLowerCase())
            );
        }

        if (filterCourseHandouts) {
            filtered = filtered.filter((item) => item.course === parseInt(filterCourseHandouts));
        }

        if (filterStatusHandouts) {
            filtered = filtered.filter((item) => item.status === filterStatusHandouts);
        }

        setFilteredHandouts(filtered);
    };

    const applyPurchaseFilters = () => {
        let filtered = [...purchases];

        if (searchTermPurchases) {
            filtered = filtered.filter(
                (item) =>
                    item.student_name.toLowerCase().includes(searchTermPurchases.toLowerCase()) ||
                    item.handout_title.toLowerCase().includes(searchTermPurchases.toLowerCase())
            );
        }

        if (filterStatusPurchases) {
            filtered = filtered.filter((item) => item.status === filterStatusPurchases);
        }

        setFilteredPurchases(filtered);
    };

    const handleOpenDialog = (handout = null) => {
        if (handout) {
            setEditingId(handout.id);
            setFormData(handout);
        } else {
            setEditingId(null);
            setFormData({
                course: "",
                title: "",
                description: "",
                price: "",
                status: "DRAFT",
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
            if (!formData.file && !editingId) {
                errorToast(null, "File is required for new handouts");
                return;
            }

            const data = new FormData();
            data.append("course", formData.course);
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("price", formData.price);
            data.append("status", formData.status);
            if (formData.file) {
                data.append("file", formData.file);
            }

            if (editingId) {
                await api.patch(`/learning/handouts/${editingId}/`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Handout updated");
            } else {
                await api.post("/learning/handouts/", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Handout created");
            }
            setOpenDialog(false);
            loadData();
        } catch (error) {
            errorToast(error, "Failed to save");
        }
    };

    const handleDelete = async (id) => {
        confirmAction(
            "Delete this handout?",
            async () => {
                try {
                    await api.delete(`/learning/handouts/${id}/`);
                    successToast("Handout deleted");
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

    const handleBulkDeleteHandouts = async () => {
        if (selectedHandoutIds.size === 0) {
            errorToast(null, "No items selected");
            return;
        }

        confirmAction(
            `Delete ${selectedHandoutIds.size} selected handout(s)?`,
            async () => {
                try {
                    await Promise.all(
                        Array.from(selectedHandoutIds).map((id) =>
                            api.delete(`/learning/handouts/${id}/`)
                        )
                    );
                    successToast(`${selectedHandoutIds.size} handouts deleted`);
                    setSelectedHandoutIds(new Set());
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

    const handleSelectAllHandouts = (e) => {
        if (e.target.checked) {
            setSelectedHandoutIds(new Set(filteredHandouts.map((item) => item.id)));
        } else {
            setSelectedHandoutIds(new Set());
        }
    };

    const handleSelectHandout = (id) => {
        const newSelected = new Set(selectedHandoutIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedHandoutIds(newSelected);
    };

    const handleViewHandout = (handout) => {
        setViewingItem({ type: "handout", data: handout });
        setViewOpen(true);
    };

    const handleViewPurchase = (purchase) => {
        setViewingItem({ type: "purchase", data: purchase });
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
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Handouts" />
                <Tab label="Purchases" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="h6" fontWeight={700}>
                        Study Materials
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Create Handout
                    </Button>
                </Box>

                {/* Search and Filters for Handouts */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search by title or description..."
                            value={searchTermHandouts}
                            onChange={(e) => setSearchTermHandouts(e.target.value)}
                            size="small"
                        />

                        {selectedHandoutIds.size > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="body2">
                                    {selectedHandoutIds.size} selected
                                </Typography>
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteOutlined />}
                                    onClick={handleBulkDeleteHandouts}
                                >
                                    Delete Selected
                                </Button>
                            </Box>
                        )}

                        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                            <FormControl sx={{ minWidth: 150 }} size="small">
                                <InputLabel>Course</InputLabel>
                                <Select
                                    value={filterCourseHandouts}
                                    onChange={(e) => setFilterCourseHandouts(e.target.value)}
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
                                    value={filterStatusHandouts}
                                    onChange={(e) => setFilterStatusHandouts(e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    <MenuItem value="DRAFT">Draft</MenuItem>
                                    <MenuItem value="PUBLISHED">Published</MenuItem>
                                    <MenuItem value="ARCHIVED">Archived</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                </Paper>

                {filteredHandouts.length === 0 ? (
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
                            No handouts yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create study materials for your students. Click "Create Handout" to get started.
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "grey.200" }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "grey.50" }}>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedHandoutIds.size === filteredHandouts.length && filteredHandouts.length > 0}
                                            indeterminate={selectedHandoutIds.size > 0 && selectedHandoutIds.size < filteredHandouts.length}
                                            onChange={handleSelectAllHandouts}
                                        />
                                    </TableCell>
                                    <TableCell fontWeight={700}>Title</TableCell>
                                    <TableCell>Course</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Purchases</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredHandouts.map((handout) => (
                                    <TableRow key={handout.id} hover>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedHandoutIds.has(handout.id)}
                                                onChange={() => handleSelectHandout(handout.id)}
                                            />
                                        </TableCell>
                                        <TableCell>{handout.title}</TableCell>
                                        <TableCell>{getCourseName(handout.course)}</TableCell>
                                        <TableCell>₦{parseFloat(handout.price).toLocaleString()}</TableCell>
                                        <TableCell>{handout.purchase_count}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={handout.status}
                                                color={handout.status === "PUBLISHED" ? "success" : "default"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewHandout(handout)}
                                                title="View details"
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(handout)}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(handout.id)}
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
                    Purchase History
                </Typography>

                {/* Search and Filters for Purchases */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search by student name or handout title..."
                            value={searchTermPurchases}
                            onChange={(e) => setSearchTermPurchases(e.target.value)}
                            size="small"
                        />

                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatusPurchases}
                                onChange={(e) => setFilterStatusPurchases(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                                <MenuItem value="FAILED">Failed</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Paper>

                {filteredPurchases.length === 0 ? (
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
                            No purchases yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Student purchases will appear here once they buy handouts.
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "grey.200" }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "grey.50" }}>
                                <TableRow>
                                    <TableCell fontWeight={700}>Student</TableCell>
                                    <TableCell>Handout</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPurchases.map((purchase) => (
                                    <TableRow key={purchase.id} hover>
                                        <TableCell>{purchase.student_name}</TableCell>
                                        <TableCell>{purchase.handout_title}</TableCell>
                                        <TableCell>₦{parseFloat(purchase.amount_paid).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={purchase.status}
                                                color={purchase.status === "COMPLETED" ? "success" : "warning"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(purchase.purchased_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewPurchase(purchase)}
                                                title="View details"
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                            {purchase.status === "COMPLETED" && (
                                                <Button
                                                    size="small"
                                                    startIcon={<Download />}
                                                >
                                                    Download
                                                </Button>
                                            )}
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
                    {editingId ? "Edit Handout" : "Create Handout"}
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
                        label="Price (₦)"
                        name="price"
                        type="number"
                        value={formData.price}
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
                        <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </Select>

                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                        fullWidth
                    >
                        {formData.file ? formData.file.name : "Upload Handout File"}
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
                <DialogTitle>
                    {viewingItem?.type === "handout" ? "Handout Details" : "Purchase Details"}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingItem && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {viewingItem.type === "handout" ? (
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
                                            Price
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            ₦{parseFloat(viewingItem.data.price).toLocaleString()}
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

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Total Purchases
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.purchase_count || 0}
                                        </Typography>
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
                                            Handout
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.handout_title}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Amount Paid
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            ₦{parseFloat(viewingItem.data.amount_paid).toLocaleString()}
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

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Transaction ID
                                        </Typography>
                                        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                            {viewingItem.data.transaction_id}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Purchased Date
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(viewingItem.data.purchased_at).toLocaleString()}
                                        </Typography>
                                    </Box>

                                    {viewingItem.data.expires_at && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Expires
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(viewingItem.data.expires_at).toLocaleString()}
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
        </Box>
    );
}
