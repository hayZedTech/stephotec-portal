"use client";

import { Dialog, DialogContent, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

export default function Modal({ open, onClose, children }) {
    if (!open) return null;

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
            <DialogContent
                sx={{
                    p: { xs: 2, sm: 3 },
                    position: "relative",
                }}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: { xs: 1, sm: 1.5 },
                        top: { xs: 1, sm: 1.5 },
                        color: "error.main",
                    }}
                    size="small"
                >
                    <Close />
                </IconButton>

                {children}
            </DialogContent>
        </Dialog>
    );
}
