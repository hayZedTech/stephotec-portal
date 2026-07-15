"use client";

import { DataGrid } from "@mui/x-data-grid";
import {
    Chip,
    IconButton,
    Stack,
    Tooltip,
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