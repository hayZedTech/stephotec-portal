"use client";

import { useState, useEffect } from "react";
import {
    Box, Paper, Typography, Stack, Chip, CircularProgress,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Accordion, AccordionSummary, AccordionDetails, Avatar,
} from "@mui/material";
import { ExpandMore, People, School } from "@mui/icons-material";
import api from "@/lib/axios";
import { errorToast } from "@/lib/toast";
import GroupMembersTable from "@/components/dashboard/groups/GroupMembersTable";

export default function MyGroupsPage() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                setLoading(true);
                const res = await api.get("/admin/groups/my-groups/");
                setGroups(res.data.results || res.data || []);
            } catch (err) {
                errorToast(err, "Failed to load your groups");
            } finally {
                setLoading(false);
            }
        };
        loadGroups();
    }, []);

    if (loading) {
        return <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800}>My Groups</Typography>
                <Typography variant="body2" color="text.secondary">Groups you have been assigned to by your administrator.</Typography>
            </Box>

            {groups.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: "center", borderRadius: 3 }}>
                    <People sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">You are not in any group yet.</Typography>
                    <Typography variant="body2" color="text.disabled" mt={1}>Your administrator will add you to a group when one is created for your course.</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {groups.map(group => (
                        <Paper key={group.id} sx={{ borderRadius: 3, overflow: "hidden" }}>
                            <Accordion disableGutters elevation={0}>
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: { xs: 2, sm: 3 }, py: 1.5, bgcolor: "#0f172a", color: "white", "& .MuiAccordionSummary-expandIconWrapper": { color: "white" } }}>
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: { xs: 1.5, sm: 2 }, flex: 1, minWidth: 0 }}>
                                        <Avatar sx={{ bgcolor: "#1e40af", width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, mt: 0.5, flexShrink: 0 }}>
                                            <People fontSize="small" />
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography fontWeight={800} variant="body1" sx={{ wordBreak: "break-word", lineHeight: 1.3, mb: 0.5 }}>{group.name}</Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                <Chip icon={<School sx={{ fontSize: "1rem !important" }} />} label={group.course_name} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, "& .MuiChip-icon": { color: "white" } }} />
                                                <Chip icon={<People sx={{ fontSize: "1rem !important" }} />} label={`${group.member_count} member(s)`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, "& .MuiChip-icon": { color: "white" } }} />
                                            </Box>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0 }}>
                                    {group.description && (
                                        <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "grey.200" }}>
                                            <Typography variant="body2" color="text.secondary">{group.description}</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ p: { xs: 0, md: 2 } }}>
                                        <GroupMembersTable members={group.members_detail || []} />
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
