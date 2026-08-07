"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    Stack,
    IconButton,
    Tooltip,
    Alert,
} from "@mui/material";
import {
    Close,
    ContentCopy,
    Check,
    CheckCircle,
} from "@mui/icons-material";
import { successToast } from "@/lib/toast";

export default function StudentCreatedModal({ open, onClose, student }) {
    const [copiedMap, setCopiedMap] = useState({});
    const [copiedAll, setCopiedAll] = useState(false);

    if (!student) return null;

    const studentObj = student.student_details || student;
    const studentName = `${studentObj.first_name || ""} ${studentObj.last_name || ""}`.trim();
    const emailVal = studentObj.email || student.email || "";
    const usernameVal = studentObj.username || student.username || "";
    const tempPasswordVal = student.temporary_password || studentObj.temporary_password || student.temp_password || student.password || "";

    const handleCopyIndividual = (title, value, key) => {
        if (!value) return;
        const textToCopy = `${title}: ${value}`;
        navigator.clipboard.writeText(textToCopy);
        
        setCopiedMap((prev) => ({ ...prev, [key]: true }));
        successToast(`Copied ${title} to clipboard!`);
        
        setTimeout(() => {
            setCopiedMap((prev) => ({ ...prev, [key]: false }));
        }, 2000);
    };

    const handleCopyAll = () => {
        const lines = [
            `Email: ${emailVal}`,
            `Username: ${usernameVal}`,
            `Temporary Password: ${tempPasswordVal}`,
        ];
        const allText = lines.join("\n");
        navigator.clipboard.writeText(allText);

        setCopiedAll(true);
        successToast("All 3 credentials copied to clipboard!");

        setTimeout(() => {
            setCopiedAll(false);
        }, 2000);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        p: 1,
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
                    },
                },
                backdrop: {
                    sx: {
                        backdropFilter: "blur(4px)",
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
                    pb: 1,
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircle color="success" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" fontWeight={700}>
                        Student Account Created
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 1.5 }}>
                <Alert
                    severity="success"
                    icon={false}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: "rgba(22, 163, 74, 0.08)",
                        border: "1px solid rgba(22, 163, 74, 0.2)",
                    }}
                >
                    <Typography variant="body2" color="text.primary">
                        Account credentials for <strong>{studentName || "the new student"}</strong> have been generated successfully. Copy these details and send them to the student.
                    </Typography>
                </Alert>

                <Stack spacing={2}>
                    {/* EMAIL */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: copiedMap["email"] ? "#16a34a" : "grey.300",
                            bgcolor: copiedMap["email"] ? "#f0fdf4" : "grey.50",
                            transition: "all 0.2s ease-in-out",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={700}
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}
                        >
                            Email
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="body1" fontWeight={600} sx={{ wordBreak: "break-all" }}>
                                {emailVal || "N/A"}
                            </Typography>
                            <Tooltip title={copiedMap["email"] ? "Copied with title!" : "Copy Email"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopyIndividual("Email", emailVal, "email")}
                                    sx={{
                                        color: copiedMap["email"] ? "#16a34a" : "text.secondary",
                                        bgcolor: copiedMap["email"] ? "#dcfce7" : "grey.200",
                                        "&:hover": {
                                            bgcolor: copiedMap["email"] ? "#bbf7d0" : "grey.300",
                                        },
                                    }}
                                >
                                    {copiedMap["email"] ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* USERNAME */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: copiedMap["username"] ? "#16a34a" : "grey.300",
                            bgcolor: copiedMap["username"] ? "#f0fdf4" : "grey.50",
                            transition: "all 0.2s ease-in-out",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={700}
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}
                        >
                            Username
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="body1" fontWeight={700} sx={{ fontFamily: "monospace", color: "primary.main" }}>
                                {usernameVal || "N/A"}
                            </Typography>
                            <Tooltip title={copiedMap["username"] ? "Copied with title!" : "Copy Username"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopyIndividual("Username", usernameVal, "username")}
                                    sx={{
                                        color: copiedMap["username"] ? "#16a34a" : "text.secondary",
                                        bgcolor: copiedMap["username"] ? "#dcfce7" : "grey.200",
                                        "&:hover": {
                                            bgcolor: copiedMap["username"] ? "#bbf7d0" : "grey.300",
                                        },
                                    }}
                                >
                                    {copiedMap["username"] ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* TEMPORARY PASSWORD */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: copiedMap["password"] ? "#16a34a" : "#f59e0b",
                            bgcolor: copiedMap["password"] ? "#f0fdf4" : "#fff7ed",
                            transition: "all 0.2s ease-in-out",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color={copiedMap["password"] ? "success.main" : "#b45309"}
                            fontWeight={700}
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}
                        >
                            Temporary Password
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="body1" fontWeight={700} sx={{ fontFamily: "monospace", color: copiedMap["password"] ? "#15803d" : "#b45309" }}>
                                {tempPasswordVal || "N/A"}
                            </Typography>
                            <Tooltip title={copiedMap["password"] ? "Copied with title!" : "Copy Temporary Password"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopyIndividual("Temporary Password", tempPasswordVal, "password")}
                                    sx={{
                                        color: copiedMap["password"] ? "#16a34a" : "#b45309",
                                        bgcolor: copiedMap["password"] ? "#dcfce7" : "#ffedd5",
                                        "&:hover": {
                                            bgcolor: copiedMap["password"] ? "#bbf7d0" : "#fed7aa",
                                        },
                                    }}
                                >
                                    {copiedMap["password"] ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, justifyContent: "space-between" }}>
                <Button
                    variant="outlined"
                    startIcon={copiedAll ? <Check /> : <ContentCopy />}
                    onClick={handleCopyAll}
                    color={copiedAll ? "success" : "primary"}
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2.5,
                        py: 1,
                    }}
                >
                    {copiedAll ? "Copied All (3)!" : "Copy All (3)"}
                </Button>

                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        py: 1,
                    }}
                >
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
}
