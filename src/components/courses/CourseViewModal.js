"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    TextField,
    Button,
    Chip,
    IconButton,
    Box,
    ToggleButtonGroup,
    ToggleButton,
    Typography,
} from "@mui/material";

import {
    Close,
    Edit,
    Delete,
} from "@mui/icons-material";

export function formatDuration(val, unit, viewMode) {
    if (!val || val <= 0) return "N/A";
    const num = Number(val);
    if (unit === "WEEKS") {
        if (viewMode === "WEEKS") {
            return `${num} ${num === 1 ? "Week" : "Weeks"}`;
        }
        // View mode MONTHS
        const months = Math.floor(num / 4);
        const remWeeks = num % 4;
        if (months === 0) return `${remWeeks} ${remWeeks === 1 ? "Week" : "Weeks"}`;
        if (remWeeks === 0) return `${months} ${months === 1 ? "Month" : "Months"}`;
        return `${months} ${months === 1 ? "Month" : "Months"} ${remWeeks} ${remWeeks === 1 ? "Week" : "Weeks"}`;
    } else {
        // unit === "MONTHS"
        if (viewMode === "MONTHS") {
            return `${num} ${num === 1 ? "Month" : "Months"}`;
        }
        // View mode WEEKS
        const totalWeeks = num * 4;
        return `${totalWeeks} ${totalWeeks === 1 ? "Week" : "Weeks"}`;
    }
}

export default function CourseViewModal({
    open,
    onClose,
    course,
    onEdit,
    onDelete,
}) {
    const [viewUnit, setViewUnit] = useState("MONTHS");

    if (!course) return null;

    const formattedDuration = formatDuration(course.duration_value, course.duration_unit, viewUnit);

    return (
        <Dialog
            open={open}
            onClose={(e, reason) => { if (reason === 'backdropClick') return; onClose(e, reason); }}
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
                Course Details

                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Course Name"
                            value={course.name}
                            fullWidth
                            slotProps={{
                                input: {
                                    readOnly: true,
                                },
                            }}
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Code Prefix"
                            value={course.code_prefix}
                            fullWidth
                            slotProps={{
                                input: {
                                    readOnly: true,
                                },
                            }}
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Students"
                            value={course.student_count}
                            fullWidth
                            slotProps={{
                                input: {
                                    readOnly: true,
                                },
                            }}
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ border: "1px solid #e2e8f0", p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                    Duration
                                </Typography>
                                <Typography variant="body1" fontWeight={700} color="primary">
                                    {formattedDuration}
                                </Typography>
                            </Box>
                            <ToggleButtonGroup
                                value={viewUnit}
                                exclusive
                                onChange={(e, newUnit) => { if (newUnit) setViewUnit(newUnit); }}
                                size="small"
                            >
                                <ToggleButton value="MONTHS" sx={{ px: 1.5, py: 0.5, fontWeight: 700, fontSize: "0.75rem" }}>
                                    Months View
                                </ToggleButton>
                                <ToggleButton value="WEEKS" sx={{ px: 1.5, py: 0.5, fontWeight: 700, fontSize: "0.75rem" }}>
                                    Weeks View
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Chip
                            color={
                                course.is_active
                                    ? "success"
                                    : "default"
                            }
                            label={
                                course.is_active
                                    ? "ACTIVE"
                                    : "INACTIVE"
                            }
                            sx={{
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1, display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={onClose} size="small">
                    Close
                </Button>

                <Button
                    startIcon={<Edit />}
                    variant="outlined"
                    onClick={() => onEdit(course)}
                    size="small"
                >
                    Edit
                </Button>

                <Button
                    color="error"
                    variant="contained"
                    startIcon={<Delete />}
                    onClick={() => onDelete(course)}
                    size="small"
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}
