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
    Stack,
    IconButton,
    Chip,
} from "@mui/material";
import { Close, Download, Print, WorkspacePremium, Verified, CheckCircle } from "@mui/icons-material";
import { successToast, errorToast } from "@/lib/toast";

export default function CertificateModal({ open, onClose, certificate }) {
    const [downloading, setDownloading] = useState(false);
    const certificateRef = useRef(null);

    if (!certificate) return null;

    let studentName = "Student Name";
    if (certificate.student?.first_name || certificate.student?.last_name) {
        studentName = `${certificate.student.first_name || ''} ${certificate.student.last_name || ''}`.trim();
    } else if (certificate.student_course?.student?.first_name || certificate.student_course?.student?.last_name) {
        studentName = `${certificate.student_course.student.first_name || ''} ${certificate.student_course.student.last_name || ''}`.trim();
    } else if (certificate.student_name) {
        studentName = certificate.student_name;
    } else if (certificate.student_course_details?.student_name) {
        studentName = certificate.student_course_details.student_name;
    }

    const courseName =
        certificate.course_name ||
        certificate.student_course_details?.course_name ||
        certificate.student_course?.course?.name ||
        certificate.course?.name ||
        "Information Technology";

    const certificateTitle = certificate.title || "Certificate of Completion";

    const certNumber =
        certificate.certificate_number ||
        `CERT/26/${String(certificate.id || 1).padStart(4, "0")}`;

    const issueDate = certificate.earned_date || certificate.issued_date || new Date().toISOString().split("T")[0];
    const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const origin = typeof window !== "undefined" ? window.location.origin : "https://stephotec.com";
    const verifyUrl = `${origin}/verify-certificate?cert=${encodeURIComponent(certNumber)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}&color=0f172a`;

    const handlePrint = () => {
        window.print();
    };

    const loadHtml2PdfScript = () => {
        return new Promise((resolve, reject) => {
            if (typeof window !== "undefined" && window.html2pdf) {
                resolve(window.html2pdf);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = () => resolve(window.html2pdf);
            script.onerror = (err) => reject(err);
            document.body.appendChild(script);
        });
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const html2pdf = await loadHtml2PdfScript();
            const element = certificateRef.current;

            const opt = {
                margin: 0,
                filename: `Stephotec_Certificate_${certNumber.replace(/\//g, "_")}.pdf`,
                image: { type: "png" },
                html2canvas: { scale: 3, useCORS: true, logging: false },
                jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
            };

            await html2pdf().set(opt).from(element).save();
            successToast("Certificate PDF downloaded successfully!");
        } catch (error) {
            console.error("PDF download fallback to print", error);
            window.print();
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: { xs: 2, sm: 4 },
                        maxHeight: "95vh",
                        bgcolor: "#f8fafc",
                    },
                },
            }}
        >
            {/* PRINT-ONLY CSS */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #stephotec-certificate-printable,
                    #stephotec-certificate-printable * {
                        visibility: visible !important;
                    }
                    #stephotec-certificate-printable {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 20px !important;
                        box-sizing: border-box !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* MODAL HEADER */}
            <DialogTitle
                className="no-print"
                sx={{
                    p: { xs: 2, sm: 3 },
                    bgcolor: "#0f172a",
                    color: "white",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <WorkspacePremium sx={{ color: "#fbbf24", fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                            Official Certificate Generator
                        </Typography>
                        <Typography variant="caption" sx={{ color: "grey.400" }}>
                            Serial No: {certNumber}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: "grey.400" }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            {/* MODAL CONTENT */}
            <DialogContent dividers sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#f1f5f9" }}>
                {/* CERTIFICATE CANVAS FRAME */}
                <Box
                    id="stephotec-certificate-printable"
                    ref={certificateRef}
                    sx={{
                        width: "100%",
                        maxWidth: "840px",
                        mx: "auto",
                        bgcolor: "#ffffff",
                        color: "#0f172a",
                        p: { xs: 3, sm: 5 },
                        borderRadius: 3,
                        boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
                        position: "relative",
                        border: "12px solid #0f172a",
                        outline: "3px solid #d97706",
                        outlineOffset: "-8px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: { xs: "auto", md: "594px" },
                    }}
                >
                    {/* WATERMARK BACKGROUND */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: "-50%",
                            left: "-50%",
                            right: "-50%",
                            bottom: "-50%",
                            opacity: 0.04,
                            pointerEvents: "none",
                            overflow: "hidden",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 12,
                            transform: "rotate(-30deg)",
                            userSelect: "none",
                        }}
                    >
                        {Array.from({ length: 30 }).map((_, i) => (
                            <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 200 }}>
                                <img
                                    src="/logos/slogo.png"
                                    alt="Watermark Logo"
                                    style={{ width: "160px", height: "auto" }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: 6, mt: 1 }}>
                                    STEPHOTEC
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* CERTIFICATE CONTENT WRAPPER */}
                    <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", flexGrow: 1, width: "100%" }}>
                        {/* SCHOOL HEADER & LOGO */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                                <img
                                    src="/stephotec-logo.png"
                                    alt="Stephotec Logo"
                                    style={{ width: "52px", height: "52px", objectFit: "contain" }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <Box sx={{ textAlign: "left" }}>
                                    <Typography variant="h5" fontWeight={900} color="#0f172a" sx={{ letterSpacing: 1, fontSize: { xs: "1.2rem", sm: "1.5rem" }, textTransform: "uppercase" }}>
                                        Stephotec Computer Technologies Ltd
                                    </Typography>
                                    <Typography variant="caption" fontWeight={700} color="#d97706" sx={{ letterSpacing: 2, display: "block", textTransform: "uppercase" }}>
                                        Institute of Information Technology & Computing
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ width: 120, height: 3, bgcolor: "#d97706", borderRadius: 2, mt: 1 }} />
                        </Box>

                        {/* MIDDLE SECTION (Vertically Centered) */}
                        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", py: 2 }}>
                            {/* CERTIFICATE TITLE */}
                            <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ letterSpacing: 3, textTransform: "uppercase", my: 2, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
                                {certificateTitle}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mb: 2, fontSize: "1rem" }}>
                                This is to certify that
                            </Typography>

                            {/* RECIPIENT NAME */}
                            <Typography
                                variant="h3"
                                fontWeight={900}
                                color="#d97706"
                                sx={{
                                    borderBottom: "2px solid #0f172a",
                                    display: "inline-block",
                                    px: 4,
                                    pb: 1,
                                    mb: 2.5,
                                    mx: "auto",
                                    fontSize: { xs: "1.8rem", sm: "2.4rem" },
                                    fontFamily: "serif, Georgia",
                                }}
                            >
                                {studentName}
                            </Typography>

                            {/* CERTIFICATE BODY TEXT */}
                            <Typography variant="body1" color="slate.800" sx={{ maxWidth: 640, mx: "auto", mb: 4, lineHeight: 1.7, fontSize: { xs: "0.9rem", sm: "1.05rem" } }}>
                                has successfully completed the prescribed academic curriculum and practical training in{" "}
                                <strong style={{ color: "#0f172a" }}>{courseName}</strong> and has demonstrated commendable proficiency, earning this official credential on{" "}
                                <strong>{formattedDate}</strong>.
                            </Typography>
                        </Box>

                        {/* FOOTER DETAILS, SIGNATURES & QR CODE */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: "auto", pt: 3, borderTop: "1px dashed #cbd5e1", flexWrap: "wrap", gap: 2 }}>
                            {/* LEFT: SERIAL & QR CODE */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, textAlign: "left" }}>
                                <img
                                    src={qrCodeUrl}
                                    alt="Verification QR Code"
                                    style={{ width: "80px", height: "80px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "4px" }}
                                />
                                <Box>
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            bgcolor: "#f0fdf4",
                                            color: "#15803d",
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: "16px",
                                            mb: 1.5,
                                            border: "1px solid #dcfce7"
                                        }}
                                    >
                                        <Verified sx={{ fontSize: 14 }} />
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.65rem", lineHeight: 1 }}>
                                            OFFICIAL & VERIFIED
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                                            Certificate No:
                                        </Typography>
                                        <Typography variant="body2" fontWeight={800} fontFamily="monospace" color="#0f172a">
                                            {certNumber}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* RIGHT: SIGNATURES */}
                            <Box sx={{ display: "flex", gap: 4, textAlign: "center" }}>
                                <Box>
                                    <Box sx={{ width: 140, borderBottom: "1px solid #0f172a", mb: 0.5, height: 35 }}>
                                        {/* Left empty for pen signature */}
                                    </Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">
                                        Academic Registrar
                                    </Typography>
                                </Box>

                                <Box>
                                    <Box sx={{ width: 140, borderBottom: "1px solid #0f172a", mb: 0.5, height: 35 }}>
                                        {/* Left empty for pen signature */}
                                    </Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">
                                        Managing Director
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            {/* MODAL ACTIONS */}
            <DialogActions className="no-print" sx={{ p: { xs: 2, sm: 3 }, bgcolor: "white", justifyContent: "space-between" }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2.5, textTransform: "none" }}>
                    Close
                </Button>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        startIcon={<Print />}
                        onClick={handlePrint}
                        variant="outlined"
                        sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, borderColor: "#0f172a", color: "#0f172a" }}
                    >
                        Print Certificate
                    </Button>
                    {/* <Button
                        startIcon={<Download />}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        variant="contained"
                        sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                    >
                        {downloading ? "Generating PDF..." : "Download PDF Certificate"}
                    </Button> */}
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
