"use client";

import { DataGrid } from "@mui/x-data-grid";
import { Chip, Box, Card, CardContent, Typography, Stack, useMediaQuery, useTheme } from "@mui/material";

export default function GroupMembersTable({ members = [] }) {
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
    ];

    if (isMobile) {
        return (
            <Stack spacing={2}>
                {members.map((member) => (
                    <Card key={member.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }} elevation={0}>
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
                                    {member.first_name?.charAt(0)?.toUpperCase() || "S"}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {member.first_name} {member.last_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                                        {member.email}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Student ID</Typography>
                                <Chip label={member.username} size="small" sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#e0f2fe" }} />
                            </Box>
                        </CardContent>
                    </Card>
                ))}
                {members.length === 0 && (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                        <Typography color="text.secondary">No members in this group.</Typography>
                    </Box>
                )}
            </Stack>
        );
    }

    return (
        <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
                rows={members}
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
