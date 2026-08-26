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
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Stack,
    Checkbox,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Edit, Delete, Add, Download, CloudUpload, Visibility, DeleteOutlined, CheckCircle, Cancel } from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
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

export default function HandoutManager() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
    const [statusMenuHandout, setStatusMenuHandout] = useState(null);

    const handleStatusClick = (handout, event) => {
        setStatusMenuHandout(handout);
        setStatusMenuAnchor(event.currentTarget);
    };

    const handleStatusChange = async (newStatus) => {
        if (!statusMenuHandout) return;
        try {
            await api.patch(`/learning/handouts/${statusMenuHandout.id}/`, { status: newStatus });
            successToast(`Handout status updated to ${newStatus}`);
            setHandouts((prev) =>
                prev.map((h) => (h.id === statusMenuHandout.id ? { ...h, status: newStatus } : h))
            );
        } catch (error) {
            errorToast(error, "Failed to update handout status");
        } finally {
            setStatusMenuAnchor(null);
            setStatusMenuHandout(null);
        }
    };
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
            errorToast(error, "Failed to load handouts");
            setHandouts([]);
            setPurchases([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprovePurchase = async (purchaseId) => {
        try {
            await api.post(`/learning/handout-purchases/${purchaseId}/approve/`);
            successToast("Handout payment approved & assigned to student!");
            loadData();
        } catch (error) {
            errorToast(error, "Failed to approve payment");
        }
    };

    const handleRejectPurchase = async (purchaseId) => {
        try {
            await api.post(`/learning/handout-purchases/${purchaseId}/reject/`);
            successToast("Handout purchase request rejected.");
            loadData();
        } catch (error) {
            errorToast(error, "Failed to reject purchase");
        }
    };

    const applyHandoutFilters = () => {
        let filtered = [...handouts];

        if (searchTermHandouts) {
            const term = searchTermHandouts.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    (item.title && item.title.toLowerCase().includes(term)) ||
                    (item.description && item.description.toLowerCase().includes(term))
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
            const term = searchTermPurchases.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    (item.student_name && item.student_name.toLowerCase().includes(term)) ||
                    (item.handout_title && item.handout_title.toLowerCase().includes(term)) ||
                    (item.transaction_id && item.transaction_id.toLowerCase().includes(term))
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
            setFormData({
                course: handout.course,
                title: handout.title,
                description: handout.description || "",
                price: handout.price,
                status: handout.status,
                file: null,
            });
        } else {
            setEditingId(null);
            setFormData({
                course: "",
                title: "",
                description: "",
                price: "",
                status: "DRAFT",
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
            const maxSize = 10 * 1024 * 1024; // 10MB limit
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
        if (!formData.course) {
            errorToast(null, "Course is required");
            return;
        }
        if (!formData.title) {
            errorToast(null, "Title is required");
            return;
        }
        if (!formData.price) {
            errorToast(null, "Price is required");
            return;
        }
        if (!formData.file && !editingId) {
            errorToast(null, "File is required for new handouts");
            return;
        }

        try {
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
                successToast("Handout updated successfully");
            } else {
                await api.post("/learning/handouts/", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast("Handout created successfully");
            }
            setOpenDialog(false);
            loadData();
        } catch (error) {
            errorToast(error, "Failed to save handout");
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
                    errorToast(error, "Failed to delete handout");
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
        return (
            <Box sx={{ py: 4, textAlign: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Tabs
                value={tabValue}
                onChange={(e, v) => setTabValue(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 3, borderBottom: "1px solid", borderColor: "grey.200", "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } } }}
            >
                <Tab label="Handouts" />
                <Tab label="Purchases" />
            </Tabs>

            {/* TAB 0: HANDOUTS */}
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
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
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search by title or description..."
                            value={searchTermHandouts}
                            onChange={(e) => setSearchTermHandouts(e.target.value)}
                            size="small"
                        />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap" }}>
                            <FormControl sx={{ minWidth: { xs: "100%", sm: 160 } }} size="small">
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

                            <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }} size="small">
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

                            {selectedHandoutIds.size > 0 && (
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteOutlined />}
                                    onClick={handleBulkDeleteHandouts}
                                    variant="outlined"
                                >
                                    Delete Selected ({selectedHandoutIds.size})
                                </Button>
                            )}
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
                            p: { xs: 3, sm: 5 },
                            textAlign: "center",
                        }}
                    >
                        <Typography color="text.secondary" sx={{ mb: 1 }}>
                            No handouts found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchTermHandouts || filterCourseHandouts || filterStatusHandouts
                                ? "Try adjusting your filters"
                                : "Create study materials for your students. Click 'Create Handout' to get started."}
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{ overflowX: "auto", borderRadius: 2 }}>
                        {isMobile ? (
                            <Stack spacing={2}>
                                {filteredHandouts.map((handout) => (
                                    <Card key={handout.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                        <CardContent>
                                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                                                <Checkbox
                                                    checked={selectedHandoutIds.has(handout.id)}
                                                    onChange={() => handleSelectHandout(handout.id)}
                                                    sx={{ p: 0 }}
                                                />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {handout.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {getCourseName(handout.course)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Stack spacing={1.5} mb={2} pl={4}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Price</Typography>
                                                    <Typography variant="caption" fontWeight={500}>₦{parseFloat(handout.price || 0).toLocaleString()}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Purchases</Typography>
                                                    <Typography variant="caption">{handout.purchase_count || 0}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                                                    <Chip
                                                        label={handout.status}
                                                        color={handout.status === "PUBLISHED" ? "success" : handout.status === "DRAFT" ? "default" : "error"}
                                                        size="small"
                                                        onClick={(e) => handleStatusClick(handout, e)}
                                                        clickable
                                                    />
                                                </Box>
                                            </Stack>
                                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", pt: 1.5, flexWrap: "wrap" }}>
                                                <IconButton size="small" onClick={() => handleViewHandout(handout)} sx={{ color: "primary.main" }}><Visibility fontSize="small" /></IconButton>
                                                <IconButton size="small" onClick={() => handleOpenDialog(handout)} sx={{ color: "warning.main" }}><Edit fontSize="small" /></IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(handout.id)} sx={{ color: "error.main" }}><Delete fontSize="small" /></IconButton>
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
                                                    checked={selectedHandoutIds.size === filteredHandouts.length && filteredHandouts.length > 0}
                                                    indeterminate={selectedHandoutIds.size > 0 && selectedHandoutIds.size < filteredHandouts.length}
                                                    onChange={handleSelectAllHandouts}
                                                />
                                            </TableCell>
                                            <TableCell fontWeight={700}>Title</TableCell>
                                            <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Course</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Purchases</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right" fontWeight={700}>Actions</TableCell>
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
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {handout.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", md: "none" } }}>
                                                        {getCourseName(handout.course)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                                                    {getCourseName(handout.course)}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        ₦{parseFloat(handout.price || 0).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                                                    {handout.purchase_count || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={handout.status}
                                                        color={handout.status === "PUBLISHED" ? "success" : handout.status === "DRAFT" ? "default" : "error"}
                                                        size="small"
                                                        onClick={(e) => handleStatusClick(handout, e)}
                                                        clickable
                                                        sx={{ cursor: "pointer" }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewHandout(handout)}
                                                            title="View details"
                                                            sx={{ color: "primary.main" }}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenDialog(handout)}
                                                            title="Edit"
                                                            sx={{ color: "warning.main" }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(handout.id)}
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
            </TabPanel>

            {/* TAB 1: PURCHASES */}
            <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    Purchase History
                </Typography>

                {/* Search and Filters for Purchases */}
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search by student name, handout title, or transaction ID..."
                            value={searchTermPurchases}
                            onChange={(e) => setSearchTermPurchases(e.target.value)}
                            size="small"
                        />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap" }}>
                            <FormControl sx={{ minWidth: { xs: "100%", sm: 160 } }} size="small">
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
                                    <MenuItem value="REFUNDED">Refunded</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                </Paper>

                {filteredPurchases.length === 0 ? (
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
                            No purchases found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchTermPurchases || filterStatusPurchases
                                ? "Try adjusting your filters"
                                : "Student purchases will appear here once they purchase handouts."}
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{ overflowX: "auto", borderRadius: 2 }}>
                        {isMobile ? (
                            <Stack spacing={2}>
                                {filteredPurchases.map((purchase) => (
                                    <Card key={purchase.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                        <CardContent>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    {purchase.student_name || "N/A"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                                    {purchase.student_username || "—"}
                                                </Typography>
                                            </Box>
                                            <Stack spacing={1.5} mb={2}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Handout</Typography>
                                                    <Typography variant="caption">{purchase.handout_title || "N/A"}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Amount</Typography>
                                                    <Typography variant="caption" fontWeight={500}>₦{parseFloat(purchase.amount_paid || 0).toLocaleString()}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Date</Typography>
                                                    <Typography variant="caption">{purchase.purchased_at ? new Date(purchase.purchased_at).toLocaleDateString() : "—"}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                                                    <Chip
                                                        label={purchase.status}
                                                        color={purchase.status === "COMPLETED" ? "success" : purchase.status === "PENDING" ? "warning" : "error"}
                                                        size="small"
                                                    />
                                                </Box>
                                            </Stack>
                                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", pt: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                                                {purchase.status === "PENDING" && (
                                                    <>
                                                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleApprovePurchase(purchase.id)}>Approve</Button>
                                                        <Button size="small" variant="outlined" color="error" startIcon={<Cancel />} onClick={() => handleRejectPurchase(purchase.id)}>Reject</Button>
                                                    </>
                                                )}
                                                <IconButton size="small" onClick={() => handleViewPurchase(purchase)} sx={{ color: "primary.main" }}><Visibility fontSize="small" /></IconButton>
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
                                            <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                                            <TableCell sx={{ fontWeight: 700, display: { xs: "none", md: "table-cell" } }}>Username</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Handout</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Date</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredPurchases.map((purchase) => (
                                            <TableRow key={purchase.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {purchase.student_name || "N/A"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                                                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                                                        {purchase.student_username || "—"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{purchase.handout_title || "N/A"}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        ₦{parseFloat(purchase.amount_paid || 0).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={purchase.status}
                                                        color={purchase.status === "COMPLETED" ? "success" : purchase.status === "PENDING" ? "warning" : "error"}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                                {purchase.purchased_at ? new Date(purchase.purchased_at).toLocaleDateString() : "—"}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
                                                        {purchase.status === "PENDING" && (
                                                            <>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="success"
                                                                    startIcon={<CheckCircle />}
                                                                    onClick={() => handleApprovePurchase(purchase.id)}
                                                                    sx={{ fontSize: "0.75rem", py: 0.2 }}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    startIcon={<Cancel />}
                                                                    onClick={() => handleRejectPurchase(purchase.id)}
                                                                    sx={{ fontSize: "0.75rem", py: 0.2 }}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewPurchase(purchase)}
                                                            title="View details"
                                                            sx={{ color: "primary.main" }}
                                                        >
                                                            <Visibility fontSize="small" />
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
            </TabPanel>

            {/* Create/Edit Handout Dialog */}
            <Dialog open={openDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenDialog(false); }} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingId ? "Edit Handout" : "Create Handout"}
                </DialogTitle>
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
                                <MenuItem value="">Select Course</MenuItem>
                                {courses.map((course) => (
                                    <MenuItem key={course.id} value={course.id}>
                                        {course.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            size="small"
                            required
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            multiline
                            rows={2}
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="Price (₦)"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            size="small"
                            required
                        />

                        <FormControl size="small" fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                label="Status"
                            >
                                <MenuItem value="DRAFT">Draft</MenuItem>
                                <MenuItem value="PUBLISHED">Published</MenuItem>
                                <MenuItem value="ARCHIVED">Archived</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            fullWidth
                        >
                            {formData.file ? formData.file.name : "Upload Handout File (PDF, Image, Doc, Zip)"}
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", display: "block" }}>
                            Max file size: 10MB
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={viewOpen} onClose={(e, reason) => { if (reason === 'backdropClick') return; setViewOpen(false); }} maxWidth="sm" fullWidth>
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
                                        <Typography variant="body2" fontWeight={600}>
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
                                        <Typography variant="body2" fontWeight={600}>
                                            ₦{parseFloat(viewingItem.data.price || 0).toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={viewingItem.data.status}
                                                color={viewingItem.data.status === "PUBLISHED" ? "success" : viewingItem.data.status === "DRAFT" ? "default" : "error"}
                                                size="small"
                                            />
                                        </Box>
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
                                                    component="button"
                                                    onClick={() => downloadFileWithRealName(viewingItem.data.file, `${viewingItem.data.title || "handout"}.${viewingItem.data.file.split(".").pop() || "pdf"}`)}
                                                    sx={{ color: "primary.main", textDecoration: "underline", flex: 1, wordBreak: "break-all", background: "none", border: "none", p: 0, textAlign: "left", cursor: "pointer", fontSize: "0.875rem" }}
                                                >
                                                    {viewingItem.data.title || "Handout Document"}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => downloadFileWithRealName(viewingItem.data.file, `${viewingItem.data.title || "handout"}.${viewingItem.data.file.split(".").pop() || "pdf"}`)}
                                                >
                                                    <Download fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    )}

                                    {viewingItem.data.created_at && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Created Date
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(viewingItem.data.created_at).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Student
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {viewingItem.data.student_name || "—"}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Username
                                        </Typography>
                                        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                                            {viewingItem.data.student_username || "—"}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Handout
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {viewingItem.data.handout_title || "—"}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Amount Paid
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            ₦{parseFloat(viewingItem.data.amount_paid || 0).toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={viewingItem.data.status}
                                                color={viewingItem.data.status === "COMPLETED" ? "success" : viewingItem.data.status === "PENDING" ? "warning" : "error"}
                                                size="small"
                                            />
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Transaction ID
                                        </Typography>
                                        <Typography variant="body2" sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                                            {viewingItem.data.transaction_id || "—"}
                                        </Typography>
                                    </Box>

                                    {viewingItem.data.purchased_at && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Purchase Date
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(viewingItem.data.purchased_at).toLocaleString()}
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
                <MenuItem onClick={() => handleStatusChange("DRAFT")} sx={{ py: 1, px: 2 }}>
                    <Chip size="small" label="DRAFT" />
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange("PUBLISHED")} sx={{ py: 1, px: 2 }}>
                    <Chip size="small" label="PUBLISHED" color="success" />
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange("ARCHIVED")} sx={{ py: 1, px: 2 }}>
                    <Chip size="small" label="ARCHIVED" color="error" />
                </MenuItem>
            </Menu>
        </Box>
    );
}
