"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from "@mui/material";

import {
    Close,
} from "@mui/icons-material";

export default function StudentDialog({
    open,
    onClose,
    title,
    children,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: { xs: 2, sm: 3 },
                        m: { xs: 1, sm: 2 },
                        maxHeight: { xs: "90vh", sm: "85vh" },
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
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 2, sm: 3 },
                    fontSize: { xs: "1.125rem", sm: "1.25rem" },
                }}
            >
                {title}

                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>

            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    py: { xs: 2, sm: 3 },
                    px: { xs: 1.5, sm: 3 },
                    overflowY: "auto",
                }}
            >
                {children}
            </DialogContent>

        </Dialog>
    );
}
