"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress, InputAdornment,
    Avatar, Divider, LinearProgress, Tooltip, Tabs, Tab,
    Card, CardContent, Stack, useMediaQuery, useTheme, Select, MenuItem,
} from "@mui/material";
import { Visibility, Edit, Search, Payment, Close, FilterList } from "@mui/icons-material";
import api from "@/lib/axios";
import { successToast, errorToast } from "@/lib/toast";

const STATUS_META = {
    PAID:    { color: "success", text: "#16a34a", bg: "#f0fdf4" },
    PARTIAL: { color: "warning", text: "#d97706", bg: "#fffbeb" },
    UNPAID:  { color: "error",   text: "#dc2626", bg: "#fef2f2" },
};

function fmt(val) {
    return Number(val || 0).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });
}

function PaymentProgress({ fee, paid, status }) {
    const pct = fee > 0 ? Math.min(100, Math.round((paid / fee) * 100)) : 0;
    const meta = STATUS_META[status] || STATUS_META.UNPAID;
    return (
        <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { bgcolor: meta.text } }}
        />
    );
}

function CoursePaymentView({ course }) {
    const meta = STATUS_META[course.status] || STATUS_META.UNPAID;
    const pct = course.course_fee > 0 ? Math.min(100, Math.round((course.amount_paid / course.course_fee) * 100)) : 0;
    return (
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: { xs: 1, sm: 2 } }}>
                {[
                    { label: "Course Fee", value: fmt(course.course_fee), color: "#2563eb" },
                    { label: "Amount Paid", value: fmt(course.amount_paid), color: "#16a34a" },
                    { label: "Outstanding", value: fmt(course.outstanding), color: "#dc2626" },
                ].map((item) => (
                    <Paper key={item.label} elevation={0} variant="outlined" sx={{ p: { xs: 1, sm: 1.5 }, borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: item.color, fontSize: { xs: "0.72rem", sm: "0.875rem" } }}>{item.value}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>{item.label}</Typography>
                    </Paper>
                ))}
            </Box>
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>Payment Progress</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: meta.text, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{pct}%</Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 10, borderRadius: 5, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { bgcolor: meta.text, borderRadius: 5 } }}
                />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>Status:</Typography>
                <Chip label={course.status} color={meta.color} size="small" />
            </Box>
            {course.notes && (
                <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">Notes</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{course.notes}</Typography>
                </Box>
            )}
            <Typography variant="caption" color="text.disabled">
                Last updated: {new Date(course.last_updated).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </Typography>
        </Box>
    );
}

function CoursePaymentEdit({ course, onChange }) {
    const outstanding = Math.max(0, (parseFloat(course.course_fee) || 0) - (parseFloat(course.amount_paid) || 0));
    return (
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
                label="Course Fee (₦)"
                type="number"
                value={course.course_fee}
                onChange={(e) => onChange("course_fee", e.target.value)}
                size="small"
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₦</InputAdornment> } }}
            />
            <TextField
                label="Amount Paid (₦)"
                type="number"
                value={course.amount_paid}
                onChange={(e) => onChange("amount_paid", e.target.value)}
                size="small"
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₦</InputAdornment> } }}
            />
            <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Preview</Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="body2">Outstanding</Typography>
                    <Typography variant="body2" fontWeight={700} color="#dc2626">{fmt(outstanding)}</Typography>
                </Box>
            </Box>
            <TextField
                label="Notes (optional)"
                value={course.notes}
                onChange={(e) => onChange("notes", e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder="e.g. Paid via bank transfer on 12 Jan..."
            />
        </Box>
    );
}

// ── Shared modal tabs header ──────────────────────────────────────────────────
function CourseTabs({ courses, value, onChange }) {
    return (
        <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 1 }}>
            <Tabs
                value={value}
                onChange={(_, v) => onChange(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    "& .MuiTab-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        minHeight: { xs: 40, sm: 48 },
                        py: { xs: 1, sm: 1.5 },
                        px: { xs: 1, sm: 2 },
                        textTransform: "none",
                        fontWeight: 500,
                    },
                }}
            >
                {courses.map((c) => (
                    <Tab
                        key={c.id}
                        label={
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {c.course_name}
                                {c.is_primary && <Chip label="Primary" size="small" color="primary" sx={{ height: 16, fontSize: "0.6rem" }} />}
                            </span>
                        }
                    />
                ))}
            </Tabs>
        </Box>
    );
}

