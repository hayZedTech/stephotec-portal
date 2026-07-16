"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

export default function ConfirmDialog({
    open,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: { xs: 2, sm: 3 },
                        m: { xs: 1, sm: 2 },
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
                    fontSize: { xs: "1.125rem", sm: "1.25rem" },
                }}
            >
                {title}
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
                <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    {message}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1, display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={onClose} size="small">
                    {cancelText}
                </Button>

                <Button
                    variant="contained"
                    color={isDangerous ? "error" : "primary"}
                    onClick={onConfirm}
                    size="small"
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
