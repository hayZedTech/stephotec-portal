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
                {title}

                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>

            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    py: { xs: 2.5, sm: 3 },
                    px: { xs: 2, sm: 3 },
                    overflowY: "auto",
                }}
            >
                {children}
            </DialogContent>

        </Dialog>
    );
}
