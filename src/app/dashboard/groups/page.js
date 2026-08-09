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
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1.5, bgcolor: "#0f172a", color: "white", "& .MuiAccordionSummary-expandIconWrapper": { color: "white" } }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                        <Avatar sx={{ bgcolor: "#1e40af", width: 40, height: 40 }}>
                                            <People fontSize="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography fontWeight={800} variant="body1">{group.name}</Typography>
                                            <Stack direction="row" spacing={1} mt={0.3}>
                                                <Chip icon={<School fontSize="small" />} label={group.course_name} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, "& .MuiChip-icon": { color: "white" } }} />
                                                <Chip icon={<People fontSize="small" />} label={`${group.member_count} member(s)`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, "& .MuiChip-icon": { color: "white" } }} />
                                            </Stack>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0 }}>
                                    {group.description && (
                                        <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "grey.200" }}>
                                            <Typography variant="body2" color="text.secondary">{group.description}</Typography>
                                        </Box>
                                    )}
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(group.members_detail || []).map(member => (
                                                    <TableRow key={member.id} hover>
                                                        <TableCell>
                                                            <Chip label={member.username} size="small" sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#e0f2fe" }} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>{member.first_name} {member.last_name}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">{member.email}</Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(group.members_detail || []).length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: "text.disabled" }}>No members in this group.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
