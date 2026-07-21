"use client";

import { DataGrid } from "@mui/x-data-grid";
import {
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Card,
    CardContent,
    Typography,
    Box,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    VisibilityOutlined,
    EditOutlined,
    DeleteOutlineOutlined,
} from "@mui/icons-material";

export default function CoursesTable({
    rows = [],
    loading = false,
    onView,
    onEdit,
    onDelete,
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const columns = [
        {
            field: "name",
            headerName: "Course Name",
            flex: 1.8,
            minWidth: 250,
            headerAlign: "center",
            renderCell: ({ value }) => (
                <div
                    style={{
                        fontWeight: 600,
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {value}
                </div>
            ),
        },
        {
            field: "code_prefix",
            headerName: "Code",
            width: 120,
            align: "center",
            headerAlign: "center",
        },
        {
            field: "default_fee",
            headerName: "Default Fee",
            width: 160,
            align: "center",
            headerAlign: "center",
            renderCell: ({ value }) => (
                <Typography variant="body2" fontWeight={600} sx={{ color: value > 0 ? "#2563eb" : "text.disabled" }}>
                    {value > 0
                        ? Number(value).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })
                        : "—"}
                </Typography>
            ),
        },
        {
            field: "student_count",
            headerName: "Students",
            width: 120,
            align: "center",
            headerAlign: "center",
        },
        {
            field: "is_active",
            headerName: "Status",
            width: 140,
            align: "center",
            headerAlign: "center",
            renderCell: ({ value }) => (
                <Chip
                    size="small"
                    color={value ? "success" : "default"}
                    label={value ? "ACTIVE" : "INACTIVE"}
                />
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 160,
            align: "center",
            headerAlign: "center",
            sortable: false,
            filterable: false,
            renderCell: ({ row }) => (
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View">
                        <IconButton size="small" onClick={() => onView?.(row)}>
                            <VisibilityOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit?.(row)}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete?.(row)}
                        >
                            <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    const renderMobileCards = () => (
        <Stack spacing={2}>
            {rows.map((row) => (
                <Card key={row.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                    <CardContent sx={{ pb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={2}>
                            {row.name}
                        </Typography>

                        <Stack spacing={1.5} sx={{ mb: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Code
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {row.code_prefix}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Default Fee
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ color: row.default_fee > 0 ? "#2563eb" : "text.disabled" }}>
                                    {row.default_fee > 0
                                        ? Number(row.default_fee).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })
                                        : "—"}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Students
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {row.student_count}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Status
                                </Typography>
                                <Chip
                                    size="small"
                                    color={row.is_active ? "success" : "default"}
                                    label={row.is_active ? "ACTIVE" : "INACTIVE"}
                                />
                            </Box>
                        </Stack>

                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Tooltip title="View">
                                <IconButton size="small" onClick={() => onView?.(row)}>
                                    <VisibilityOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => onEdit?.(row)}>
                                    <EditOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDelete?.(row)}
                                >
                                    <DeleteOutlineOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );

    if (isMobile) {
        return renderMobileCards();
    }

    return (
        <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
                pagination: {
                    paginationModel: {
                        page: 0,
                        pageSize: 10,
                    },
                },
            }}
            sx={{
                border: 0,
                "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#f8fafc",
                    fontWeight: 700,
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 700,
                    justifyContent: "center",
                },
                "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                },
                "& .MuiDataGrid-cell:first-of-type": {
                    justifyContent: "flex-start",
                },
                "& .MuiDataGrid-row": {
                    minHeight: "58px !important",
                    maxHeight: "58px !important",
                },
            }}
        />
    );
}