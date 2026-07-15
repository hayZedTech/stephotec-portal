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
}) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [tabValue, setTabValue] = useState(0);

    if (!student) return null;

    const handleCoursesUpdated = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
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
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Email
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {student.email}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Admission Year
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {student.admission_year}
                                    </Typography>
                                </Box>

                                {student.temporary_password && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Temporary Password
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, fontFamily: "monospace", fontWeight: 600, color: "#dc2626" }}>
                                            {student.temporary_password}
                                        </Typography>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
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
                                        />
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
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

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose}>Close</Button>

                {student.status !== "GRADUATED" && student.status !== "WITHDRAWN" && (
                    <>
                        <Button
                            variant="outlined"
                            color={student.status === "ACTIVE" ? "warning" : "success"}
                            onClick={() => onDeactivate?.(student)}
                        >
                            {student.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                            variant="contained"
                            onClick={() => onEdit?.(student)}
                        >
                            Edit
                        </Button>
                    </>
                )}

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
