"use client";

import { useRef, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Avatar,
    IconButton,
    CircularProgress,
    Stack,
} from "@mui/material";
import {
    Close,
    Download,
    Print,
    VerifiedUser,
    AdminPanelSettings,
} from "@mui/icons-material";

export default function StaffIDCardModal({ open, onClose, staff }) {
    const cardRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    if (!staff) return null;

    const fullName =
        [staff.first_name, staff.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || staff.username || "Staff Member";

    const username = staff.username || "STAFF0001";
    const roleTitle = staff.role_title || "System Administrator & Academic Staff";
    const email = staff.email || "info@stephotec.com";
    const profilePic = staff.profile_picture_url || staff.profilePictureUrl;

    const origin = typeof window !== "undefined" ? window.location.origin : "https://stephotec.com";
    const qrData = encodeURIComponent(`${origin}/verify-staff?staff=${username}`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}&color=0f172a`;

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            const element = cardRef.current;
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: null,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = 85.6; // Standard credit card width in mm
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            const x = (210 - pdfWidth) / 2; // Center horizontally on A4
            const y = 30;

            pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight);
            pdf.save(`${username}_Staff_ID_Card.pdf`);
        } catch (error) {
            console.error("Failed to generate Staff ID PDF:", error);
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => {
        const element = cardRef.current;
        if (!element) return;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
                <head>
                    <title>Staff ID Card - ${fullName}</title>
                    <style>
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        body {
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            background: #ffffff;
                            font-family: sans-serif;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            body { background: none; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${element.outerHTML}
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography fontWeight={700} fontSize="1.1rem" color="slate.900" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AdminPanelSettings sx={{ color: "#d97706" }} /> Staff / Administrator ID Card
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc" }}>
                <Box ref={cardRef} sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", maxWidth: 440, mx: "auto" }}>
                    
                    {/* FRONT SIDE */}
                    <Box
                        sx={{
                            width: "100%",
                            aspectRatio: "1.586", // CR80 standard ID card ratio
                            borderRadius: 3.5,
                            overflow: "hidden",
                            boxShadow: "0 15px 35px rgba(15, 23, 42, 0.2)",
                            background: "linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)",
                            color: "#ffffff",
                            position: "relative",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* Top Banner */}
                        <Box sx={{ p: 2, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                <Box sx={{ bgcolor: "#ffffff", p: 0.6, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <img src="/logos/slogo.png" alt="Stephotec" style={{ width: 28, height: 28, objectFit: "contain" }} />
                                </Box>
                                <Box>
                                    <Typography fontWeight={800} fontSize="0.75rem" letterSpacing={0.5} lineHeight={1.1} color="#ffffff">
                                        STEPHOTEC
                                    </Typography>
                                    <Typography fontWeight={700} fontSize="0.5rem" color="#fbbf24" letterSpacing={0.6}>
                                        COMPUTER TECHNOLOGIES LTD
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ bgcolor: "#d97706", color: "#ffffff", px: 1.2, py: 0.4, borderRadius: 1.5, fontSize: "0.55rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                                STAFF / ADMIN
                            </Box>
                        </Box>

                        {/* Middle Content */}
                        <Box sx={{ px: 2, display: "flex", alignItems: "center", gap: 2 }}>
                            {/* Photo */}
                            <Avatar
                                src={profilePic}
                                sx={{
                                    width: 82,
                                    height: 82,
                                    borderRadius: 2.5,
                                    border: "2px solid #fbbf24",
                                    bgcolor: "#1e293b",
                                    fontSize: 32,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                }}
                            >
                                {staff.first_name?.charAt(0)?.toUpperCase() || "A"}
                            </Avatar>

                            {/* Details */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography fontWeight={800} fontSize="1rem" lineHeight={1.2} color="#ffffff" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {fullName}
                                </Typography>
                                <Typography fontWeight={700} fontSize="0.7rem" color="#fbbf24" sx={{ mt: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {roleTitle}
                                </Typography>
                                <Typography fontWeight={600} fontSize="0.65rem" color="#94a3b8" sx={{ mt: 0.5 }}>
                                    Staff ID: <span style={{ color: "#ffffff", fontWeight: 800, fontFamily: "monospace" }}>{username}</span>
                                </Typography>
                                <Typography fontWeight={600} fontSize="0.6rem" color="#94a3b8" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    Email: {email}
                                </Typography>
                            </Box>

                            {/* QR Code */}
                            <Box sx={{ bgcolor: "#ffffff", p: 0.5, borderRadius: 1.5, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                                <img src={qrCodeUrl} alt="QR Code" style={{ width: 54, height: 54, display: "block" }} />
                            </Box>
                        </Box>

                        {/* Bottom Stripe */}
                        <Box sx={{ bgcolor: "#d97706", color: "#0f172a", py: 0.6, px: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography fontSize="0.55rem" fontWeight={800} letterSpacing={0.5}>
                                OFFICIAL STAFF IDENTIFICATION
                            </Typography>
                            <Typography fontSize="0.55rem" fontWeight={700}>
                                STEPHOTEC ACADEMIC BOARD
                            </Typography>
                        </Box>
                    </Box>

                    {/* BACK SIDE */}
                    <Box
                        sx={{
                            width: "100%",
                            aspectRatio: "1.586",
                            borderRadius: 3.5,
                            overflow: "hidden",
                            boxShadow: "0 15px 35px rgba(15, 23, 42, 0.15)",
                            bgcolor: "#ffffff",
                            color: "#0f172a",
                            position: "relative",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            p: 2,
                            boxSizing: "border-box",
                        }}
                    >
                        <Box>
                            <Typography fontSize="0.65rem" fontWeight={800} color="#7c3aed" letterSpacing={0.5} mb={0.5}>
                                TERMS & SECURITY NOTICE
                            </Typography>
                            <Typography fontSize="0.55rem" color="text.secondary" lineHeight={1.4}>
                                This card is the official property of Stephotec Computer Technologies Ltd. It must be displayed while on official duties. Unauthorized use or replication is strictly prohibited. If found, please return to Stephotec Administration.
                            </Typography>
                        </Box>

                        <Box sx={{ borderTop: "1px solid #f1f5f9", pt: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <Box>
                                <Typography fontSize="0.6rem" fontWeight={800} color="slate.900">
                                    Stephotec Computer Tech Ltd
                                </Typography>
                                <Typography fontSize="0.55rem" color="text.secondary">
                                    info@stephotec.com | +234 802 250 8370
                                </Typography>
                                <Typography fontSize="0.55rem" color="text.secondary">
                                    WhatsApp: +234 703 563 1513
                                </Typography>
                            </Box>

                            <Box sx={{ textAlign: "right" }}>
                                <Typography fontSize="0.55rem" fontWeight={700} color="primary.main" fontFamily="monospace">
                                    {username}
                                </Typography>
                                <Typography fontSize="0.5rem" color="text.disabled">
                                    AUTHENTICATED STAFF
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit">
                    Close
                </Button>
                <Button
                    onClick={handlePrint}
                    variant="outlined"
                    startIcon={<Print />}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                    Print Card
                </Button>
                <Button
                    onClick={handleDownloadPDF}
                    variant="contained"
                    disabled={downloading}
                    startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                >
                    {downloading ? "Generating PDF..." : "Download PDF ID Card"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
