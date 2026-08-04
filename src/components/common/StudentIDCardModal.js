"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Chip,
    Avatar,
    CircularProgress,
} from "@mui/material";
import { Close, Download, Print, Badge as BadgeIcon, Flip } from "@mui/icons-material";
import { successToast, errorToast } from "@/lib/toast";

export default function StudentIDCardModal({ open, onClose, student }) {
    const [downloading, setDownloading] = useState(false);
    const [activeSide, setActiveSide] = useState("front"); // 'front' | 'back'
    const cardRef = useRef(null);

    if (!student) return null;

    const fullName = [student.first_name || student.firstName, student.last_name || student.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || student.username || "Student Name";

    const username =
        student.courses?.find((c) => c.is_primary)?.enrollment_id ||
        student.courses?.[0]?.enrollment_id ||
        student.username ||
        "SE/26/0000";
    const primaryCourse =
        student.courses?.find((c) => c.is_primary)?.course?.name ||
        student.courses?.[0]?.course?.name ||
        student.primary_course ||
        "Computer Studies";

    const admissionYear = student.admission_year || new Date().getFullYear();
    const profilePic = student.profile_picture_url || student.profilePictureUrl;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://stephotec.com";
    const qrData = encodeURIComponent(`${origin}/verify?student=${username}`);
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
                logging: false,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: [85.6, 53.98], // Standard CR80 Credit Card Size in mm
            });

            pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
            pdf.save(`Stephotec_ID_Card_${username.replace(/\//g, "_")}.pdf`);

            successToast("Student ID Card PDF downloaded successfully!");
        } catch (err) {
            console.error("ID Card PDF download failed:", err);
            errorToast(err, "Failed to download ID card PDF. Try printing instead.");
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
                    <title>Student ID Card - ${fullName}</title>
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
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
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
                    bgcolor: "#0f172a",
                    color: "white",
                    py: 2,
                    px: 3,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <BadgeIcon sx={{ color: "#a855f7" }} />
                    <Typography variant="h6" fontWeight={700} fontSize="1.1rem">
                        Digital Student ID Card
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 4, px: 3, bgcolor: "#f8fafc", textAlign: "center" }}>
                {/* Side Selector Tabs */}
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 3 }}>
                    <Button
                        size="small"
                        variant={activeSide === "front" ? "contained" : "outlined"}
                        onClick={() => setActiveSide("front")}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                        Front Side
                    </Button>
                    <Button
                        size="small"
                        variant={activeSide === "back" ? "contained" : "outlined"}
                        onClick={() => setActiveSide("back")}
                        startIcon={<Flip fontSize="small" />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                        Back Side
                    </Button>
                </Box>

                {/* ID Card Display Area (Formatted to CR80 aspect ratio 85.6 x 53.98mm) */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflowX: "auto",
                        py: 1,
                    }}
                >
                    <div
                        ref={cardRef}
                        style={{
                            width: "360px",
                            height: "227px",
                            borderRadius: "16px",
                            boxShadow: "0 20px 35px -10px rgba(15, 23, 42, 0.3)",
                            position: "relative",
                            overflow: "hidden",
                            background: activeSide === "front" 
                                ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)"
                                : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                            color: "white",
                            boxSizing: "border-box",
                            fontFamily: "Inter, Roboto, sans-serif",
                            userSelect: "none",
                        }}
                    >
                        {/* Decorative Top Curves */}
                        <div style={{ position: "absolute", top: -40, right: -40, width: "140px", height: "140px", borderRadius: "50%", background: "rgba(168, 85, 247, 0.15)", filter: "blur(20px)" }} />
                        <div style={{ position: "absolute", bottom: -50, left: -50, width: "160px", height: "160px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.15)", filter: "blur(20px)" }} />

                        {activeSide === "front" ? (
                            /* FRONT SIDE */
                            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "14px 16px", position: "relative", zIndex: 2, boxSizing: "border-box" }}>
                                {/* Card Header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.15)", paddingBottom: "8px" }}>
                                    {/* Logo */}
                                    <div style={{ background: "#ffffff", padding: "3px 5px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", flexShrink: 0 }}>
                                        <img
                                            src="/logos/slogo.png"
                                            alt="Stephotec Logo"
                                            style={{ width: "22px", height: "22px", objectFit: "contain" }}
                                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                        />
                                    </div>

                                    {/* Centered School Name */}
                                    <div style={{ textAlign: "center", flexGrow: 1 }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", color: "#ffffff", lineHeight: "1.2" }}>STEPHOTEC</div>
                                        <div style={{ fontSize: "6.5px", fontWeight: "700", color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.6px", lineHeight: "1.2" }}>COMPUTER TECHNOLOGIES LTD</div>
                                    </div>

                                    {/* Student ID Badge */}
                                    <div style={{ fontSize: "7px", fontWeight: "800", background: "rgba(168, 85, 247, 0.25)", color: "#f3e8ff", padding: "3px 8px", borderRadius: "10px", border: "1px solid rgba(168, 85, 247, 0.4)", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>
                                        {student.is_industrial_training ? "IT STUDENT" : "STUDENT ID"}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", my: "auto", py: "4px" }}>
                                    {/* Student Avatar */}
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        {profilePic ? (
                                            <img
                                                src={profilePic}
                                                alt={fullName}
                                                style={{ width: "70px", height: "70px", borderRadius: "12px", objectFit: "cover", border: "2px solid #a855f7", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                                            />
                                        ) : (
                                            <div style={{ width: "70px", height: "70px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "800", color: "white", border: "2px solid #a855f7", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                                                {fullName.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ position: "absolute", bottom: "-3px", right: "-3px", width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e", border: "2px solid #0f172a" }} />
                                    </div>

                                    {/* Student Info */}
                                    <div style={{ textAlign: "left", flexGrow: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", lineHeight: "1.2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {fullName}
                                        </div>
                                        <div style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: "700", color: "#60a5fa", marginTop: "2px", lineHeight: "1.2" }}>
                                            ID: {username}
                                        </div>

                                        <div style={{ marginTop: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", alignItems: "start" }}>
                                            <div>
                                                <div style={{ fontSize: "7px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.4px" }}>COURSE</div>
                                                <div style={{ fontSize: "9px", fontWeight: "700", color: "#f1f5f9", lineHeight: "1.3", paddingBottom: "2px", wordBreak: "break-word" }}>
                                                    {primaryCourse}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "7px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.4px" }}>ADMISSION YEAR</div>
                                                <div style={{ fontSize: "9px", fontWeight: "700", color: "#f1f5f9", lineHeight: "1.3", paddingBottom: "2px" }}>
                                                    {admissionYear}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "6px" }}>
                                    <div style={{ fontSize: "7.5px", color: "#94a3b8" }}>
                                        Authorized Student Badge
                                    </div>
                                    <div style={{ fontSize: "8px", fontWeight: "800", color: "#4ade80", letterSpacing: "0.5px" }}>
                                        ● VALID & ACTIVE
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* BACK SIDE */
                            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "14px 16px", position: "relative", zIndex: 2, boxSizing: "border-box" }}>
                                {/* Magnetic Strip Simulation */}
                                <div style={{ height: "22px", background: "#020617", margin: "-14px -16px 6px -16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }} />

                                <div style={{ display: "flex", alignItems: "center", gap: "12px", my: "auto" }}>
                                    {/* QR Code */}
                                    <div style={{ background: "white", padding: "4px", borderRadius: "8px", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                                        <img src={qrCodeUrl} alt="QR Code" style={{ width: "62px", height: "62px", display: "block" }} />
                                    </div>

                                    {/* Terms & Contact Details */}
                                    <div style={{ textAlign: "left", fontSize: "7.5px", color: "#cbd5e1", lineHeight: 1.35, flexGrow: 1 }}>
                                        <div style={{ fontWeight: "800", color: "#ffffff", marginBottom: "2px", fontSize: "8.5px", letterSpacing: "0.4px" }}>
                                            STEPHOTEC COMPUTER TECHNOLOGIES LTD
                                        </div>
                                        <div style={{ fontSize: "7px", color: "#94a3b8", marginBottom: "4px" }}>
                                            Official Student Identity Document. If found, please return to support.
                                        </div>

                                        {/* Contact info list */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "7.5px", fontWeight: "600", color: "#e2e8f0" }}>
                                            <div>📧 info@stephotec.com</div>
                                            <div>📞 +234 802 250 8370</div>
                                            <div>💬 WhatsApp: +234 703 563 1513</div>
                                            <div style={{ color: "#93c5fd", fontWeight: "700", marginTop: "1px" }}>🌐 https://stephotec.com</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Contact */}
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "7px", color: "#94a3b8" }}>
                                    <div>Official Credentials & Security QR</div>
                                    <div style={{ color: "#c084fc", fontWeight: "800", letterSpacing: "0.5px" }}>VERIFIED ID</div>
                                </div>
                            </div>
                        )}
                    </div>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, px: 3, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0", gap: 1 }}>
                <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handlePrint}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600 }}
                >
                    Print Card
                </Button>
                <Button
                    variant="contained"
                    startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                >
                    {downloading ? "Generating PDF..." : "Download PDF ID Card"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
