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
                }}
            >
                Course Details

                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
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
                        />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <TextField
                            label="Code Prefix"
                            value={course.code_prefix}
                            fullWidth
                            slotProps={{
                                input: {
                                    readOnly: true,
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <TextField
                            label="Students"
                            value={course.student_count}
                            fullWidth
                            slotProps={{
                                input: {
                                    readOnly: true,
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
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>
                    Close
                </Button>

                <Button
                    startIcon={<Edit />}
                    variant="outlined"
                    onClick={() => onEdit(course)}
                >
                    Edit
                </Button>

                <Button
                    color="error"
                    variant="contained"
                    startIcon={<Delete />}
                    onClick={() => onDelete(course)}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}