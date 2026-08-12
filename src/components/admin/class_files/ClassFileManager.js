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

export default function ClassFileManager() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Search & Filter
    const [search, setSearch] = useState("");
    const [recipientFilter, setRecipientFilter] = useState("ALL");

    // Modal State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assigned_group_ids: [],
        assigned_student_ids: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterClassMaterials();
    }, [materials, search, recipientFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [materialsRes, groupsRes, studentsData] = await Promise.allSettled([
                api.get("/learning/class-materials/"),
                api.get("/admin/groups/"),
                getStudents(),
            ]);

            if (materialsRes.status === "fulfilled") {
                const mats = Array.isArray(materialsRes.value.data)
                    ? materialsRes.value.data
                    : materialsRes.value.data?.results || [];
                setMaterials(mats);
            }

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
        } catch (error) {
            errorToast(error, "Failed to load class materials");
        } finally {
            setLoading(false);
        }
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

    const handleOpenAdd = () => {
        setSelectedFile(null);
        setFormData({
            title: "",
            description: "",
            assigned_group_ids: [],
            assigned_student_ids: [],
        });
        setOpenDialog(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (!formData.title) {
                const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                setFormData((prev) => ({ ...prev, title: baseName }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            errorToast("Please enter a title for the class material.");
            return;
        }

        if (!selectedFile) {
            errorToast("Please select a class file or folder archive to upload.");
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
            uploadPayload.append("file", selectedFile);

            formData.assigned_group_ids.forEach((id) => {
                uploadPayload.append("assigned_group_ids", id);
            });

            formData.assigned_student_ids.forEach((id) => {
                uploadPayload.append("assigned_student_ids", id);
            });

            await api.post("/learning/class-materials/", uploadPayload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            successToast("Class material uploaded and sent successfully!");
            setOpenDialog(false);
            loadData();
        } catch (error) {
            errorToast(error, "Failed to upload class material");
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
                        onClick={handleOpenAdd}
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
                            onClick={handleOpenAdd}
                            sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                        >
                            Upload First Class File
                        </Button>
                    </Box>
                ) : isMobile ? (
                    <Stack spacing={2} sx={{ p: 2 }}>
                        {filteredMaterials.map((m) => (
                            <Card key={m.id} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Folder sx={{ color: "#d97706" }} />
                                            <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>
                                                {m.title}
                                            </Typography>
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
                                                    component="a"
                                                    href={m.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    size="small"
                                                    sx={{ color: "primary.main" }}
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
                                    <TableCell sx={{ fontWeight: 700 }}>Class Material Title</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>File Details</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Assigned Recipients</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Sent Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMaterials.map((m) => (
                                    <TableRow key={m.id} hover>
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
                                                    {m.file_name || "Class Code / Folder"}
                                                </Typography>
                                            </Stack>
                                            {m.file_size && (
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
                                                    component="a"
                                                    href={m.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    sx={{ fontWeight: 700, textTransform: "none" }}
                                                >
                                                    Download
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
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                                <CloudUpload sx={{ fontSize: 40, color: "#d97706", mb: 1 }} />
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {selectedFile ? selectedFile.name : "Select Class Code, Zip Folder, or File"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                                    Supports .zip, .rar, .7z, .pdf, .txt, code files, and documents (up to 50MB)
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                    {selectedFile ? "Change Selected File" : "Browse File"}
                                </Button>
                            </Box>

                            {/* RECIPIENT TARGET SELECTION */}
                            <FormControl fullWidth>
                                <InputLabel>Target Student Group(s)</InputLabel>
                                <Select
                                    multiple
                                    value={formData.assigned_group_ids}
                                    label="Target Student Group(s)"
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            assigned_group_ids: typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value,
                                        })
                                    }
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
                                >
                                    {groups.map((g) => (
                                        <MenuItem key={g.id} value={g.id}>
                                            <Checkbox checked={formData.assigned_group_ids.includes(g.id)} />
                                            <ListItemText primary={g.name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Target Individual Student(s)</InputLabel>
                                <Select
                                    multiple
                                    value={formData.assigned_student_ids}
                                    label="Target Individual Student(s)"
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            assigned_student_ids: typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value,
                                        })
                                    }
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
                                >
                                    {students.map((s) => {
                                        const sName = s.first_name ? `${s.first_name} ${s.last_name}` : (s.full_name || s.username);
                                        return (
                                            <MenuItem key={s.id} value={s.id}>
                                                <Checkbox checked={formData.assigned_student_ids.includes(s.id)} />
                                                <ListItemText primary={`${sName} (${s.username})`} />
                                            </MenuItem>
                                        );
                                    })}
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
                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Send Class File"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
