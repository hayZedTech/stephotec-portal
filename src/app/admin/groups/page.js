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
import GroupsTable from "@/components/admin/groups/GroupsTable";
import GroupMembersTable from "@/components/dashboard/groups/GroupMembersTable";
import ManageMembersTable from "@/components/admin/groups/ManageMembersTable";

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
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [addMemberSearch, setAddMemberSearch] = useState("");
    const [addingMember, setAddingMember] = useState(null);

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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadAll(); }, []);

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
        if (!selectedIds || selectedIds.size === 0) return;
        confirmAction(`Delete ${selectedIds.size} group(s)?`, async () => {
            try {
                await api.post("/admin/groups/bulk-delete/", { ids: Array.from(selectedIds) });
                successToast(`${selectedIds.size} group(s) deleted`);
                setSelectedIds(new Set()); loadAll();
            } catch (err) { errorToast(err, "Bulk delete failed"); }
        }, null, "Delete", "Cancel", true);
    };

    const handleSelectionChange = (newSelection) => {
        if (!newSelection) {
            setSelectedIds(new Set());
            return;
        }
        if (newSelection instanceof Set) {
            setSelectedIds(newSelection);
        } else if (Array.isArray(newSelection)) {
            setSelectedIds(new Set(newSelection));
        } else if (typeof newSelection === "object" && newSelection.ids) {
            const ids = newSelection.ids;
            if (ids instanceof Set) {
                if (newSelection.type === "exclude") {
                    setSelectedIds(new Set(filtered.map(g => g.id).filter(id => !ids.has(id))));
                } else {
                    setSelectedIds(ids);
                }
            } else if (Array.isArray(ids)) {
                setSelectedIds(new Set(ids));
            } else {
                setSelectedIds(new Set());
            }
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelect = (id) => { const s = new Set(selectedIds || []); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
    const toggleSelectAll = () => { setSelectedIds((selectedIds?.size || 0) === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map(g => g.id))); };

    const openViewMembers = (group) => { setViewingGroup(group); setViewOpen(true); };

    const openManageMembers = (group) => {
        setMembersGroup(group); setMemberSearchTerm("");
        setMembersDialogOpen(true);
        loadStudentsForCourse(group.course);
    };

    const handleRemoveMember = async (studentId) => {
        if (!membersGroup) return;
        try {
            await api.post(`/admin/groups/${membersGroup.id}/remove-members/`, { member_ids: [studentId] });
            successToast("Member removed");
            const res = await api.get(`/admin/groups/${membersGroup.id}/`);
            const updated = res.data;
            setMembersGroup(updated);
            setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
        } catch (err) { errorToast(err, "Failed to remove member"); }
    };

    const handleAddMember = async (student) => {
        if (!membersGroup) return;
        setAddingMember(student.id);
        try {
            await api.post(`/admin/groups/${membersGroup.id}/add-members/`, { member_ids: [student.id] });
            successToast(`${student.first_name} ${student.last_name} added`);
            const res = await api.get(`/admin/groups/${membersGroup.id}/`);
            const updated = res.data;
            setMembersGroup(updated);
            setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
        } catch (err) { errorToast(err, "Failed to add member"); }
        finally { setAddingMember(null); }
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
                    {(selectedIds?.size || 0) > 0 && (
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
                    <GroupsTable
                        rows={filtered}
                        loading={loading}
                        courses={courses}
                        onViewMembers={openViewMembers}
                        onManageMembers={openManageMembers}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        selectedIds={selectedIds || new Set()}
                        onRowSelectionChange={handleSelectionChange}
                    />
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
                        <Box sx={{ p: { xs: 0, sm: 2 } }}>
                            <GroupMembersTable members={viewingGroup.members_detail} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setViewOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            {/* MANAGE MEMBERS */}
            <Dialog open={membersDialogOpen} onClose={(e, r) => { if (r === "backdropClick") return; setMembersDialogOpen(false); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Manage Members</Typography>
                        <Typography variant="caption" color="text.secondary">{membersGroup?.name}</Typography>
                    </Box>
                    <IconButton onClick={() => setMembersDialogOpen(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {/* Add Member button row */}
                    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                        {!addMemberOpen ? (
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={() => { setAddMemberOpen(true); setAddMemberSearch(""); loadStudentsForCourse(membersGroup?.course); }}
                                sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 700, borderRadius: 2 }}
                            >
                                Add Member
                            </Button>
                        ) : (
                            <Box sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2, p: 2, bgcolor: "grey.50" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                    <Typography variant="subtitle2" fontWeight={700}>Add a Student</Typography>
                                    <IconButton size="small" onClick={() => setAddMemberOpen(false)}><Close fontSize="small" /></IconButton>
                                </Box>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Search by name or email..."
                                    value={addMemberSearch}
                                    onChange={e => setAddMemberSearch(e.target.value)}
                                    autoFocus
                                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                                />
                                <Box sx={{ maxHeight: 200, overflow: "auto", mt: 1 }}>
                                    {loadingStudents ? (
                                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>
                                    ) : (
                                        allStudents
                                            .filter(s => !membersInGroup.has(s.id))
                                            .filter(s => !addMemberSearch || `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(addMemberSearch.toLowerCase()))
                                            .length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                                {addMemberSearch ? "No matching students" : "All students in this course are already members"}
                                            </Typography>
                                        ) : (
                                            allStudents
                                                .filter(s => !membersInGroup.has(s.id))
                                                .filter(s => !addMemberSearch || `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(addMemberSearch.toLowerCase()))
                                                .map((s, idx, arr) => (
                                                    <Box key={s.id}
                                                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, borderBottom: idx < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200", borderRadius: 1 }}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{s.first_name} {s.last_name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                                                        </Box>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            disabled={addingMember === s.id}
                                                            onClick={() => handleAddMember(s)}
                                                            sx={{ minWidth: 56, bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                                                        >
                                                            {addingMember === s.id ? <CircularProgress size={14} color="inherit" /> : "Add"}
                                                        </Button>
                                                    </Box>
                                                ))
                                        )
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* Current members list */}
                    <Box sx={{ px: 2, pb: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1} mt={1.5}>
                            CURRENT MEMBERS ({membersGroup?.members_detail?.length ?? 0})
                        </Typography>
                        {(membersGroup?.members_detail || []).length === 0 ? (
                            <Box sx={{ py: 4, textAlign: "center", border: "1px dashed", borderColor: "grey.300", borderRadius: 2 }}>
                                <People sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">No members yet. Add some above!</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2, overflow: "hidden" }}>
                                {(membersGroup?.members_detail || []).map((member, idx, arr) => (
                                    <Box key={member.id}
                                        sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, borderBottom: idx < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200", "&:hover": { bgcolor: "grey.50" } }}
                                    >
                                        <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                            {member.first_name?.charAt(0)?.toUpperCase() || "?"}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap>{member.first_name} {member.last_name}</Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>{member.email}</Typography>
                                        </Box>
                                        <Tooltip title="Remove from group">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => confirmAction(`Remove ${member.first_name} ${member.last_name} from this group?`, () => handleRemoveMember(member.id), null, "Remove", "Cancel", true)}
                                            >
                                                <PersonRemove fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions><Button onClick={() => setMembersDialogOpen(false)}>Done</Button></DialogActions>
            </Dialog>
        </Box>
    );
}