export default function AdminPaymentsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [viewStudent, setViewStudent] = useState(null);
    const [viewTab, setViewTab] = useState(0);
    const [editStudent, setEditStudent] = useState(null);
    const [editTab, setEditTab] = useState(0);
    const [editForms, setEditForms] = useState({});
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            await api.post("/payments/ensure/").catch(() => {});
            const { data } = await api.get("/payments/by_student/");
            setStudents(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            errorToast(err, "Failed to load payments");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = students.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch = !q || s.student_name?.toLowerCase().includes(q) || s.student_username?.toLowerCase().includes(q);
        const matchStatus = !statusFilter || s.primary_status === statusFilter;
        return matchSearch && matchStatus;
    });

    function openView(student) { setViewStudent(student); setViewTab(0); }

    function openEdit(student) {
        setEditStudent(student);
        setEditTab(0);
        const forms = {};
        student.courses.forEach((c) => {
            forms[c.id] = { course_fee: c.course_fee, amount_paid: c.amount_paid, notes: c.notes || "" };
        });
        setEditForms(forms);
    }

    function handleEditChange(paymentId, field, value) {
        setEditForms((prev) => ({ ...prev, [paymentId]: { ...prev[paymentId], [field]: value } }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            await Promise.all(
                Object.entries(editForms).map(([id, form]) =>
                    api.patch(`/payments/${id}/`, {
                        course_fee: parseFloat(form.course_fee) || 0,
                        amount_paid: parseFloat(form.amount_paid) || 0,
                        notes: form.notes,
                    })
                )
            );
            successToast("Payments updated");
            setEditStudent(null);
            load();
        } catch (err) {
            errorToast(err, "Failed to update payments");
        } finally {
            setSaving(false);
        }
    }

    // ── Mobile card list ──────────────────────────────────────────────────────
    const renderMobileCards = () => (
        <Stack spacing={2}>
            {filtered.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                    <Payment sx={{ fontSize: 40, color: "grey.300", mb: 1, display: "block", mx: "auto" }} />
                    <Typography color="text.secondary">No payment records found.</Typography>
                </Box>
            ) : filtered.map((s) => {
                const meta = STATUS_META[s.primary_status] || STATUS_META.UNPAID;
                return (
                    <Card key={s.student_id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                        <CardContent sx={{ pb: "16px !important" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                                <Avatar sx={{ width: 44, height: 44, bgcolor: "#7c3aed", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                                    {s.student_name?.charAt(0) || "S"}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {s.student_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">{s.student_username}</Typography>
                                </Box>
                                <Chip label={s.primary_status} size="small" color={meta.color} variant="outlined" />
                            </Box>

                            <Stack spacing={1.5} sx={{ mb: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Primary Course</Typography>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography variant="body2" fontWeight={600}>{s.primary_course_name}</Typography>
                                        {s.courses.length > 1 && (
                                            <Typography variant="caption" color="text.secondary">+{s.courses.length - 1} more</Typography>
                                        )}
                                    </Box>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Course Fee</Typography>
                                    <Typography variant="body2" fontWeight={600}>{fmt(s.primary_course_fee)}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Paid</Typography>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography variant="body2" fontWeight={600} sx={{ color: "#16a34a" }}>{fmt(s.primary_amount_paid)}</Typography>
                                        <PaymentProgress fee={Number(s.primary_course_fee)} paid={Number(s.primary_amount_paid)} status={s.primary_status} />
                                    </Box>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Outstanding</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: "#dc2626" }}>{fmt(s.primary_outstanding)}</Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                                <Tooltip title="View details">
                                    <IconButton size="small" onClick={() => openView(s)}><Visibility fontSize="small" /></IconButton>
                                </Tooltip>
                                <Tooltip title="Edit payments">
                                    <IconButton size="small" onClick={() => openEdit(s)}><Edit fontSize="small" /></IconButton>
                                </Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                );
            })}
        </Stack>
    );

    const dialogPaperSx = { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1, sm: 2 }, maxHeight: { xs: "95vh", sm: "90vh" }, width: { xs: "calc(100% - 16px)", sm: "auto" } };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>Student Payments</Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>Track and manage course fee payments for all students.</Typography>
            </Box>

            {/* Table / Cards */}
            <Paper elevation={0} sx={{ borderRadius: { xs: 2, sm: 4 }, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                {/* Toolbar */}
                <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, borderBottom: "1px solid", borderColor: "grey.200", display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 2 }}>
                    <TextField
                        placeholder="Search name or username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" sx={{ color: "text.disabled" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            size="small"
                            displayEmpty
                            sx={{ minWidth: 150 }}
                            startAdornment={<FilterList fontSize="small" sx={{ mr: 0.5, color: "text.disabled" }} />}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="PAID">Paid</MenuItem>
                            <MenuItem value="PARTIAL">Partial</MenuItem>
                            <MenuItem value="UNPAID">Unpaid</MenuItem>
                        </Select>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box>
                ) : isMobile ? (
                    <Box sx={{ p: 2 }}>{renderMobileCards()}</Box>
                ) : (
                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Student</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Primary Course</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Course Fee</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Outstanding</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                            <Payment sx={{ fontSize: 40, color: "grey.300", mb: 1, display: "block", mx: "auto" }} />
                                            <Typography color="text.secondary">No payment records found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.map((s) => {
                                    const meta = STATUS_META[s.primary_status] || STATUS_META.UNPAID;
                                    return (
                                        <TableRow key={s.student_id} hover>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: "#7c3aed", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                        {s.student_name?.charAt(0) || "S"}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{s.student_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{s.student_username}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{s.primary_course_name}</Typography>
                                                {s.courses.length > 1 && (
                                                    <Typography variant="caption" color="text.secondary">+{s.courses.length - 1} more course{s.courses.length > 2 ? "s" : ""}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={500}>{fmt(s.primary_course_fee)}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: "#16a34a" }}>{fmt(s.primary_amount_paid)}</Typography>
                                                <PaymentProgress fee={Number(s.primary_course_fee)} paid={Number(s.primary_amount_paid)} status={s.primary_status} />
                                            </TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={600} sx={{ color: "#dc2626" }}>{fmt(s.primary_outstanding)}</Typography></TableCell>
                                            <TableCell><Chip label={s.primary_status} size="small" color={meta.color} variant="outlined" /></TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="View details">
                                                    <IconButton size="small" onClick={() => openView(s)}><Visibility fontSize="small" /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit payments">
                                                    <IconButton size="small" onClick={() => openEdit(s)}><Edit fontSize="small" /></IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* VIEW MODAL */}
            <Dialog open={!!viewStudent} onClose={() => setViewStudent(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: dialogPaperSx } }}>
                {viewStudent && (
                    <>
                        <DialogTitle sx={{ py: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 }, pr: 6 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, bgcolor: "#7c3aed", fontWeight: 700 }}>
                                    {viewStudent.student_name?.charAt(0) || "S"}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={700} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>{viewStudent.student_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{viewStudent.student_username}</Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={() => setViewStudent(null)} size="small" sx={{ position: "absolute", top: 12, right: 12 }}><Close /></IconButton>
                        </DialogTitle>
                        <Divider />
                        <CourseTabs courses={viewStudent.courses} value={viewTab} onChange={setViewTab} />
                        <DialogContent sx={{ pt: 0, px: { xs: 2, sm: 3 } }}>
                            {viewStudent.courses.map((c, i) => (
                                viewTab === i && <CoursePaymentView key={c.id} course={c} />
                            ))}
                        </DialogContent>
                        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: 1 }}>
                            <Button onClick={() => { setViewStudent(null); openEdit(viewStudent); }} variant="outlined" startIcon={<Edit />} size="small">Edit Payments</Button>
                            <Button onClick={() => setViewStudent(null)} variant="contained" size="small">Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={!!editStudent} onClose={() => setEditStudent(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: dialogPaperSx } }}>
                {editStudent && (
                    <>
                        <DialogTitle sx={{ py: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 }, pr: 6 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, bgcolor: "#7c3aed", fontWeight: 700 }}>
                                    {editStudent.student_name?.charAt(0) || "S"}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={700} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>Edit Payments — {editStudent.student_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{editStudent.student_username}</Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={() => setEditStudent(null)} size="small" sx={{ position: "absolute", top: 12, right: 12 }}><Close /></IconButton>
                        </DialogTitle>
                        <Divider />
                        <CourseTabs courses={editStudent.courses} value={editTab} onChange={setEditTab} />
                        <DialogContent sx={{ pt: 0, px: { xs: 2, sm: 3 } }}>
                            {editStudent.courses.map((c, i) =>
                                editTab === i && editForms[c.id] ? (
                                    <CoursePaymentEdit
                                        key={c.id}
                                        course={editForms[c.id]}
                                        onChange={(field, value) => handleEditChange(c.id, field, value)}
                                    />
                                ) : null
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: 1 }}>
                            <Button onClick={() => setEditStudent(null)} variant="outlined" color="inherit" size="small">Cancel</Button>
                            <Button onClick={handleSave} variant="contained" size="small" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                                {saving ? "Saving..." : "Save All Changes"}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
