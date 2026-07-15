"use client";

import { useRouter } from "next/navigation";
import { DataGrid } from "@mui/x-data-grid";
import { Chip, Avatar, IconButton, Tooltip, Box } from "@mui/material";
import { VisibilityOutlined, EditOutlined, DeleteOutlineOutlined } from "@mui/icons-material";

export default function StudentsTable({
    rows = [],
    loading = false,
    onView,
    onEdit,
    onDelete,
    onStatusClick,
    pageSize = 10,
    page,
    rowCount,
    onPageChange,
    onPageSizeChange,
    checkboxSelection = false,
    onRowSelectionChange,
}) {
    const router = useRouter();
    const columns = [
        {
            field: "student",
            headerName: "Student",
            flex: 1.8,
            sortable: false,
            filterable: false,
            align: "center",
            headerAlign: "center",
            renderCell: ({ row }) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", height: "100%" }}>
                    <Avatar sx={{ width: 42, height: 42, bgcolor: "#2563eb", flexShrink: 0 }}>
                        {row.first_name?.charAt(0)?.toUpperCase() || "S"}
                    </Avatar>
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minWidth: 0 }}>
                        <Box sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row.first_name} {row.last_name}
                        </Box>
                        <Box sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row.email}
                        </Box>
                    </Box>
                </Box>
            ),
        },
        {
            field: "username",
            headerName: "Username",
            width: 170,
            align: "center",
            headerAlign: "center",
        },
        {
            field: "course",
            headerName: "Primary Course",
            flex: 1.2,
            align: "center",
            headerAlign: "center",
            renderCell: ({ row }) => {
                const primaryCourse = row.courses?.find(c => c.is_primary);
                return (
                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <Box sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                            {primaryCourse?.course?.name || "-"}
                        </Box>
                    </Box>
                );
            },
        },
        {
            field: "training",
            headerName: "Industrial Training",
            width: 190,
            align: "center",
            headerAlign: "center",
            renderCell: ({ row }) => (
                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Chip size="small" color={row.is_industrial_training ? "success" : "default"} label={row.is_industrial_training ? "Yes" : "No"} />
                </Box>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            width: 150,
            align: "center",
            headerAlign: "center",
            renderCell: ({ row }) => (
                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => onStatusClick?.(row)}>
                    <Chip size="small" color={row.status === "ACTIVE" ? "success" : row.status === "SUSPENDED" ? "warning" : row.status === "GRADUATED" ? "info" : "default"} label={row.status || "UNKNOWN"} clickable />
                </Box>
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 170,
            sortable: false,
            filterable: false,
            align: "center",
            headerAlign: "center",
            renderCell: ({ row }) => (
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                    <Tooltip title="View">
                        <IconButton size="small" onClick={() => router.push(`/admin/students/${row.id}`)}>
                            <VisibilityOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => router.push(`/admin/students/${row.id}`)}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete?.(row)}>
                            <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            rowHeight={74}
            columnHeaderHeight={56}
            disableRowSelectionOnClick
            checkboxSelection={checkboxSelection}
            onRowSelectionModelChange={onRowSelectionChange}
            pageSizeOptions={[10, 25, 50]}
            paginationMode={page !== undefined ? "server" : "client"}
            rowCount={rowCount}
            paginationModel={page !== undefined ? { page, pageSize } : undefined}
            onPaginationModelChange={(model) => {
                onPageChange?.(model.page);
                onPageSizeChange?.(model.pageSize);
            }}
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
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within": {
                    outline: "none",
                },
            }}
        />
    );
}
