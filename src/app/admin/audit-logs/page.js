"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    Button,
    CircularProgress,
    Alert,
    TablePagination,
    Typography,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { getAuditLogs } from "@/services/auditLogs";

const ACTION_COLORS = {
    CREATE: "success",
    UPDATE: "warning",
    DELETE: "error",
    LOGIN: "info",
    LOGOUT: "default",
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        action: "",
    });

    useEffect(() => {
        loadLogs();
    }, [filters]);

    async function loadLogs() {
        try {
            setLoading(true);
            setError(null);
            const data = await getAuditLogs(filters);
            setLogs(data);
            setPage(0);
        } catch (err) {
            setError(err.message || "Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const paginatedLogs = logs.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 6 } }}>
            {/* LOADING OVERLAY */}
            {loading && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        backdropFilter: "blur(2px)",
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <CircularProgress size={48} />
                        <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                            Loading audit logs...
                        </Typography>
                    </Box>
                </Box>
            )}

            <Card sx={{ mb: 0 }}>
                <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                                md: "1fr auto",
                            },
                            gap: { xs: 2, sm: 3 },
                        }}
                    >
                        <TextField
                            select
                            label="Action"
                            value={filters.action}
                            onChange={(e) =>
                                handleFilterChange("action", e.target.value)
                            }
                            size="small"
                            fullWidth
                        >
                            <MenuItem value="">All Actions</MenuItem>
                            <MenuItem value="LOGIN">Login</MenuItem>
                            <MenuItem value="LOGOUT">Logout</MenuItem>
                            <MenuItem value="CREATE">Create</MenuItem>
                            <MenuItem value="UPDATE">Update</MenuItem>
                            <MenuItem value="DELETE">Delete</MenuItem>
                        </TextField>

                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={loadLogs}
                            disabled={loading}
                            size="small"
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>
            </Card>

            {error && <Alert severity="error">{error}</Alert>}

            <Card>
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: 400,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                            User
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                            Action
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                            Path
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                            Changes
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                            Date & Time
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedLogs.length > 0 ? (
                                        paginatedLogs.map((log) => (
                                            <TableRow
                                                key={log.id}
                                                sx={{
                                                    "&:hover": {
                                                        backgroundColor: "#f9fafb",
                                                    },
                                                }}
                                            >
                                                <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                                    <Box>
                                                        <div
                                                            style={{
                                                                fontWeight: 500,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {log.actor_username}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "0.75rem",
                                                                color: "#6b7280",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {log.actor_email}
                                                        </div>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, p: { xs: 1, sm: 1.5 } }}>
                                                    <Chip
                                                        label={log.action_display}
                                                        color={
                                                            ACTION_COLORS[
                                                                log.action
                                                            ] || "default"
                                                        }
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        maxWidth: { xs: 100, sm: 200 },
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                                        p: { xs: 1, sm: 1.5 },
                                                    }}
                                                    title={log.path}
                                                >
                                                    {log.path || "N/A"}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        maxWidth: { xs: 100, sm: 200 },
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                                        p: { xs: 1, sm: 1.5 },
                                                    }}
                                                    title={JSON.stringify(log.changes)}
                                                >
                                                    {log.changes
                                                        ? JSON.stringify(log.changes).substring(0, 50)
                                                        : "N/A"}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                                        whiteSpace: "nowrap",
                                                        p: { xs: 1, sm: 1.5 },
                                                    }}
                                                >
                                                    {new Date(
                                                        log.timestamp
                                                    ).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        second: "2-digit",
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                sx={{
                                                    textAlign: "center",
                                                    py: 4,
                                                    color: "#9ca3af",
                                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                                }}
                                            >
                                                No audit logs found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={logs.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{
                                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    m: 0,
                                },
                                "& .MuiTablePagination-select": {
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                },
                            }}
                        />
                    </>
                )}
            </Card>
        </Box>
    );
}
