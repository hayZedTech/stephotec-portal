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
    Chip,
} from "@mui/material";
import {
    Close,
    ContentCopy,
    Check,
    CheckCircle,
    Email,
    OpenInNew,
    Link as LinkIcon,
    Send,
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

    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const activationLink = student.activation_url || `${origin}/activate-profile?username=${encodeURIComponent(usernameVal)}&email=${encodeURIComponent(emailVal)}`;

    // Direct Gmail Compose URL pre-filled with student email, subject, and credentials
    const emailSubject = encodeURIComponent("Welcome to Stephotec — Your Student Portal Credentials");
    const emailBody = encodeURIComponent(
`Hello ${studentName || "Student"},

Welcome to Stephotec Computer Technologies Ltd! Your official student account is ready.

Student ID / Username: ${usernameVal}
Temporary Password: ${tempPasswordVal}

Click the link below to activate your student profile and set your permanent password:
${activationLink}

Alternatively, you can visit our portal at ${origin}/login and log in using your Student ID and Temporary Password.

Best regards,
Stephotec Computer Technologies Ltd`
    );
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailVal)}&su=${emailSubject}&body=${emailBody}`;

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
            `Student Name: ${studentName || "N/A"}`,
            `Email: ${emailVal}`,
            `Student ID: ${usernameVal}`,
            `Temporary Password: ${tempPasswordVal}`,
            `Activation Link: ${activationLink}`,
        ];
        const allText = lines.join("\n");
        navigator.clipboard.writeText(allText);

        setCopiedAll(true);
        successToast("All credentials & activation link copied to clipboard!");

        setTimeout(() => {
            setCopiedAll(false);
        }, 2000);
    };

    return (
        <Dialog
            open={open}
            onClose={(e, reason) => { if (reason === 'backdropClick') return; onClose(e, reason); }}
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
                    <Typography variant="h6" fontWeight={800}>
                        Student Account Created
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 1.5 }}>
                {/* GMAIL DELIVERY STATUS ALERT */}
                <Alert
                    severity="success"
                    icon={<Email sx={{ color: "#16a34a" }} />}
                    sx={{
                        mb: 2.5,
                        borderRadius: 2.5,
                        bgcolor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        "& .MuiAlert-message": { width: "100%" },
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={800} color="#15803d">
                                Welcome Email Dispatched to Student's Gmail
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontSize: "0.82rem" }}>
                                Sent to <strong>{emailVal}</strong> with Student ID, Temporary Password, and Direct Activation Link.
                            </Typography>
                        </Box>
                        {emailVal && (
                            <Button
                                size="small"
                                variant="contained"
                                href={gmailComposeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<Send sx={{ fontSize: "0.85rem !important" }} />}
                                endIcon={<OpenInNew sx={{ fontSize: "0.75rem !important" }} />}
                                sx={{
                                    bgcolor: "#15803d",
                                    "&:hover": { bgcolor: "#166534" },
                                    fontWeight: 800,
                                    fontSize: "0.75rem",
                                    textTransform: "none",
                                    borderRadius: 1.5,
                                    px: 1.5,
                                    py: 0.6,
                                    boxShadow: "none",
                                }}
                            >
                                Open in Gmail
                            </Button>
                        )}
                    </Box>
                </Alert>

                <Stack spacing={1.8}>
                    {/* EMAIL */}
                    <Box
                        sx={{
                            p: 1.8,
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
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.3, fontSize: "0.7rem" }}
                        >
                            Email Address
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-all" }}>
                                {emailVal || "N/A"}
                            </Typography>
                            <Tooltip title={copiedMap["email"] ? "Copied!" : "Copy Email"}>
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

                    {/* USERNAME / STUDENT ID */}
                    <Box
                        sx={{
                            p: 1.8,
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
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.3, fontSize: "0.7rem" }}
                        >
                            Student ID / Username
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="body1" fontWeight={800} sx={{ fontFamily: "monospace", color: "#0f172a" }}>
                                {usernameVal || "N/A"}
                            </Typography>
                            <Tooltip title={copiedMap["username"] ? "Copied!" : "Copy Student ID"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopyIndividual("Student ID", usernameVal, "username")}
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
                            p: 1.8,
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
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.3, fontSize: "0.7rem" }}
                        >
                            Temporary Password
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="body1" fontWeight={800} sx={{ fontFamily: "monospace", color: copiedMap["password"] ? "#15803d" : "#b45309" }}>
                                {tempPasswordVal || "N/A"}
                            </Typography>
                            <Tooltip title={copiedMap["password"] ? "Copied!" : "Copy Temporary Password"}>
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

                    {/* ACTIVATION LINK */}
                    <Box
                        sx={{
                            p: 1.8,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: copiedMap["link"] ? "#16a34a" : "#3b82f6",
                            bgcolor: copiedMap["link"] ? "#f0fdf4" : "#eff6ff",
                            transition: "all 0.2s ease-in-out",
                        }}
                    >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                            <Typography
                                variant="caption"
                                color={copiedMap["link"] ? "success.main" : "#1d4ed8"}
                                fontWeight={700}
                                sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.7rem" }}
                            >
                                Direct Profile Activation Link
                            </Typography>
                            <Chip label="One-Click Setup" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 800, bgcolor: "#dbeafe", color: "#1d4ed8" }} />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="caption" fontWeight={600} sx={{ wordBreak: "break-all", color: "#1e40af", fontFamily: "monospace" }}>
                                {activationLink}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title={copiedMap["link"] ? "Copied!" : "Copy Activation Link"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopyIndividual("Activation Link", activationLink, "link")}
                                        sx={{
                                            color: copiedMap["link"] ? "#16a34a" : "#2563eb",
                                            bgcolor: copiedMap["link"] ? "#dcfce7" : "#dbeafe",
                                            "&:hover": {
                                                bgcolor: copiedMap["link"] ? "#bbf7d0" : "#bfdbfe",
                                            },
                                        }}
                                    >
                                        {copiedMap["link"] ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Open Activation Page">
                                    <IconButton
                                        size="small"
                                        component="a"
                                        href={activationLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            color: "#2563eb",
                                            bgcolor: "#dbeafe",
                                            "&:hover": { bgcolor: "#bfdbfe" },
                                        }}
                                    >
                                        <OpenInNew fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
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
                        py: 0.9,
                    }}
                >
                    {copiedAll ? "Copied All Details!" : "Copy All Details"}
                </Button>

                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        bgcolor: "#0f172a",
                        "&:hover": { bgcolor: "#1e293b" },
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3.5,
                        py: 0.9,
                    }}
                >
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
}
