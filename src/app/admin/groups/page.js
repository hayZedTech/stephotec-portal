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
    const [formData, setFormData] = useState({ name: "", description: "", course_ids: [], member_ids: [] });
    const [saving, setSaving] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewingGroup, setViewingGroup] = useState(null);
    const [membersDialogOpen, setMembersDialogOpen] = useState(false);
    const [membersGroup, setMembersGroup] = useState(null);
    const [memberSearchTerm, setMemberSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [coursesSelectOpen, setCoursesSelectOpen] = useState(false);
    const [createMemberSearchTerm, setCreateMemberSearchTerm] = useState("");
    const [createMemberFilterMode, setCreateMemberFilterMode] = useState("COURSE_ONLY"); // "COURSE_ONLY" or "ALL"
    const [createSelectOpen, setCreateSelectOpen] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [addMemberSearch, setAddMemberSearch] = useState("");
    const [addMemberFilterMode, setAddMemberFilterMode] = useState("ALL");
    const [addingMember, setAddingMember] = useState(null);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [groupsRes, coursesData, studentsRes] = await Promise.all([
                api.get("/admin/groups/").catch(() => ({ data: [] })),
                getCourses().catch(() => []),
                api.get("/admin/students/").catch(() => ({ data: { results: [] } })),
            ]);
            setGroups(groupsRes.data.results || groupsRes.data || []);
            setCourses(coursesData);
            setAllStudents(studentsRes.data.results || studentsRes.data || []);
        } catch (err) {
            errorToast(err, "Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadAll(); }, []);

    const openCreate = () => {
        setEditingGroup(null);
        setFormData({ name: "", description: "", course_ids: [], member_ids: [] });
        setCreateMemberSearchTerm("");
        setCreateMemberFilterMode("ALL");
        setDialogOpen(true);
    };

    const openEdit = (group) => {
        setEditingGroup(group);
        const groupCourseIds = group.courses_detail?.map(c => c.id) ||
            (Array.isArray(group.courses) ? group.courses : (group.course ? [group.course] : []));

        setFormData({
            name: group.name,
            description: group.description || "",
            course_ids: groupCourseIds,
            member_ids: group.members_detail?.map(m => m.id) || []
        });
        setCreateMemberSearchTerm("");
        setCreateMemberFilterMode(groupCourseIds.length > 0 ? "COURSE_ONLY" : "ALL");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            errorToast(null, "Group Name is required.");
            return;
        }
        try {
            setSaving(true);
            const payload = {
                name: formData.name.trim(),
                description: formData.description,
                course_ids: formData.course_ids,
                member_ids: formData.member_ids,
            };

            if (editingGroup) {
                await api.patch(`/admin/groups/${editingGroup.id}/`, payload);
                successToast("Group updated successfully!");
            } else {
                await api.post("/admin/groups/", payload);
                successToast("Group created successfully!");
            }
            setDialogOpen(false);
            loadAll();
        } catch (err) {
            errorToast(err, "Failed to save group");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (group) => {
        confirmAction(`Delete group "${group.name}"?`, async () => {
            try {
                await api.delete(`/admin/groups/${group.id}/`);
                successToast("Group deleted");
                loadAll();
            } catch (err) {
                errorToast(err, "Failed to delete");
            }
        }, null, "Delete", "Cancel", true);
    };

    const handleBulkDelete = () => {
        if (!selectedIds || selectedIds.size === 0) return;
        confirmAction(`Delete ${selectedIds.size} group(s)?`, async () => {
            try {
                await api.post("/admin/groups/bulk-delete/", { ids: Array.from(selectedIds) });
                successToast(`${selectedIds.size} group(s) deleted`);
                setSelectedIds(new Set());
                loadAll();
            } catch (err) {
                errorToast(err, "Bulk delete failed");
            }
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

    const openViewMembers = (group) => { setViewingGroup(group); setViewOpen(true); };

    const openManageMembers = (group) => {
        setMembersGroup(group);
        setMemberSearchTerm("");
        setAddMemberOpen(false);
        setAddMemberSearch("");
        const groupCourseIds = group.courses_detail?.map(c => c.id) ||
            (Array.isArray(group.courses) ? group.courses : (group.course ? [group.course] : []));
        setAddMemberFilterMode(groupCourseIds.length > 0 ? "COURSE_ONLY" : "ALL");
        setMembersDialogOpen(true);
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
        } catch (err) {
            errorToast(err, "Failed to remove member");
        }
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
        } catch (err) {
            errorToast(err, "Failed to add member");
        } finally {
            setAddingMember(null);
        }
    };

    const getGroupCourseIds = (g) => {
        return g.courses_detail?.map(c => c.id) ||
            (Array.isArray(g.courses) ? g.courses : (g.course ? [g.course] : []));
    };

    const filtered = groups.filter((g) => {
        const matchesSearch = !searchTerm ||
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;
        if (!filterCourse) return true;

        const groupCourseIds = getGroupCourseIds(g);
        if (filterCourse === "GENERAL") {
            return groupCourseIds.length === 0;
        }

        const selectedCourseId = parseInt(filterCourse);
        return groupCourseIds.includes(selectedCourseId);
    });

    const membersInGroup = new Set(membersGroup?.members_detail?.map(m => m.id) || []);

    // Filter students for Create / Edit modal
    const getFilteredCreateStudents = () => {
        let list = allStudents;
        if (formData.course_ids.length > 0 && createMemberFilterMode === "COURSE_ONLY") {
            list = allStudents.filter(s => {
                const sCourses = s.courses?.map(sc => sc.course?.id || sc.course) || [];
                return formData.course_ids.some(cid => sCourses.includes(cid));
            });
        }
        if (createMemberSearchTerm) {
            const term = createMemberSearchTerm.toLowerCase();
            list = list.filter(s =>
                `${s.first_name} ${s.last_name} ${s.email} ${s.username}`.toLowerCase().includes(term)
            );
        }
        return list;
    };

    // Filter students for Manage Members modal
    const getFilteredAddMembersStudents = () => {
        let list = allStudents.filter(s => !membersInGroup.has(s.id));
        const groupCourseIds = membersGroup ? getGroupCourseIds(membersGroup) : [];
        if (groupCourseIds.length > 0 && addMemberFilterMode === "COURSE_ONLY") {
            list = list.filter(s => {
                const sCourses = s.courses?.map(sc => sc.course?.id || sc.course) || [];
                return groupCourseIds.some(cid => sCourses.includes(cid));
            });
        }
        if (addMemberSearch) {
            const term = addMemberSearch.toLowerCase();
            list = list.filter(s =>
                `${s.first_name} ${s.last_name} ${s.email} ${s.username}`.toLowerCase().includes(term)
            );
        }
        return list;
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Student Groups</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Organise students into general, multi-course, or project-based groups for materials, tests, and announcements.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={openCreate}
                    sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 700, borderRadius: 2 }}
                >
                    Create Group
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                        size="small"
                        placeholder="Search groups by name or description..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        select
                        size="small"
                        label="Filter by Course"
                        value={filterCourse}
                        onChange={e => setFilterCourse(e.target.value)}
                        sx={{ minWidth: 220 }}
                    >
                        <MenuItem value="">All Groups</MenuItem>
                        <MenuItem value="GENERAL">General Groups (No Course)</MenuItem>
                        {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                    {(selectedIds?.size || 0) > 0 && (
                        <Button variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={handleBulkDelete}>
                            Delete ({selectedIds.size})
                        </Button>
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
                        <TextField
                            label="Group Name"
                            required
                            fullWidth
                            size="small"
                            placeholder="e.g. Frontend Masters, Robotics Club, Final Year Project Team"
                            value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        />
                        <TextField
                            label="Description (optional)"
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            placeholder="Brief description of this group's objective or target..."
                            value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        />

                        {/* Associated Courses (Multi-Select & Optional) */}
                        <FormControl fullWidth size="small">
                            <InputLabel id="courses-multi-label">Associated Course(s) (Optional)</InputLabel>
                            <Select
                                labelId="courses-multi-label"
                                multiple
                                label="Associated Course(s) (Optional)"
                                value={formData.course_ids}
                                open={coursesSelectOpen}
                                onOpen={() => setCoursesSelectOpen(true)}
                                onClose={() => setCoursesSelectOpen(false)}
                                onChange={(e) => {
                                    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                    setFormData(p => ({ ...p, course_ids: val }));
                                }}
                                renderValue={(selected) => {
                                    if (selected.length === 0) return <em>General / All Courses</em>;
                                    return (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((cid) => {
                                                const c = courses.find(item => item.id === cid);
                                                return <Chip key={cid} label={c?.name || `Course #${cid}`} size="small" sx={{ fontWeight: 600 }} />;
                                            })}
                                        </Box>
                                    );
                                }}
                            >
                                {courses.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        <Checkbox checked={formData.course_ids.includes(c.id)} size="small" />
                                        <Typography variant="body2">{c.name}</Typography>
                                    </MenuItem>
                                ))}
                                <Box sx={{ p: 1, position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', zIndex: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={() => setCoursesSelectOpen(false)}
                                        sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                                    >
                                        Add {formData.course_ids.length > 0 ? `(${formData.course_ids.length} selected)` : ""}
                                    </Button>
                                </Box>
                            </Select>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Optional: Leave blank for a general / cross-disciplinary group, or select one or more courses.
                            </Typography>
                        </FormControl>

                        {/* Member Selection */}
                        <FormControl fullWidth size="small">
                            <InputLabel>Add Members (optional)</InputLabel>
                            <Select
                                multiple
                                label="Add Members (optional)"
                                value={formData.member_ids}
                                onChange={e => setFormData(p => ({ ...p, member_ids: e.target.value }))}
                                renderValue={s => `${s.length} student(s) selected`}
                                open={createSelectOpen}
                                onOpen={() => setCreateSelectOpen(true)}
                                onClose={() => setCreateSelectOpen(false)}
                            >
                                <ListSubheader sx={{ pt: 1, pb: 1, zIndex: 2, bgcolor: 'background.paper' }}>
                                    <Stack spacing={1}>
                                        <TextField
                                            size="small"
                                            autoFocus
                                            placeholder="Search students by name, email..."
                                            fullWidth
                                            value={createMemberSearchTerm}
                                            onChange={e => setCreateMemberSearchTerm(e.target.value)}
                                            onKeyDown={e => e.stopPropagation()}
                                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                                        />
                                        {formData.course_ids.length > 0 && (
                                            <Stack direction="row" spacing={1}>
                                                <Chip
                                                    size="small"
                                                    label="In Selected Course(s)"
                                                    clickable
                                                    color={createMemberFilterMode === "COURSE_ONLY" ? "primary" : "default"}
                                                    variant={createMemberFilterMode === "COURSE_ONLY" ? "filled" : "outlined"}
                                                    onClick={(e) => { e.stopPropagation(); setCreateMemberFilterMode("COURSE_ONLY"); }}
                                                    sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`All Students (${allStudents.length})`}
                                                    clickable
                                                    color={createMemberFilterMode === "ALL" ? "primary" : "default"}
                                                    variant={createMemberFilterMode === "ALL" ? "filled" : "outlined"}
                                                    onClick={(e) => { e.stopPropagation(); setCreateMemberFilterMode("ALL"); }}
                                                    sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                                                />
                                            </Stack>
                                        )}
                                    </Stack>
                                </ListSubheader>

                                {getFilteredCreateStudents().length === 0 ? (
                                    <MenuItem disabled>No matching students found</MenuItem>
                                ) : (
                                    getFilteredCreateStudents().map(s => {
                                        const sCourseNames = s.courses?.map(sc => sc.course?.name || sc.course).filter(Boolean).join(", ");
                                        return (
                                            <MenuItem key={s.id} value={s.id}>
                                                <Checkbox checked={formData.member_ids.includes(s.id)} size="small" />
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{s.first_name} {s.last_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {s.email} {sCourseNames ? `· [${sCourseNames}]` : ""}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        );
                                    })
                                )}

                                <Box sx={{ p: 1, position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', zIndex: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={() => setCreateSelectOpen(false)}
                                        sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                                    >
                                        Done Selecting ({formData.member_ids.length})
                                    </Button>
                                </Box>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                    >
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
                                onClick={() => {
                                    setAddMemberOpen(true);
                                    setAddMemberSearch("");
                                }}
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

                                <Stack spacing={1} sx={{ mb: 1.5 }}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="Search by name, email, or student ID..."
                                        value={addMemberSearch}
                                        onChange={e => setAddMemberSearch(e.target.value)}
                                        autoFocus
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                                    />
                                    {membersGroup && getGroupCourseIds(membersGroup).length > 0 && (
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                size="small"
                                                label="In Group Course(s)"
                                                clickable
                                                color={addMemberFilterMode === "COURSE_ONLY" ? "primary" : "default"}
                                                variant={addMemberFilterMode === "COURSE_ONLY" ? "filled" : "outlined"}
                                                onClick={() => setAddMemberFilterMode("COURSE_ONLY")}
                                                sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                                            />
                                            <Chip
                                                size="small"
                                                label={`All Students (${allStudents.length})`}
                                                clickable
                                                color={addMemberFilterMode === "ALL" ? "primary" : "default"}
                                                variant={addMemberFilterMode === "ALL" ? "filled" : "outlined"}
                                                onClick={() => setAddMemberFilterMode("ALL")}
                                                sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                                            />
                                        </Stack>
                                    )}
                                </Stack>

                                <Box sx={{ maxHeight: 220, overflow: "auto", mt: 1 }}>
                                    {getFilteredAddMembersStudents().length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                            {addMemberSearch ? "No matching students found" : "All eligible students are already members"}
                                        </Typography>
                                    ) : (
                                        getFilteredAddMembersStudents().map((s, idx, arr) => {
                                            const sCourseNames = s.courses?.map(sc => sc.course?.name || sc.course).filter(Boolean).join(", ");
                                            return (
                                                <Box key={s.id}
                                                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, borderBottom: idx < arr.length - 1 ? "1px solid" : "none", borderColor: "grey.200", borderRadius: 1 }}
                                                >
                                                    <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                                                        <Typography variant="body2" fontWeight={600} noWrap>{s.first_name} {s.last_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                            {s.email} {sCourseNames ? `· [${sCourseNames}]` : ""}
                                                        </Typography>
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
                                            );
                                        })
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
