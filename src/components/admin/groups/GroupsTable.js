"use client";

import { DataGrid } from "@mui/x-data-grid";
import { Chip, IconButton, Tooltip, Box, Card, CardContent, Typography, Stack, useMediaQuery, useTheme } from "@mui/material";
import { People, PersonAdd, Edit, Delete } from "@mui/icons-material";

export default function GroupsTable({
    rows = [],
    loading = false,
    courses = [],
    onViewMembers,
    onManageMembers,
    onEdit,
    onDelete,
    selectedIds = new Set(),
    onRowSelectionChange
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const getCourseName = (courseId) => {
        const c = courses.find((c) => c.id === courseId);
        return c ? c.name : "Unknown Course";
    };

    const columns = [
        {
            field: "name",
            headerName: "Group Name",
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                    <Typography fontWeight={700} variant="body2">{params.row.name}</Typography>
                    {params.row.description && <Typography variant="caption" color="text.secondary">{params.row.description}</Typography>}
                </Box>
            ),
        },
        {
            field: "course",
            headerName: "Course",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Chip label={getCourseName(params.row.course)} size="small" sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }} />
            ),
        },
        {
            field: "member_count",
            headerName: "Members",
            width: 120,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => (
                <Chip 
                    icon={<People fontSize="small" />} 
                    label={params.row.member_count ?? 0} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    onClick={(e) => { e.stopPropagation(); onViewMembers?.(params.row); }} 
                    sx={{ fontWeight: 700, cursor: "pointer" }} 
                />
            ),
        },
        {
            field: "created_at",
            headerName: "Created",
            width: 120,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">{new Date(params.row.created_at).toLocaleDateString()}</Typography>
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 180,
            align: "right",
            headerAlign: "right",
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end", height: "100%", alignItems: "center" }}>
                    <Tooltip title="View Members"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onViewMembers?.(params.row); }}><People fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Manage Members"><IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onManageMembers?.(params.row); }}><PersonAdd fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit?.(params.row); }}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete?.(params.row); }}><Delete fontSize="small" /></IconButton></Tooltip>
                </Stack>
            ),
        },
    ];

    if (isMobile) {
        return (
            <Stack spacing={2}>
                {rows.map((row) => (
                    <Card key={row.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                        <CardContent sx={{ pb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        bgcolor: "#2563eb",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: 18,
                                        flexShrink: 0
                                    }}
                                >
                                    {row.name?.charAt(0)?.toUpperCase() || "G"}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {row.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                                        {row.description || "No description"}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack spacing={1.5} sx={{ mb: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Course</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>
                                        {getCourseName(row.course)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Members</Typography>
                                    <Chip 
                                        icon={<People fontSize="small" />} 
                                        label={row.member_count ?? 0} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined" 
                                        onClick={(e) => { e.stopPropagation(); onViewMembers?.(row); }} 
                                        sx={{ fontWeight: 700, cursor: "pointer" }} 
                                    />
                                </Box>
                            </Stack>

                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                                <Tooltip title="View Members"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onViewMembers?.(row); }}><People fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Manage Members"><IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onManageMembers?.(row); }}><PersonAdd fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit?.(row); }}><Edit fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete?.(row); }}><Delete fontSize="small" /></IconButton></Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
                {rows.length === 0 && !loading && (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography color="text.secondary">No groups found.</Typography>
                    </Box>
                )}
            </Stack>
        );
    }

    return (
        <Box sx={{ height: 720, width: "100%" }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.id}
                rowHeight={64}
                columnHeaderHeight={52}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={onRowSelectionChange}
                rowSelectionModel={selectedIds ? Array.from(selectedIds) : []}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 10,
                            page: 0,
                        },
                    },
                }}
                sx={{
                    border: 0,
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e5e7eb",
                        fontWeight: 700,
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                        fontWeight: 700,
                    },
                    "& .MuiDataGrid-row": {
                        borderBottom: "1px solid #f1f5f9",
                    },
                    "& .MuiDataGrid-cell": {
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "1px solid #e5e7eb",
                        py: 0,
                    },
                    "& .MuiDataGrid-footerContainer": {
                        borderTop: "1px solid #e5e7eb",
                        backgroundColor: "#f8fafc",
                    },
                    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within": {
                        outline: "none",
                    },
                }}
            />
        </Box>
    );
}
