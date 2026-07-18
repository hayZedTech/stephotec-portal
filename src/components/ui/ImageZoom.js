"use client";

import { useState } from "react";
import { Dialog, Box, IconButton, Avatar } from "@mui/material";
import { Close } from "@mui/icons-material";

/**
 * Wraps an Avatar with click-to-zoom. Only zooms if `src` exists.
 * Usage: <ImageZoom src={url} alt="name" avatarProps={{ sx: {...} }}>fallback</ImageZoom>
 */
export default function ImageZoom({ src, alt = "Image", avatarProps = {}, children }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Avatar
                src={src}
                alt={alt}
                onClick={() => src && setOpen(true)}
                {...avatarProps}
                sx={{
                    ...avatarProps.sx,
                    cursor: src ? "zoom-in" : "default",
                }}
            >
                {children}
            </Avatar>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth={false}
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: "transparent",
                            boxShadow: "none",
                            borderRadius: 3,
                            overflow: "visible",
                            m: 2,
                        },
                    },
                    backdrop: { sx: { bgcolor: "rgba(0,0,0,0.85)" } },
                }}
                sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
                <Box sx={{ position: "relative", lineHeight: 0 }}>
                    <IconButton
                        onClick={() => setOpen(false)}
                        sx={{
                            position: "absolute",
                            top: -16,
                            right: -16,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "white",
                            zIndex: 1,
                            "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                        }}
                    >
                        <Close />
                    </IconButton>
                    <img
                        src={src}
                        alt={alt}
                        style={{
                            display: "block",
                            maxWidth: "90vw",
                            maxHeight: "80vh",
                            width: "auto",
                            height: "auto",
                            borderRadius: 12,
                            objectFit: "contain",
                        }}
                    />
                </Box>
            </Dialog>
        </>
    );
}
