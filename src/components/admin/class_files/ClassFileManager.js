"use client";

import { useState, useEffect, useRef } from "react";
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
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
    InputAdornment,
    ListItemText,
    ListSubheader,
} from "@mui/material";
import {
    Delete,
    Add,
    Download,
    CloudUpload,
    Search,
    Folder,
    FolderZip,
    Group,
    Person,
    InsertDriveFile,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { getStudents } from "@/services/students";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import { downloadFileWithRealName } from "@/utils/fileDownloader";

export default function ClassFileManager() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Search & Filter
    const [search, setSearch] = useState("");
    const [recipientFilter, setRecipientFilter] = useState("ALL");

    // Modal State
    const [openDialog, setOpenDialog] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [viewingMaterial, setViewingMaterial] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assigned_group_ids: [],
        assigned_student_ids: [],
    });

    const [groupSelectOpen, setGroupSelectOpen] = useState(false);
    const [studentSelectOpen, setStudentSelectOpen] = useState(false);
    const [groupSearch, setGroupSearch] = useState("");
    const [studentSearch, setStudentSearch] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterClassMaterials();
    }, [materials, search, recipientFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const materialsRes = await api.get("/learning/class-materials/", {
                params: { _t: Date.now() }
            });
            const mats = Array.isArray(materialsRes.data)
                ? materialsRes.data
                : materialsRes.data?.results || [];
            setMaterials(mats);
        } catch (error) {
            errorToast(error, "Failed to load class materials");
        } finally {
            setLoading(false);
        }

        // Load auxiliary data (groups/students) in background for dialogs
        Promise.allSettled([
            api.get("/admin/groups/"),
            getStudents(),
        ]).then(([groupsRes, studentsData]) => {
            if (groupsRes.status === "fulfilled") {
                const grps = Array.isArray(groupsRes.value.data)
                    ? groupsRes.value.data
                    : groupsRes.value.data?.results || [];
                setGroups(grps);
            }
            if (studentsData.status === "fulfilled") {
                const stds = Array.isArray(studentsData.value) ? studentsData.value : [];
                setStudents(stds);
            }
        });
    };

    const filterClassMaterials = () => {
        let filtered = [...materials];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
                (m) =>
                    m.title?.toLowerCase().includes(q) ||
                    m.description?.toLowerCase().includes(q) ||
                    m.file_name?.toLowerCase().includes(q)
            );
        }

        if (recipientFilter === "GROUPS") {
            filtered = filtered.filter((m) => m.assigned_groups_details && m.assigned_groups_details.length > 0);
        } else if (recipientFilter === "STUDENTS") {
            filtered = filtered.filter((m) => m.assigned_students_details && m.assigned_students_details.length > 0);
        }

        setFilteredMaterials(filtered);
    };

    const handleOpenDialog = () => {
        setEditingMaterial(null);
        setSelectedFiles([]);
        setFormData({
            title: "",
            description: "",
            existing_files: [],
            assigned_group_ids: [],
            assigned_student_ids: [],
        });
        setOpenDialog(true);
    };

    const handleEdit = (material) => {
        setEditingMaterial(material);
        setSelectedFiles([]);
        
        // Handle files (fallback for legacy single file)
        let existingFiles = [];
        if (material.files && material.files.length > 0) {
            existingFiles = material.files;
        } else if (material.file) {
            existingFiles = [{ url: material.file, name: material.file_name, size: material.file_size }];
        }

        setFormData({
            title: material.title,
            description: material.description || "",
            existing_files: existingFiles,
            assigned_group_ids: material.assigned_group_ids || [],
            assigned_student_ids: material.assigned_student_ids || [],
        });
        setOpenDialog(true);
    };

    const handleView = (material) => {
        setViewingMaterial(material);
        setViewDialogOpen(true);
    };

    const handleRemoveExistingFile = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            existing_files: prev.existing_files.filter((_, idx) => idx !== indexToRemove),
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(files);
            if (!formData.title) {
                if (files.length === 1) {
                    const baseName = files[0].name.substring(0, files[0].name.lastIndexOf('.')) || files[0].name;
                    setFormData((prev) => ({ ...prev, title: baseName }));
                } else {
                    setFormData((prev) => ({ ...prev, title: `Class Code Files (${files.length} files)` }));
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // If uploading a new material (not editing), files are required
        if (!editingMaterial && selectedFiles.length === 0) {
            errorToast("Please select at least one class file or folder archive to upload.");
            return;
        }

        if (formData.assigned_group_ids.length === 0 && formData.assigned_student_ids.length === 0) {
            errorToast("Please select at least one Student Group or Individual Student to receive the material.");
            return;
        }

        setSubmitting(true);
        try {
            const uploadPayload = new FormData();
            uploadPayload.append("title", formData.title.trim());
            uploadPayload.append("description", formData.description.trim());

            // Append all new files
            selectedFiles.forEach((file) => {
                uploadPayload.append("files", file);
            });
            
            // Append existing files if editing
            if (editingMaterial && formData.existing_files) {
                uploadPayload.append("existing_files", JSON.stringify(formData.existing_files));
            }

            formData.assigned_group_ids.forEach((id) => {
                uploadPayload.append("assigned_group_ids", id);
            });

            formData.assigned_student_ids.forEach((id) => {
                uploadPayload.append("assigned_student_ids", id);
            });

            if (editingMaterial) {
                await api.patch(`/learning/class-materials/${editingMaterial.id}/`, uploadPayload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast(`Class material bundle updated successfully!`);
            } else {
                await api.post("/learning/class-materials/", uploadPayload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successToast(`Class material bundle created successfully!`);
            }
            
            setOpenDialog(false);
            setEditingMaterial(null);
            loadData();
        } catch (error) {
            errorToast(error, editingMaterial ? "Failed to update class materials" : "Failed to upload class materials");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        confirmAction(
            "Are you sure you want to delete this class material? Students will no longer see or download it from their student portal.",
            async () => {
                try {
                    await api.delete(`/learning/class-materials/${id}/`);
                    successToast("Class material deleted successfully.");
                    setMaterials((prev) => prev.filter((m) => m.id !== id));
                } catch (error) {
                    errorToast(error, "Failed to delete class material");
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
            setSelectedIds(new Set(filteredMaterials.map((item) => item.id)));
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

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) {
            errorToast(null, "No items selected");
            return;
        }

        confirmAction(
            `Are you sure you want to delete ${selectedIds.size} selected class material(s)? Students will no longer see or download them from their student portal.`,
            async () => {
                const idsToDelete = Array.from(selectedIds);
                try {
                    try {
                        await api.post("/learning/class-materials/bulk-delete/", {
                            ids: idsToDelete,
                        });
                    } catch {
                        // Fallback to sequential deletion if endpoint not matched
                        await Promise.all(
                            idsToDelete.map((id) =>
                                api.delete(`/learning/class-materials/${id}/`)
                            )
                        );
                    }
                    successToast(`${idsToDelete.length} class material(s) deleted successfully.`);
                    setSelectedIds(new Set());
                    setMaterials((prev) => prev.filter((m) => !selectedIds.has(m.id)));
                } catch (error) {
                    errorToast(error, "Failed to delete selected class materials");
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    };

    return (
        <Box className="space-y-6">
            {/* SEARCH & CONTROLS HEADER */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0" }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", sm: "center" },
                    }}
                >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flex: 1 }}>
                        <TextField
                            placeholder="Search class files or code drops..."
                            size="small"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ minWidth: { xs: "100%", sm: 280 } }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Recipient Filter</InputLabel>
                            <Select
                                value={recipientFilter}
                                label="Recipient Filter"
                                onChange={(e) => setRecipientFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Materials</MenuItem>
                                <MenuItem value="GROUPS">Sent to Groups</MenuItem>
                                <MenuItem value="STUDENTS">Sent to Individual Students</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        onClick={handleOpenDialog}
                        sx={{
                            bgcolor: "#0f172a",
                            "&:hover": { bgcolor: "#1e293b" },
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                        }}
                    >
                        Upload & Send Class File
                    </Button>
                </Stack>
            </Paper>

            {/* SELECTION / BULK ACTION TOOLBAR */}
            {selectedIds.size > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5,
                        px: 2.5,
                        borderRadius: 2,
                        bgcolor: "#fef2f2",
                        border: "1px solid #fecaca",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#991b1b" }}>
                        {selectedIds.size} class file(s) selected
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSelectedIds(new Set())}
                            sx={{
                                color: "#991b1b",
                                borderColor: "#fca5a5",
                                "&:hover": { borderColor: "#ef4444", bgcolor: "#fee2e2" },
                                textTransform: "none",
                                fontWeight: 600,
                            }}
                        >
                            Clear Selection
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            color="error"
                            startIcon={<Delete fontSize="small" />}
                            onClick={handleBulkDelete}
                            sx={{
                                fontWeight: 700,
                                textTransform: "none",
                                borderRadius: 1.5,
                            }}
                        >
                            Delete Selected ({selectedIds.size})
                        </Button>
                    </Stack>
                </Paper>
            )}

            {/* MATERIALS LIST / GRID */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {loading ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <CircularProgress sx={{ color: "#d97706" }} />
                    </Box>
                ) : filteredMaterials.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: "center" }}>
                        <FolderZip sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography variant="h6" fontWeight={700} color="slate.900">
                            No Class Files Uploaded Yet
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Send daily class code, zip folders, or study files directly to your student groups or students.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleOpenDialog}
                            sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                        >
                            Upload First Class File
                        </Button>
                    </Box>
                ) : isMobile ? (
                    <Stack spacing={2} sx={{ p: 2 }}>
                        {filteredMaterials.map((m) => (
                            <Card
                                key={m.id}
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid #e2e8f0",
                                    bgcolor: selectedIds.has(m.id) ? "#fffbeb" : "background.paper",
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedIds.has(m.id)}
                                                    onChange={() => handleSelectItem(m.id)}
                                                    color="primary"
                                                    sx={{ p: 0.5 }}
                                                />
                                                <Folder sx={{ color: "#d97706" }} />
                                                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>
                                                    {m.title}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {m.description && (
                                            <Typography variant="body2" color="text.secondary">
                                                {m.description}
                                            </Typography>
                                        )}

                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, my: 1 }}>
                                            {m.assigned_groups_details?.map((g) => (
                                                <Chip
                                                    key={`g-${g.id}`}
                                                    icon={<Group sx={{ fontSize: "14px !important" }} />}
                                                    label={g.name}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            ))}
                                            {m.assigned_students_details?.map((s) => (
                                                <Chip
                                                    key={`s-${s.id}`}
                                                    icon={<Person sx={{ fontSize: "14px !important" }} />}
                                                    label={s.full_name || s.username}
                                                    size="small"
                                                    color="secondary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            ))}
                                        </Box>

                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px solid #f1f5f9" }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(m.created_at).toLocaleDateString()} {m.file_size ? `• ${m.file_size}` : ""}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: "primary.main" }}
                                                    onClick={() => downloadFileWithRealName(m.file, m.file_name || `${m.title || "class_material"}.zip`)}
                                                >
                                                    <Download fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDelete(m.id)}
                                                    size="small"
                                                    sx={{ color: "error.main" }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ bgcolor: "#f8fafc" }}>
                                        <Checkbox
                                            indeterminate={
                                                selectedIds.size > 0 &&
                                                selectedIds.size < filteredMaterials.length
                                            }
                                            checked={
                                                filteredMaterials.length > 0 &&
                                                selectedIds.size === filteredMaterials.length
                                            }
                                            onChange={handleSelectAll}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Class Material Title</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>File Details</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Assigned Recipients</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Sent Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMaterials.map((m) => (
                                    <TableRow
                                        key={m.id}
                                        hover
                                        selected={selectedIds.has(m.id)}
                                        sx={{
                                            bgcolor: selectedIds.has(m.id) ? "rgba(245, 158, 11, 0.08) !important" : "inherit",
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.has(m.id)}
                                                onChange={() => handleSelectItem(m.id)}
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Folder sx={{ color: "#d97706" }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700} color="slate.900">
                                                        {m.title}
                                                    </Typography>
                                                    {m.description && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 300 }} noWrap>
                                                            {m.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                                <InsertDriveFile fontSize="small" sx={{ color: "grey.500" }} />
                                                <Typography variant="caption" fontWeight={600}>
                                                    {m.files && m.files.length > 0 
                                                        ? `${m.files.length} File(s)` 
                                                        : (m.file_name || "Class Code / Folder")}
                                                </Typography>
                                            </Stack>
                                            {m.files && m.files.length > 0 ? null : m.file_size && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                    {m.file_size}
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 320 }}>
                                                {m.assigned_groups_details?.map((g) => (
                                                    <Chip
                                                        key={`g-${g.id}`}
                                                        icon={<Group sx={{ fontSize: "14px !important" }} />}
                                                        label={g.name}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                ))}
                                                {m.assigned_students_details?.map((s) => (
                                                    <Chip
                                                        key={`s-${s.id}`}
                                                        icon={<Person sx={{ fontSize: "14px !important" }} />}
                                                        label={s.full_name || s.username}
                                                        size="small"
                                                        color="secondary"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>

                                        <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                            {new Date(m.created_at).toLocaleDateString()}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleView(m)}
                                                    sx={{ fontWeight: 700, textTransform: "none" }}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleEdit(m)}
                                                    sx={{ fontWeight: 700, textTransform: "none" }}
                                                >
                                                    Edit
                                                </Button>
                                                <IconButton
                                                    onClick={() => handleDelete(m.id)}
                                                    size="small"
                                                    sx={{ color: "error.main" }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* UPLOAD CLASS FILE DIALOG */}
            <Dialog
                open={openDialog}
                onClose={(e, reason) => {
                    if (reason === "backdropClick") return;
                    setOpenDialog(false);
                }}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 4 } } }}
            >
                <form onSubmit={handleSubmit} noValidate>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "white" }}>
                        Upload & Send Class Files / Code Drop
                    </DialogTitle>

                    <DialogContent sx={{ pt: 3 }}>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Material / Class Topic Title"
                                required
                                fullWidth
                                placeholder="e.g. HTML & CSS Day 3 Class Code & Exercises"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />

                            <TextField
                                label="Description / Note for Students"
                                multiline
                                rows={2}
                                fullWidth
                                placeholder="Add optional instructions or notes for the class session..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />

                            {/* FILE UPLOAD BUTTON */}
                            <Box sx={{ border: "2px dashed #cbd5e1", borderRadius: 3, p: 3, textAlign: "center", bgcolor: "#f8fafc" }}>
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                                <CloudUpload sx={{ fontSize: 40, color: "#d97706", mb: 1 }} />
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {selectedFiles.length > 0
                                        ? selectedFiles.length === 1
                                            ? selectedFiles[0].name
                                            : `Selected ${selectedFiles.length} New Files`
                                        : "Select Class Code, Zip Folders, or Files (Multiple Supported)"}
                                </Typography>
                                
                                {/* Existing Files */}
                                {formData.existing_files && formData.existing_files.length > 0 && (
                                    <Box sx={{ mt: 2, mb: 1, maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary">Existing Files (Saved):</Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center" }}>
                                            {formData.existing_files.map((f, i) => (
                                                <Chip 
                                                    key={i} 
                                                    label={`${f.name} ${f.size ? `(${f.size})` : ""}`} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="success" 
                                                    onDelete={() => handleRemoveExistingFile(i)}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {/* New Files */}
                                {selectedFiles.length > 0 && (
                                    <Box sx={{ mt: 2, mb: 1, maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary">New Files to Upload:</Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center" }}>
                                            {selectedFiles.map((f, i) => (
                                                <Chip key={i} label={f.name} size="small" variant="outlined" color="warning" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, mb: 2 }}>
                                    Hold Ctrl / Shift to select multiple files at once. Supports .zip, .rar, .7z, .pdf, .txt, code files, and documents (up to 50MB per file)
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                    {selectedFiles.length > 0 ? "Add More / Change Files" : "Browse Files"}
                                </Button>
                            </Box>

                            {/* RECIPIENT TARGET SELECTION */}
                            <FormControl fullWidth>
                                <InputLabel>Target Student Group(s)</InputLabel>
                                <Select
                                    multiple
                                    open={groupSelectOpen}
                                    onOpen={() => setGroupSelectOpen(true)}
                                    onClose={() => { setGroupSelectOpen(false); setGroupSearch(""); }}
                                    value={formData.assigned_group_ids}
                                    label="Target Student Group(s)"
                                    onChange={(e) => {
                                        // Ignore clicks from our custom buttons/inputs that don't pass an array
                                        if (!e.target.value) return;
                                        setFormData({
                                            ...formData,
                                            assigned_group_ids: typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value,
                                        });
                                    }}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {selected.map((val) => {
                                                const g = groups.find((grp) => grp.id === val);
                                                return (
                                                    <Chip
                                                        key={val}
                                                        label={g ? g.name : val}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                    MenuProps={{ autoFocus: false }}
                                >
                                    <ListSubheader sx={{ bgcolor: "background.paper", zIndex: 2 }}>
                                        <TextField
                                            size="small"
                                            autoFocus
                                            placeholder="Search groups..."
                                            fullWidth
                                            value={groupSearch}
                                            onChange={(e) => setGroupSearch(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </ListSubheader>
                                    {groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).map((g) => (
                                        <MenuItem key={g.id} value={g.id}>
                                            <Checkbox checked={formData.assigned_group_ids.includes(g.id)} />
                                            <ListItemText primary={g.name} />
                                        </MenuItem>
                                    ))}
                                    {groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).length === 0 && (
                                        <MenuItem disabled>No groups found</MenuItem>
                                    )}
                                    <Box sx={{ p: 1, position: 'sticky', bottom: 0, bgcolor: 'background.paper', zIndex: 2, borderTop: '1px solid #e2e8f0' }}>
                                        <Button 
                                            variant="contained" 
                                            fullWidth 
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setGroupSelectOpen(false); setGroupSearch(""); }}
                                            sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                                        >
                                            Add Groups & Close
                                        </Button>
                                    </Box>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Target Individual Student(s)</InputLabel>
                                <Select
                                    multiple
                                    open={studentSelectOpen}
                                    onOpen={() => setStudentSelectOpen(true)}
                                    onClose={() => { setStudentSelectOpen(false); setStudentSearch(""); }}
                                    value={formData.assigned_student_ids}
                                    label="Target Individual Student(s)"
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        setFormData({
                                            ...formData,
                                            assigned_student_ids: typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value,
                                        });
                                    }}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {selected.map((val) => {
                                                const s = students.find((std) => std.id === val);
                                                const sName = s ? (s.first_name ? `${s.first_name} ${s.last_name}` : (s.full_name || s.username)) : val;
                                                return (
                                                    <Chip
                                                        key={val}
                                                        label={sName}
                                                        size="small"
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                    MenuProps={{ autoFocus: false }}
                                >
                                    <ListSubheader sx={{ bgcolor: "background.paper", zIndex: 2 }}>
                                        <TextField
                                            size="small"
                                            autoFocus
                                            placeholder="Search students..."
                                            fullWidth
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </ListSubheader>
                                    {students.filter(s => {
                                        const n = s.first_name ? `${s.first_name} ${s.last_name}` : (s.full_name || s.username);
                                        return n.toLowerCase().includes(studentSearch.toLowerCase());
                                    }).map((s) => {
                                        const sName = s.first_name ? `${s.first_name} ${s.last_name}` : (s.full_name || s.username);
                                        return (
                                            <MenuItem key={s.id} value={s.id}>
                                                <Checkbox checked={formData.assigned_student_ids.includes(s.id)} />
                                                <ListItemText primary={`${sName} (${s.username})`} />
                                            </MenuItem>
                                        );
                                    })}
                                    {students.filter(s => {
                                        const n = s.first_name ? `${s.first_name} ${s.last_name}` : (s.full_name || s.username);
                                        return n.toLowerCase().includes(studentSearch.toLowerCase());
                                    }).length === 0 && (
                                        <MenuItem disabled>No students found</MenuItem>
                                    )}
                                    <Box sx={{ p: 1, position: 'sticky', bottom: 0, bgcolor: 'background.paper', zIndex: 2, borderTop: '1px solid #e2e8f0' }}>
                                        <Button 
                                            variant="contained" 
                                            fullWidth 
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setStudentSelectOpen(false); setStudentSearch(""); }}
                                            sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                                        >
                                            Add Students & Close
                                        </Button>
                                    </Box>
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ p: 3, bgcolor: "#f8fafc" }}>
                        <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: 2 }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            sx={{ borderRadius: 2, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : (editingMaterial ? "Update Class Material" : "Send Class File")}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
            <Dialog
                open={viewDialogOpen}
                onClose={() => {
                    setViewDialogOpen(false);
                    setViewingMaterial(null);
                }}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 4 } } }}
            >
                {viewingMaterial && (
                    <>
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "white" }}>
                            {viewingMaterial.title}
                        </DialogTitle>
                        <DialogContent sx={{ pt: 3 }}>
                            <Stack spacing={3}>
                                {viewingMaterial.description && (
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={0.5}>
                                            Description
                                        </Typography>
                                        <Typography variant="body2">{viewingMaterial.description}</Typography>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
                                        Attached Files
                                    </Typography>
                                    <Stack spacing={1}>
                                        {viewingMaterial.files && viewingMaterial.files.length > 0 ? (
                                            viewingMaterial.files.map((file, index) => (
                                                <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <InsertDriveFile color="action" />
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{file.name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{file.size}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        startIcon={<Download />}
                                                        onClick={() => downloadFileWithRealName(file.url, file.name)}
                                                        sx={{ textTransform: "none" }}
                                                    >
                                                        Download
                                                    </Button>
                                                </Paper>
                                            ))
                                        ) : viewingMaterial.file ? (
                                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <InsertDriveFile color="action" />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{viewingMaterial.file_name || "File"}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{viewingMaterial.file_size}</Typography>
                                                    </Box>
                                                </Box>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<Download />}
                                                    onClick={() => downloadFileWithRealName(viewingMaterial.file, viewingMaterial.file_name || `${viewingMaterial.title || "class_material"}.zip`)}
                                                    sx={{ textTransform: "none" }}
                                                >
                                                    Download
                                                </Button>
                                            </Paper>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">No files attached.</Typography>
                                        )}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
                                        Recipients
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {viewingMaterial.assigned_groups_details?.map((g) => (
                                            <Chip key={`g-${g.id}`} icon={<Group sx={{ fontSize: "14px !important" }} />} label={g.name} size="small" color="primary" variant="outlined" />
                                        ))}
                                        {viewingMaterial.assigned_students_details?.map((s) => (
                                            <Chip key={`s-${s.id}`} icon={<Person sx={{ fontSize: "14px !important" }} />} label={s.full_name || s.username} size="small" color="secondary" variant="outlined" />
                                        ))}
                                    </Box>
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", pt: 2, borderTop: "1px solid #e2e8f0" }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Sent by: {viewingMaterial.created_by_name || "Admin"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Date: {new Date(viewingMaterial.created_at).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, bgcolor: "#f8fafc" }}>
                            <Button onClick={() => setViewDialogOpen(false)} variant="outlined">
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
