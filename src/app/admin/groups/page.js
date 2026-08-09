"use client";

import { useState, useEffect } from "react";
import {
    Box, Button, Paper, Typography, Stack, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, Checkbox, CircularProgress, InputAdornment,
    Tooltip, FormControl, InputLabel, Select, ListSubheader,
} from "@mui/material";
import {
    Add, Edit, Delete, Search, People, DeleteSweep, PersonAdd, PersonRemove, Close,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState([]);
    const [courses, setCourses] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({ name: "", description: "", course: "", member_ids: [] });
    const [saving, setSaving] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewingGroup, setViewingGroup] = useState(null);
    const [membersDialogOpen, setMembersDialogOpen] = useState(false);
    const [membersGroup, setMembersGroup] = useState(null);
    const [memberSearchTerm, setMemberSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [createMemberSearchTerm, setCreateMemberSearchTerm] = useState("");
    const [createSelectOpen, setCreateSelectOpen] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [groupsRes, coursesData] = await Promise.all([
                api.get("/admin/groups/").catch(() => ({ data: [] })),
                getCourses().catch(() => []),
            ]);
            setGroups(groupsRes.data.results || groupsRes.data || []);
            setCourses(coursesData);
        } catch (err) {
            errorToast(err, "Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    const loadStudentsForCourse = async (courseId) => {
        if (!courseId) { setAllStudents([]); return; }
        try {
            setLoadingStudents(true);
            const res = await api.get(`/admin/students/?courses__course_id=${courseId}`);
            setAllStudents(res.data.results || res.data || []);
        } catch { setAllStudents([]); } finally {
            setLoadingStudents(false);
        }
    };

    const openCreate = () => {
        setEditingGroup(null);
        setFormData({ name: "", description: "", course: "", member_ids: [] });
        setAllStudents([]);
        setCreateMemberSearchTerm("");
        setDialogOpen(true);
    };

    const openEdit = (group) => {
        setEditingGroup(group);
        setFormData({ name: group.name, description: group.description || "", course: group.course, member_ids: group.members_detail?.map(m => m.id) || [] });
        loadStudentsForCourse(group.course);
        setCreateMemberSearchTerm("");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.course) { errorToast(null, "Group Name and Course are required."); return; }
        try {
            setSaving(true);
            if (editingGroup) {
                await api.patch(`/admin/groups/${editingGroup.id}/`, formData);
                successToast("Group updated successfully!");
            } else {
                await api.post("/admin/groups/", formData);
                successToast("Group created successfully!");
            }
            setDialogOpen(false);
            loadAll();
        } catch (err) { errorToast(err, "Failed to save group"); }
        finally { setSaving(false); }
    };

    const handleDelete = (group) => {
        confirmAction(`Delete group "${group.name}"?`, async () => {
            try { await api.delete(`/admin/groups/${group.id}/`); successToast("Group deleted"); loadAll(); }
            catch (err) { errorToast(err, "Failed to delete"); }
        }, null, "Delete", "Cancel", true);
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        confirmAction(`Delete ${selectedIds.size} group(s)?`, async () => {
            try {
                await api.post("/admin/groups/bulk-delete/", { ids: Array.from(selectedIds) });
                successToast(`${selectedIds.size} group(s) deleted`);
                setSelectedIds(new Set()); loadAll();
            } catch (err) { errorToast(err, "Bulk delete failed"); }
        }, null, "Delete", "Cancel", true);
    };

    const toggleSelect = (id) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
    const toggleSelectAll = () => { setSelectedIds(selectedIds.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map(g => g.id))); };

    const openViewMembers = (group) => { setViewingGroup(group); setViewOpen(true); };

    const openManageMembers = (group) => {
        setMembersGroup(group); setMemberSearchTerm("");
        setMembersDialogOpen(true);
        loadStudentsForCourse(group.course);
    };

    const handleToggleMember = async (studentId, isMember) => {
        if (!membersGroup) return;
        try {
            const endpoint = isMember ? "remove-members" : "add-members";
            await api.post(`/admin/groups/${membersGroup.id}/${endpoint}/`, { member_ids: [studentId] });
            successToast(isMember ? "Member removed" : "Member added");
            const res = await api.get(`/admin/groups/${membersGroup.id}/`);
            const updated = res.data;
            setMembersGroup(updated);
            setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
        } catch (err) { errorToast(err, "Failed to update members"); }
    };

    const getCourseName = (id) => courses.find(c => c.id === id)?.name || "Unknown";
    const filtered = groups.filter(g => (!searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase())) && (!filterCourse || g.course === parseInt(filterCourse)));
    const membersInGroup = new Set(membersGroup?.members_detail?.map(m => m.id) || []);

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Student Groups</Typography>
                    <Typography variant="body2" color="text.secondary">Organise students into groups for bulk material and assignment distribution.</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 700, borderRadius: 2 }}>
                    Create Group
                </Button>
            </Box>
            <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField size="small" placeholder="Search groups..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} sx={{ flex: 1 }} />
                    <TextField select size="small" label="Filter by Course" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} sx={{ minWidth: 200 }}>
                        <MenuItem value="">All Courses</MenuItem>
                        {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                    {selectedIds.size > 0 && (
                        <Button variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={handleBulkDelete}>Delete ({selectedIds.size})</Button>
                    )}
                </Stack>
            </Paper>
            <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}><CircularProgress /></Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: "center" }}>
                        <People sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary">No groups found. Create one to get started.</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: "#0f172a" }}>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ color: "white" }}>
                                        <Checkbox size="small" sx={{ color: "white" }} checked={selectedIds.size === filtered.length && filtered.length > 0} indeterminate={selectedIds.size > 0 && selectedIds.size < filtered.length} onChange={toggleSelectAll} />
                                    </TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Group Name</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Course</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700, textAlign: "center" }}>Members</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Created</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map(group => (
                                    <TableRow key={group.id} hover selected={selectedIds.has(group.id)}>
                                        <TableCell padding="checkbox"><Checkbox size="small" checked={selectedIds.has(group.id)} onChange={() => toggleSelect(group.id)} /></TableCell>
                                        <TableCell>
                                            <Typography fontWeight={700}>{group.name}</Typography>
                                            {group.description && <Typography variant="caption" color="text.secondary">{group.description}</Typography>}
                                        </TableCell>
                                        <TableCell><Chip label={getCourseName(group.course)} size="small" sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }} /></TableCell>
                                        <TableCell align="center">
                                            <Chip icon={<People fontSize="small" />} label={group.member_count ?? 0} size="small" color="primary" variant="outlined" onClick={() => openViewMembers(group)} sx={{ fontWeight: 700, cursor: "pointer" }} />
                                        </TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{new Date(group.created_at).toLocaleDateString()}</Typography></TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                                                <Tooltip title="View Members"><IconButton size="small" onClick={() => openViewMembers(group)}><People fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Manage Members"><IconButton size="small" color="primary" onClick={() => openManageMembers(group)}><PersonAdd fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(group)}><Edit fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(group)}><Delete fontSize="small" /></IconButton></Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* CREATE / EDIT */}
            <Dialog open={dialogOpen} onClose={(e, r) => { if (r === "backdropClick") return; setDialogOpen(false); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {editingGroup ? "Edit Group" : "Create New Group"}
                    <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "white" }} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Group Name" required fullWidth size="small" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                        <TextField label="Description (optional)" fullWidth size="small" multiline rows={2} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                        <TextField select label="Course" required fullWidth size="small" value={formData.course} onChange={e => { const cid = e.target.value; setFormData(p => ({ ...p, course: cid, member_ids: [] })); loadStudentsForCourse(cid); }}>
                            <MenuItem value="">Select Course</MenuItem>
                            {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                        {formData.course && (
                            <FormControl fullWidth size="small">
                                <InputLabel>Add Members (optional)</InputLabel>
                                <Select multiple label="Add Members (optional)" value={formData.member_ids} onChange={e => setFormData(p => ({ ...p, member_ids: e.target.value }))} renderValue={s => `${s.length} student(s) selected`} open={createSelectOpen} onOpen={() => setCreateSelectOpen(true)} onClose={() => setCreateSelectOpen(false)}>
                                    <ListSubheader sx={{ pt: 1, pb: 1, zIndex: 2, bgcolor: 'background.paper' }}>
                                        <TextField size="small" autoFocus placeholder="Search students..." fullWidth value={createMemberSearchTerm} onChange={e => setCreateMemberSearchTerm(e.target.value)} onKeyDown={e => e.stopPropagation()} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
                                    </ListSubheader>
                                    {loadingStudents ? (
                                        <MenuItem disabled><CircularProgress size={20} sx={{ mr: 2 }} /> Loading students...</MenuItem>
                                    ) : allStudents.filter(s => !createMemberSearchTerm || `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(createMemberSearchTerm.toLowerCase())).length === 0 ? <MenuItem disabled>No students found</MenuItem> : allStudents.filter(s => !createMemberSearchTerm || `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(createMemberSearchTerm.toLowerCase())).map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            <Checkbox checked={formData.member_ids.includes(s.id)} size="small" />
                                            {s.first_name} {s.last_name} — {s.email}
                                        </MenuItem>
                                    ))}
                                    <Box sx={{ p: 1, position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', zIndex: 2 }}>
                                        <Button fullWidth variant="contained" onClick={() => setCreateSelectOpen(false)} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Add</Button>
                                    </Box>
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
                        {saving ? "Saving..." : (editingGroup ? "Update Group" : "Create Group")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* VIEW MEMBERS */}
            <Dialog open={viewOpen} onClose={(e, r) => { if (r === "backdropClick") return; setViewOpen(false); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {viewingGroup?.name} — Members
                    <IconButton onClick={() => setViewOpen(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {(viewingGroup?.members_detail || []).length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={3}>No members in this group.</Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {viewingGroup.members_detail.map(m => (
                                    <TableRow key={m.id} hover>
                                        <TableCell><Chip label={m.username} size="small" sx={{ fontFamily: "monospace", fontWeight: 700 }} /></TableCell>
                                        <TableCell>{m.first_name} {m.last_name}</TableCell>
                                        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{m.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setViewOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            {/* MANAGE MEMBERS */}
            <Dialog open={membersDialogOpen} onClose={(e, r) => { if (r === "backdropClick") return; setMembersDialogOpen(false); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Manage Members — {membersGroup?.name}
                    <IconButton onClick={() => setMembersDialogOpen(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <TextField size="small" fullWidth placeholder="Search students..." value={memberSearchTerm} onChange={e => setMemberSearchTerm(e.target.value)} sx={{ mb: 2 }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
                    {loadingStudents ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
                    ) : allStudents.filter(s => !memberSearchTerm || `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(memberSearchTerm.toLowerCase())).map((student, idx, arr) => {
                        const isMember = membersInGroup.has(student.id);
                        return (
                            <Box key={student.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, borderBottom: idx < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200" }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>{student.first_name} {student.last_name}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>{student.email}</Typography>
                                </Box>
                                <Chip label={isMember ? "Remove" : "Add"} color={isMember ? "error" : "primary"} size="small"
                                    icon={isMember ? <PersonRemove fontSize="small" /> : <PersonAdd fontSize="small" />}
                                    onClick={() => handleToggleMember(student.id, isMember)} sx={{ fontWeight: 700, cursor: "pointer" }} />
                            </Box>
                        );
                    })}
                    {allStudents.length === 0 && <Typography textAlign="center" color="text.secondary" py={3}>No students found for this course.</Typography>}
                </DialogContent>
                <DialogActions><Button onClick={() => setMembersDialogOpen(false)}>Done</Button></DialogActions>
            </Dialog>
        </Box>
    );
}
