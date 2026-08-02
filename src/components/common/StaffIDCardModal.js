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
    IconButton,
    CircularProgress,
} from "@mui/material";
import {
    Close,
    Download,
    Print,
    AdminPanelSettings,
    Flip,
} from "@mui/icons-material";

export default function StaffIDCardModal({ open, onClose, staff }) {
    const cardRef = useRef(null);
    const [downloading, setDownloading] = useState(false);
    const [activeSide, setActiveSide] = useState("front");

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
            const pdfWidth = 85.6; // Standard CR80 width in mm
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            const x = (210 - pdfWidth) / 2;
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
                    <AdminPanelSettings sx={{ color: "#fbbf24" }} />
                    <Typography variant="h6" fontWeight={700} fontSize="1.1rem">
                        Digital Staff / Administrator ID Card
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
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, bgcolor: activeSide === "front" ? "#d97706" : "transparent" }}
                    >
                        Front Side
                    </Button>
                    <Button
                        size="small"
                        variant={activeSide === "back" ? "contained" : "outlined"}
                        onClick={() => setActiveSide("back")}
                        startIcon={<Flip fontSize="small" />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, bgcolor: activeSide === "back" ? "#d97706" : "transparent" }}
                    >
                        Back Side
                    </Button>
                </Box>

                {/* ID Card Display Area (CR80 Aspect Ratio) */}
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
                            boxShadow: "0 20px 35px -10px rgba(15, 23, 42, 0.35)",
                            position: "relative",
                            overflow: "hidden",
                            background: activeSide === "front"
                                ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #3b0764 100%)"
                                : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                            color: "white",
                            boxSizing: "border-box",
                            fontFamily: "Inter, Roboto, sans-serif",
                            userSelect: "none",
                        }}
                    >
                        {/* Decorative Background Curves */}
                        <div style={{ position: "absolute", top: -40, right: -40, width: "140px", height: "140px", borderRadius: "50%", background: "rgba(251, 191, 36, 0.15)", filter: "blur(20px)" }} />
                        <div style={{ position: "absolute", bottom: -50, left: -50, width: "160px", height: "160px", borderRadius: "50%", background: "rgba(147, 51, 234, 0.15)", filter: "blur(20px)" }} />

                        {activeSide === "front" ? (
                            /* FRONT SIDE */
                            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "14px 16px", position: "relative", zIndex: 2, boxSizing: "border-box" }}>
                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.15)", paddingBottom: "8px" }}>
                                    <div style={{ background: "#ffffff", padding: "3px 5px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", flexShrink: 0 }}>
                                        <img
                                            src="/logos/slogo.png"
                                            alt="Stephotec Logo"
                                            style={{ width: "22px", height: "22px", objectFit: "contain" }}
                                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                        />
                                    </div>

                                    <div style={{ textAlign: "center", flexGrow: 1 }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", color: "#ffffff", lineHeight: "1.2" }}>STEPHOTEC</div>
                                        <div style={{ fontSize: "6.5px", fontWeight: "700", color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.6px", lineHeight: "1.2" }}>COMPUTER TECHNOLOGIES LTD</div>
                                    </div>

                                    <div style={{ fontSize: "7px", fontWeight: "800", background: "rgba(251, 191, 36, 0.25)", color: "#fef3c7", padding: "3px 8px", borderRadius: "10px", border: "1px solid rgba(251, 191, 36, 0.4)", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>
                                        STAFF ID
                                    </div>
                                </div>

                                {/* Body */}
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", my: "auto", py: "4px" }}>
                                    {/* Staff Avatar */}
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        {profilePic ? (
                                            <img
                                                src={profilePic}
                                                alt={fullName}
                                                style={{ width: "70px", height: "70px", borderRadius: "12px", objectFit: "cover", border: "2px solid #fbbf24", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                                            />
                                        ) : (
                                            <div style={{ width: "70px", height: "70px", borderRadius: "12px", background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "800", color: "white", border: "2px solid #fbbf24", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                                                {fullName.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ position: "absolute", bottom: "-3px", right: "-3px", width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e", border: "2px solid #0f172a" }} />
                                    </div>

                                    {/* Staff Info */}
                                    <div style={{ textAlign: "left", flexGrow: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", lineHeight: "1.2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {fullName}
                                        </div>
                                        <div style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: "700", color: "#fbbf24", marginTop: "2px", lineHeight: "1.2" }}>
                                            ID: {username}
                                        </div>

                                        <div style={{ marginTop: "6px" }}>
                                            <div style={{ fontSize: "7px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.4px" }}>DESIGNATION / ROLE</div>
                                            <div style={{ fontSize: "8.5px", fontWeight: "700", color: "#f1f5f9", lineHeight: "1.3", wordBreak: "break-word" }}>
                                                {roleTitle}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "6px" }}>
                                    <div style={{ fontSize: "7.5px", color: "#94a3b8" }}>
                                        Authorized Academic Staff
                                    </div>
                                    <div style={{ fontSize: "8px", fontWeight: "800", color: "#fbbf24", letterSpacing: "0.5px" }}>
                                        ● OFFICIAL & ACTIVE
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
                                        <img src={qrCodeUrl} alt="Staff Verification QR Code" style={{ width: "62px", height: "62px", display: "block" }} />
                                    </div>

                                    {/* Terms & Contact Details */}
                                    <div style={{ textAlign: "left", fontSize: "7.5px", color: "#cbd5e1", lineHeight: 1.35, flexGrow: 1 }}>
                                        <div style={{ fontWeight: "800", color: "#ffffff", marginBottom: "2px", fontSize: "8.5px", letterSpacing: "0.4px" }}>
                                            STEPHOTEC COMPUTER TECHNOLOGIES LTD
                                        </div>
                                        <div style={{ fontSize: "7px", color: "#94a3b8", marginBottom: "4px" }}>
                                            Official Staff Identity Document. If found, please return to Stephotec Administration.
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "7.5px", fontWeight: "600", color: "#e2e8f0" }}>
                                            <div>📧 info@stephotec.com</div>
                                            <div>📞 +234 802 250 8370</div>
                                            <div>💬 WhatsApp: +234 703 563 1513</div>
                                            <div style={{ color: "#fbbf24", fontWeight: "700", marginTop: "1px" }}>🌐 https://stephotec.com</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "7px", color: "#94a3b8" }}>
                                    <div>Official Staff Credentials & Security QR</div>
                                    <div style={{ color: "#fbbf24", fontWeight: "800", letterSpacing: "0.5px" }}>VERIFIED STAFF ID</div>
                                </div>
                            </div>
                        )}
                    </div>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, px: 3, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0", gap: 1 }}>
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
