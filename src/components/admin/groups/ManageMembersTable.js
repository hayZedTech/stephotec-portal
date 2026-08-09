"use client";

import { DataGrid } from "@mui/x-data-grid";
import { Chip, Box, Card, CardContent, Typography, Stack, useMediaQuery, useTheme } from "@mui/material";
import { PersonAdd, PersonRemove } from "@mui/icons-material";

export default function ManageMembersTable({ students = [], membersInGroup = new Set(), onToggleMember }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const columns = [
        {
            field: "username",
            headerName: "Student ID",
            width: 150,
            renderCell: (params) => (
                <Chip label={params.row.username} size="small" sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#e0f2fe" }} />
            ),
        },
        {
            field: "name",
            headerName: "Name",
            flex: 1,
            minWidth: 150,
            valueGetter: (params, row) => `${row.first_name} ${row.last_name}`,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>{params.row.first_name} {params.row.last_name}</Typography>
            ),
        },
        {
            field: "email",
            headerName: "Email",
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">{params.row.email}</Typography>
            ),
        },
        {
            field: "action",
            headerName: "Action",
            width: 120,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => {
                const isMember = membersInGroup.has(params.row.id);
                return (
                    <Chip 
                        label={isMember ? "Remove" : "Add"} 
                        color={isMember ? "error" : "primary"} 
                        size="small"
                        icon={isMember ? <PersonRemove fontSize="small" /> : <PersonAdd fontSize="small" />}
                        onClick={() => onToggleMember?.(params.row.id, isMember)} 
                        sx={{ fontWeight: 700, cursor: "pointer" }} 
                    />
                );
            },
        },
    ];



    return (
        <Box sx={{ height: 400, width: "100%" }}>
            <DataGrid
                rows={students}
                columns={columns}
                getRowId={(row) => row.id}
                rowHeight={64}
                columnHeaderHeight={52}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25]}
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
                }}
            />
        </Box>
    );
}
