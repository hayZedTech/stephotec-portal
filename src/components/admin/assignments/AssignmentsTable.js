"use client";

import { DataGrid } from "@mui/x-data-grid";
import { Chip, IconButton, Button, Tooltip, Box, Card, CardContent, Typography, Stack, useMediaQuery, useTheme } from "@mui/material";
import { Visibility, Edit, Delete, PersonAdd } from "@mui/icons-material";

export default function AssignmentsTable({
    rows = [],
    courses = [],
    onView,
    onAssign,
    onEdit,
    onDelete,
    onToggleStatus,
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const getCourseName = (courseId) => {
        const c = courses.find((c) => c.id === courseId);
        return c ? c.name : "Unknown Course";
    };

    const columns = [
        {
            field: "title",
            headerName: "Title",
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600} sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                    {params.row.title}
                </Typography>
            ),
        },
        {
            field: "course",
            headerName: "Course",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                    <Chip label={getCourseName(params.row.course)} size="small" sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }} />
                </Box>
            ),
        },
        {
            field: "due_date",
            headerName: "Due Date",
            width: 120,
            renderCell: (params) => (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(params.row.due_date).toLocaleDateString()}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            width: 120,
            renderCell: (params) => (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                    <Button
                        size="small"
                        variant={params.row.status === "PUBLISHED" ? "contained" : "outlined"}
                        color={params.row.status === "PUBLISHED" ? "success" : "default"}
                        onClick={(e) => { e.stopPropagation(); onToggleStatus?.(params.row.id, params.row.status); }}
                    >
                        {params.row.status}
                    </Button>
                </Box>
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
                    <Tooltip title="View details"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onView?.(params.row); }}><Visibility fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Assign to students"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onAssign?.(params.row); }}><PersonAdd fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit?.(params.row); }}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete?.(params.row.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
                </Stack>
            ),
        },
    ];

    if (isMobile) {
        return (
            <Stack spacing={2}>
                {rows.map((row) => (
                    <Card key={row.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }} elevation={0}>
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
                                    {row.title?.charAt(0)?.toUpperCase() || "A"}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {row.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                                        Due: {new Date(row.due_date).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
                                <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>
                                    {getCourseName(row.course)}
                                </Typography>
                                <Button
                                    size="small"
                                    variant={row.status === "PUBLISHED" ? "contained" : "outlined"}
                                    color={row.status === "PUBLISHED" ? "success" : "default"}
                                    onClick={() => onToggleStatus?.(row.id, row.status)}
                                >
                                    {row.status}
                                </Button>
                            </Box>
                            
                            <Box sx={{ display: "flex", justifyContent: "flex-end", borderTop: "1px dashed", borderColor: "grey.200", pt: 2, mt: 1 }}>
                                <Stack direction="row" spacing={0.5}>
                                    <IconButton size="small" onClick={() => onView?.(row)}><Visibility fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => onAssign?.(row)}><PersonAdd fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => onEdit?.(row)}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => onDelete?.(row.id)}><Delete fontSize="small" /></IconButton>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        );
    }

    return (
        <Box sx={{ height: 600, width: "100%" }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                rowHeight={64}
                columnHeaderHeight={52}
                disableRowSelectionOnClick
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
