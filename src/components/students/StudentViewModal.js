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
            maxWidth="md"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 4,
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
                    py: 2,
                    px: 3,
                }}
            >
                Student Details
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ py: 0 }}>
                {/* Avatar and Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, p: 3, pb: 0 }}>
                    <Avatar
                        src={student.profile_picture_url}
                        sx={{
                            width: 64,
                            height: 64,
                            bgcolor: "#2563eb",
                            fontSize: 24,
                            fontWeight: 700,
                        }}
                    >
                        {student.first_name?.charAt(0)?.toUpperCase() || "S"}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            {student.first_name} {student.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {student.username}
                        </Typography>
                    </Box>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: "divider", px: 3, mt: 2 }}
                >
                    <Tab label="Info" />
                    <Tab label="Courses" />
                    <Tab label="Learning Content" />
                    <Tab label="Assignments" />
                    <Tab label="Certificates" />
                    <Tab label="Handouts" />
                </Tabs>

                {/* Tab Content */}
                <Box sx={{ p: 3 }}>
                    {/* Info Tab */}
                    {tabValue === 0 && (
                        <Box>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Full Name
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {fullName}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Username
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.username || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>
                                        {student.email || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Phone
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.phone || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Additional Phone
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.additional_phone || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Admission Year
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.admission_year || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Primary Course
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {primaryCourse}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
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

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
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

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Gender
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.gender || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Date of Birth
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.date_of_birth || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        State of Origin
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.state_of_origin || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Courses
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {courseNames.length ? courseNames.join(", ") : "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" }, p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Address
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.address || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" }, p: 2, borderRadius: 2, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Bio
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {student.bio || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" }, p: 2, borderRadius: 2, border: "1px solid", borderColor: temporaryPassword ? "#f59e0b" : "grey.200", bgcolor: temporaryPassword ? "#fff7ed" : "grey.50" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                        Temporary Password
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: temporaryPassword ? "#b45309" : "text.secondary" }}>
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

            <DialogActions sx={{ p: 2, gap: 1 }}>
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
