"use client";

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
} from "@mui/material";

import {
    Close,
    Edit,
    Delete,
} from "@mui/icons-material";

export default function CourseViewModal({
    open,
    onClose,
    course,
    onEdit,
    onDelete,
}) {
    if (!course) return null;

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
