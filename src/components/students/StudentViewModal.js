"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Button,
    Box,
    Typography,
    Chip,
    Avatar,
    Tabs,
    Tab,
    Menu,
    MenuItem,
} from "@mui/material";

import { Close } from "@mui/icons-material";
import StudentCoursesManager from "./StudentCoursesManager";
import StudentContentAssignment from "./StudentContentAssignment";

export default function StudentViewModal({
    open,
    onClose,
    student,
    onEdit,
    onDelete,
    onDeactivate,
    onStatusChange,
}) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);

    if (!student) return null;

    const fullName = [student.first_name, student.last_name].filter(Boolean).join(" ").trim() || "—";
    const primaryCourse = student.courses?.find((course) => course.is_primary)?.course?.name || "—";
    const courseNames = student.courses?.map((course) => course.course?.name).filter(Boolean) || [];
    const temporaryPassword = student.temporary_password || student.temp_password || "";

    const handleCoursesUpdated = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleStatusClick = (event) => {
        setStatusMenuAnchor(event.currentTarget);
    };

    const closeStatusMenu = () => {
        setStatusMenuAnchor(null);
    };

    const handleStatusMenuChange = (newStatus) => {
        onStatusChange?.(student.id, newStatus);
        closeStatusMenu();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: { xs: 2, sm: 3 },
                        m: { xs: 1, sm: 2 },
                        maxHeight: { xs: "95vh", sm: "90vh" },
                        width: { xs: "calc(100% - 16px)", sm: "auto" },
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    py: { xs: 2, sm: 2.5 },
                    px: { xs: 2, sm: 3 },
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
            >
                Student Details
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ py: 0, px: { xs: 1.5, sm: 3 } }}>
                {/* Avatar and Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, mb: 3, p: { xs: 2, sm: 3 }, pb: 0 }}>
                    <Avatar
                        src={student.profile_picture_url}
                        sx={{
                            width: { xs: 56, sm: 64 },
                            height: { xs: 56, sm: 64 },
                            bgcolor: "#2563eb",
                            fontSize: { xs: 20, sm: 24 },
                            fontWeight: 700,
                        }}
                    >
                        {student.first_name?.charAt(0)?.toUpperCase() || "S"}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                            {student.first_name} {student.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            {student.username}
                        </Typography>
                    </Box>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        px: { xs: 2, sm: 3 },
                        mt: 2,
                        "& .MuiTab-root": {
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            minHeight: { xs: 40, sm: 48 },
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 1, sm: 2 },
                            textTransform: "none",
                            fontWeight: 500,
                        },
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Info" />
                    <Tab label="Courses" />
                    <Tab label="Learning" />
                    <Tab label="Assignments" />
                    <Tab label="Certificates" />
                    <Tab label="Handouts" />
                </Tabs>

                {/* Tab Content */}
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* Info Tab */}
                    {tabValue === 0 && (
                        <Box>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: { xs: 1.5, sm: 2 } }}>
                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Full Name
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {fullName}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Username
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.username || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word", fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.email || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Phone
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.phone || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Additional Phone
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.additional_phone || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Admission Year
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.admission_year || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Primary Course
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {primaryCourse}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Status
                                    </Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                            size="small"
                                            color={
                                                student.status === "ACTIVE"
                                                    ? "success"
                                                    : student.status === "SUSPENDED"
                                                    ? "warning"
                                                    : student.status === "GRADUATED"
                                                    ? "info"
                                                    : "default"
                                            }
                                            label={student.status || "UNKNOWN"}
                                            onClick={handleStatusClick}
                                            clickable
                                            sx={{ cursor: "pointer" }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Industrial Training
                                    </Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                            size="small"
                                            color={student.is_industrial_training ? "success" : "default"}
                                            label={student.is_industrial_training ? "Yes" : "No"}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Gender
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.gender || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Date of Birth
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.date_of_birth || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        State of Origin
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.state_of_origin || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Courses
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {courseNames.length ? courseNames.join(", ") : "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" }, p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Address
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.address || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" }, p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Bio
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                        {student.bio || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" }, p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid", borderColor: temporaryPassword ? "#f59e0b" : "grey.200", bgcolor: temporaryPassword ? "#fff7ed" : "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                                        Temporary Password
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: temporaryPassword ? "#b45309" : "text.secondary", fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                        {temporaryPassword || "No temporary password available."}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Courses Tab */}
                    {tabValue === 1 && (
                        <StudentCoursesManager
                            key={refreshKey}
                            studentId={student.id}
                            admissionYear={student.admission_year}
                            onCoursesUpdated={handleCoursesUpdated}
                        />
                    )}

                    {/* Learning Content Tab */}
                    {tabValue === 2 && (
                        <StudentContentAssignment
                            studentId={student.id}
                            contentType="Learning Content"
                            fetchFunction={async (id) => {
                                return [];
                            }}
                            assignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                            unassignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                        />
                    )}

                    {/* Assignments Tab */}
                    {tabValue === 3 && (
                        <StudentContentAssignment
                            studentId={student.id}
                            contentType="Assignments"
                            fetchFunction={async (id) => {
                                return [];
                            }}
                            assignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                            unassignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                        />
                    )}

                    {/* Certificates Tab */}
                    {tabValue === 4 && (
                        <StudentContentAssignment
                            studentId={student.id}
                            contentType="Certificates"
                            fetchFunction={async (id) => {
                                return [];
                            }}
                            assignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                            unassignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                        />
                    )}

                    {/* Handouts Tab */}
                    {tabValue === 5 && (
                        <StudentContentAssignment
                            studentId={student.id}
                            contentType="Handouts"
                            fetchFunction={async (id) => {
                                return [];
                            }}
                            assignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                            unassignFunction={async (studentId, itemId) => {
                                // API call placeholder
                            }}
                        />
                    )}
                </Box>
            </DialogContent>

            {/* STATUS MENU */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={closeStatusMenu}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            minWidth: 200,
                            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                        },
                    },
                    backdrop: {
                        sx: {
                            backgroundColor: "rgba(0, 0, 0, 0.2)",
                        },
                    },
                }}
            >
                <MenuItem
                    onClick={() => handleStatusMenuChange("ACTIVE")}
                    sx={{
                        py: 1.5,
                        px: 2,
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        "&:hover": { bgcolor: "#f0f9ff" },
                    }}
                >
                    <Chip size="small" label="ACTIVE" color="success" variant="filled" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleStatusMenuChange("SUSPENDED")}
                    sx={{
                        py: 1.5,
                        px: 2,
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        "&:hover": { bgcolor: "#fffbeb" },
                    }}
                >
                    <Chip size="small" label="SUSPENDED" color="warning" variant="filled" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleStatusMenuChange("GRADUATED")}
                    sx={{
                        py: 1.5,
                        px: 2,
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        "&:hover": { bgcolor: "#f0f9ff" },
                    }}
                >
                    <Chip size="small" label="GRADUATED" color="info" variant="filled" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleStatusMenuChange("INACTIVE")}
                    sx={{
                        py: 1.5,
                        px: 2,
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        "&:hover": { bgcolor: "#f3f4f6" },
                    }}
                >
                    <Chip size="small" label="INACTIVE" variant="filled" />
                </MenuItem>
            </Menu>

            <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1, display: "flex", justifyContent: "flex-end" }}>
                <Button
                    variant="contained"
                    onClick={() => onEdit?.(student)}
                >
                    Edit
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    onClick={() => onDelete?.(student)}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}
