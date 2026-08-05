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
} from "@mui/material";
import {
    Close,
    Download,
    Print,
    WorkspacePremium,
} from "@mui/icons-material";
import { successToast, errorToast } from "@/lib/toast";

/* Ornate Victorian Gold Corner Filigree Flourish */
const CornerFiligree = ({ transform }) => (
    <g transform={transform}>
        {/* Deep Ornate Leaf Curves */}
        <path d="M 28,28 C 55,28 75,38 95,58 C 115,78 135,108 145,145" stroke="#B89947" strokeWidth="3" fill="none" />
        <path d="M 28,28 C 28,55 38,75 58,95 C 78,115 108,135 145,145" stroke="#B89947" strokeWidth="3" fill="none" />
        
        {/* Inner Filigree Swirls */}
        <path d="M 35,35 Q 65,35 85,55 Q 105,75 95,100 Q 85,125 60,130 Q 35,135 30,110 Q 25,85 50,75 Q 75,65 70,45" stroke="#B89947" strokeWidth="2" fill="none" />
        <path d="M 35,35 Q 35,65 55,85 Q 75,105 100,95 Q 125,85 130,60 Q 135,35 110,30 Q 85,25 75,50 Q 65,75 45,70" stroke="#B89947" strokeWidth="2" fill="none" />
        
        {/* Red Flower & Diamond Jewels */}
        <circle cx="48" cy="48" r="7" fill="#c00000" />
        <polygon points="48,25 56,48 48,71 40,48" fill="#B89947" />
        <polygon points="25,48 48,56 71,48 48,40" fill="#B89947" />
        <circle cx="48" cy="48" r="3" fill="#ffffff" />
        
        {/* Accent Filigree Beads */}
        <circle cx="95" cy="58" r="4" fill="#B89947" />
        <circle cx="58" cy="95" r="4" fill="#B89947" />
        <circle cx="145" cy="145" r="4.5" fill="#c00000" />
    </g>
);

/* Top & Bottom Center Gold Crest */
const CenterCrestSVG = ({ y, rotate }) => (
    <g transform={`translate(500, ${y}) rotate(${rotate})`}>
        <line x1="-150" y1="0" x2="-45" y2="0" stroke="#B89947" strokeWidth="2.5" />
        <line x1="45" y1="0" x2="150" y2="0" stroke="#B89947" strokeWidth="2.5" />
        
        <path d="M -100,0 Q -75,-16 -50,0 Q -75,16 -100,0 Z" fill="url(#certGoldGrad)" stroke="#7A5C10" strokeWidth="1" />
        <path d="M 100,0 Q 75,-16 50,0 Q 75,16 100,0 Z" fill="url(#certGoldGrad)" stroke="#7A5C10" strokeWidth="1" />
        
        {/* Center Diamond & Red Bead */}
        <polygon points="0,-18 12,0 0,18 -12,0" fill="#B89947" stroke="#7A5C10" strokeWidth="1" />
        <polygon points="0,-26 18,0 0,26 -18,0" fill="none" stroke="#B89947" strokeWidth="1.8" />
        <circle cx="0" cy="0" r="6" fill="#c00000" />
        <circle cx="-45" cy="0" r="3.5" fill="#B89947" />
        <circle cx="45" cy="0" r="3.5" fill="#B89947" />
    </g>
);

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

    const certNumber =
        certificate.certificate_number ||
        `STP-${new Date().getFullYear()}-${String(certificate.id || 1).padStart(5, "0")}`;

    /* High-Res PDF Download using html2canvas & jsPDF */
    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            const element = certificateRef.current;
            if (!element) return;

            const originalShadow = element.style.boxShadow;
            element.style.boxShadow = "none";

            const canvas = await html2canvas(element, {
                scale: 4,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
            });

            element.style.boxShadow = originalShadow;

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            // Standard A4 Landscape: 297mm x 210mm
            pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
            pdf.save(`Stephotec_Certificate_${certNumber.replace(/\//g, "_")}.pdf`);

            successToast("Certificate PDF downloaded successfully!");
        } catch (err) {
            console.error("Certificate PDF download failed:", err);
            errorToast("Failed to download certificate PDF. Try printing instead.");
        } finally {
            setDownloading(false);
        }
    };

    /* High-Res Pixel-Perfect Printing using html2canvas */
    const handlePrint = async () => {
        try {
            const html2canvas = (await import("html2canvas")).default;
            const element = certificateRef.current;
            if (!element) return;

            const originalShadow = element.style.boxShadow;
            element.style.boxShadow = "none";

            const canvas = await html2canvas(element, {
                scale: 4,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
            });

            element.style.boxShadow = originalShadow;

            const imgData = canvas.toDataURL("image/png");
            const printWindow = window.open("", "_blank");
            if (!printWindow) return;

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Stephotec Certificate - ${studentName}</title>
                        <style>
                            @page {
                                size: A4 landscape;
                                margin: 0;
                            }
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            html, body {
                                width: 100%;
                                height: 100%;
                                margin: 0;
                                padding: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: #ffffff;
                                overflow: hidden;
                            }
                            img {
                                width: 297mm;
                                height: 210mm;
                                object-fit: contain;
                                display: block;
                                margin: auto;
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${imgData}" alt="Certificate" />
                        <script>
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 300);
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch (err) {
            console.error("Print preparation failed:", err);
            errorToast("Failed to prepare print document.");
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
                        bgcolor: "#0f172a",
                    },
                },
            }}
        >
            {/* MODAL CONTENT CONTAINER (NO HEADER BAR FOR 100% UNBLOCKABLE FULL PREVIEW) */}
            <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: "#1e293b", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" }}>
                
                {/* Floating Close Button */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        color: "grey.400",
                        bgcolor: "rgba(15,23,42,0.8)",
                        zIndex: 20,
                        "&:hover": { color: "white", bgcolor: "#0f172a" },
                    }}
                >
                    <Close />
                </IconButton>
                
                {/* ================= UNIFIED CERTIFICATE CANVAS (100% RESPONSIVE FIT) ================= */}
                <Box
                    ref={certificateRef}
                    sx={{
                        width: "100%",
                        maxWidth: "660px",
                        aspectRatio: "1000 / 707",
                        bgcolor: "#ffffff",
                        color: "#111111",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                        boxSizing: "border-box",
                        fontFamily: '"Ancizar Sans", "Inter", sans-serif',
                        mx: "auto",
                        flexShrink: 0,
                    }}
                >
                    <svg
                        viewBox="0 0 1000 707"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                        }}
                    >
                        <defs>
                            <linearGradient id="certGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F7E2A9" />
                                <stop offset="50%" stopColor="#B89947" />
                                <stop offset="100%" stopColor="#7A5C10" />
                            </linearGradient>

                            {/* Rich Victorian Gold Filigree Lace Border Frame Pattern */}
                            <pattern id="goldRibbonFiligreePattern" width="40" height="24" patternUnits="userSpaceOnUse">
                                <path d="M0 12 C10 0, 30 0, 40 12 C30 24, 10 24, 0 12 Z" stroke="#B89947" strokeWidth="1.5" fill="none" />
                                <path d="M0 12 C10 6, 20 6, 20 12 C20 18, 10 18, 0 12 Z" stroke="#D4AF37" strokeWidth="1" fill="none" />
                                <path d="M20 12 C30 6, 40 6, 40 12 C40 18, 30 18, 20 12 Z" stroke="#D4AF37" strokeWidth="1" fill="none" />
                                <circle cx="20" cy="12" r="2.5" fill="#F7E2A9" />
                                <circle cx="0" cy="12" r="1.5" fill="#B89947" />
                                <circle cx="40" cy="12" r="1.5" fill="#B89947" />
                            </pattern>
                        </defs>

                        {/* --- 1. OUTER THIN RED LINE --- */}
                        <rect x="8" y="8" width="984" height="691" fill="none" stroke="#c00000" strokeWidth="2.5" />

                        {/* --- 2. THICK METALLIC GOLD BASE FOR RIBBON --- */}
                        <rect x="18" y="18" width="964" height="671" fill="none" stroke="url(#certGoldGrad)" strokeWidth="20" />

                        {/* --- 3. RICH VICTORIAN GOLD FILIGREE LACE OVERLAY FOR RIBBON --- */}
                        <rect x="18" y="18" width="964" height="671" fill="none" stroke="url(#goldRibbonFiligreePattern)" strokeWidth="20" opacity="0.85" />

                        {/* --- 4. INNER THIN RED LINE --- */}
                        <rect x="28" y="28" width="944" height="651" fill="none" stroke="#c00000" strokeWidth="1.5" />
                        <rect x="32" y="32" width="936" height="643" fill="none" stroke="#B89947" strokeWidth="0.8" strokeDasharray="4 2" />

                        {/* --- 5. VICTORIAN GOLD CORNER FILIGREE ORNAMENTS (COMPACT 0.7X) --- */}
                        <CornerFiligree transform="translate(0, 0) scale(0.7)" />
                        <CornerFiligree transform="translate(1000, 0) scale(-0.7, 0.7)" />
                        <CornerFiligree transform="translate(0, 707) scale(0.7, -0.7)" />
                        <CornerFiligree transform="translate(1000, 707) scale(-0.7, -0.7)" />

                        {/* --- 6. TOP & BOTTOM CENTER GOLD CRESTS --- */}
                        <CenterCrestSVG y={28} rotate={0} />
                        <CenterCrestSVG y={679} rotate={180} />

                        {/* --- 7. DIAGONAL STEPHOTEC LOGO WATERMARK BACKGROUND --- */}
                        <g transform="translate(500, 355) rotate(-22)" opacity="0.065" pointerEvents="none">
                            <text textAnchor="middle" fontFamily="'Germania One', cursive, sans-serif">
                                <tspan fill="#c00000" fontSize="58" fontWeight="normal">S</tspan>
                                <tspan fill="#111111" fontSize="44" fontWeight="normal">tephotec</tspan>
                            </text>
                            <text x="0" y="24" textAnchor="middle" fontFamily='"Ancizar Sans", sans-serif' fontSize="15" fontWeight="bold" fill="#111111" letterSpacing="1.2">Computer Technologies Ltd</text>
                        </g>

                        {/* --- 8. TOP CENTER SCHOOL LOGO (GERMANIA ONE - SLEEK S NO GAP NO OVERLAP) --- */}
                        <g transform="translate(500, 84)">
                            <text textAnchor="middle" fontFamily="'Germania One', cursive, sans-serif">
                                <tspan fill="#c00000" fontSize="48" fontWeight="normal">S</tspan>
                                <tspan fill="#1e293b" fontSize="36" fontWeight="normal" letterSpacing="0">tephotec</tspan>
                            </text>
                            <text x="0" y="24" textAnchor="middle" fontFamily='"Ancizar Sans", "Inter", sans-serif' fontSize="13" fontWeight="bold" fill="#c00000" letterSpacing="0.8">
                                Computer Technologies Ltd
                            </text>
                        </g>

                        {/* --- 9. TOP RIGHT CERTIFICATE NO --- */}
                        <text x="890" y="78" textAnchor="end" fontFamily="sans-serif" fontSize="10.5" fontWeight="800" fill="#475569" letterSpacing="0.8">CERTIFICATE NO.</text>
                        <text x="890" y="98" textAnchor="end" fontFamily="sans-serif" fontSize="13.5" fontWeight="bold" fill="#c00000">{certNumber}</text>
                        <line x1="775" y1="104" x2="890" y2="104" stroke="#c00000" strokeWidth="1.5" />

                        {/* --- 10. TITLE SECTION (CERTIFICATE OF ACHIEVEMENT) --- */}
                        <text x="500" y="172" textAnchor="middle" fontFamily="Georgia, serif" fontSize="50" fontWeight="bold" fill="#B89947" letterSpacing="6">CERTIFICATE</text>
                        
                        {/* —— OF ACHIEVEMENT —— */}
                        <line x1="280" y1="210" x2="365" y2="210" stroke="#B89947" strokeWidth="1.5" />
                        <text x="500" y="215" textAnchor="middle" fontFamily="sans-serif" fontSize="15" fontWeight="bold" fill="#c00000" letterSpacing="6">OF ACHIEVEMENT</text>
                        <line x1="635" y1="210" x2="720" y2="210" stroke="#B89947" strokeWidth="1.5" />

                        {/* --- 11. RED DECORATIVE CENTER DIVIDER LINE (POSITIONED SAFELY AT Y=246) --- */}
                        <g transform="translate(500, 246)">
                            <line x1="-280" y1="0" x2="-40" y2="0" stroke="#c00000" strokeWidth="1.5" />
                            <line x1="40" y1="0" x2="280" y2="0" stroke="#c00000" strokeWidth="1.5" />
                            <circle cx="-280" cy="0" r="4" fill="#c00000" />
                            <circle cx="280" cy="0" r="4" fill="#c00000" />
                            <polygon points="-40,0 -54,-6 -68,0 -54,6" fill="#c00000" />
                            <polygon points="40,0 54,-6 68,0 54,6" fill="#c00000" />
                            <circle cx="0" cy="0" r="5" fill="#c00000" />
                            <polygon points="0,-12 8,0 0,12 -8,0" fill="#B89947" />
                            <circle cx="-16" cy="0" r="3" fill="#B89947" />
                            <circle cx="16" cy="0" r="3" fill="#B89947" />
                            <path d="M -26,0 Q -20,-7 -14,0 Q -20,7 -26,0 Z" fill="#c00000" />
                            <path d="M 26,0 Q 20,-7 14,0 Q 20,7 26,0 Z" fill="#c00000" />
                        </g>

                        {/* --- 12. RECIPIENT & COURSE BODY SECTION --- */}
                        <text x="500" y="285" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#334155" letterSpacing="2.5">THIS IS TO CERTIFY THAT</text>

                        {/* [ Name ] */}
                        <text x="500" y="342" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="38" fontWeight="bold" fill="#B89947">[ {studentName} ]</text>
                        <line x1="280" y1="352" x2="720" y2="352" stroke="#B89947" strokeWidth="1.5" />

                        <text x="500" y="392" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#334155" letterSpacing="2.5">HAS SUCCESSFULLY COMPLETED THE</text>

                        {/* [ Course Name ] */}
                        <text x="500" y="438" textAnchor="middle" fontFamily="Georgia, serif" fontSize="28" fontWeight="bold" fill="#c00000">[ {courseName} ]</text>

                        <text x="500" y="478" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#334155" letterSpacing="3.5">TRAINING PROGRAM</text>

                        {/* --- 13. DATE BLOCK (LEFT, Y=545 - CLEAN & UNCLUTTERED) --- */}
                        <g transform="translate(210, 545)">
                            <line x1="-85" y1="0" x2="85" y2="0" stroke="#B89947" strokeWidth="1.5" />
                            <text x="0" y="18" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#475569" letterSpacing="1">DATE</text>
                        </g>

                        {/* --- 14. AUTHORIZED SIGNATURE BLOCK (RIGHT, Y=545 - CLEAN & UNCLUTTERED) --- */}
                        <g transform="translate(790, 545)">
                            <line x1="-85" y1="0" x2="85" y2="0" stroke="#B89947" strokeWidth="1.5" />
                            <text x="0" y="18" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#475569" letterSpacing="1">AUTHORIZED SIGNATURE</text>
                        </g>

                        {/* --- 15. OFFICIAL EMBOSSED GOLD MEDALLION SEAL (CENTER, Y=530 - TAILS END AT Y=585) --- */}
                        <g transform="translate(500, 530)">
                            {/* Red & Gold Satin Ribbon Tails Hanging Below Seal */}
                            <g transform="translate(0, 15)">
                                <path d="M -12 15 L -24 52 L -13 46 L -2 52 Z" fill="#c00000" stroke="#B89947" strokeWidth="1" />
                                <path d="M 12 15 L 24 52 L 13 46 L 2 52 Z" fill="#c00000" stroke="#B89947" strokeWidth="1" />
                                <path d="M -15 20 L -20 45 L -13 42 Z" fill="#F7E2A9" opacity="0.6" />
                                <path d="M 15 20 L 20 45 L 13 42 Z" fill="#F7E2A9" opacity="0.6" />
                            </g>

                            {/* Outer Scalloped Gold Medallion Starburst Ring */}
                            {Array.from({ length: 24 }).map((_, i) => (
                                <rect
                                    key={i}
                                    x="-3.5"
                                    y="-40"
                                    width="7"
                                    height="80"
                                    rx="3.5"
                                    fill="#B89947"
                                    transform={`rotate(${i * 7.5})`}
                                    opacity="0.95"
                                />
                            ))}
                            <circle cx="0" cy="0" r="34" fill="url(#certGoldGrad)" stroke="#7A5C10" strokeWidth="2" />
                            <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#B89947" strokeWidth="1.5" strokeDasharray="3 2" />
                            
                            {/* Inner Contents */}
                            <text x="0" y="-16" textAnchor="middle" fill="#B89947" fontSize="7.5" fontWeight="bold" letterSpacing="1">★ ★ ★</text>
                            <circle cx="0" cy="2" r="13" fill="#c00000" />
                            <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="900" fontFamily="sans-serif">S</text>
                            <text x="0" y="23" textAnchor="middle" fill="#7A5C10" fontSize="5" fontWeight="bold" letterSpacing="0.5">STEPHOTEC</text>
                        </g>

                        {/* --- 16. FOOTER CONTACT BAR (PUSHED UP SAFELY TO Y=615 - ZERO COLLISION WITH SEAL) --- */}
                        <g transform="translate(500, 615)">
                            {/* Top Gold Line */}
                            <line x1="-420" y1="0" x2="420" y2="0" stroke="#B89947" strokeWidth="1.5" />

                            {/* Left: Phone (x = -250) */}
                            <g transform="translate(-250, 18)">
                                <circle cx="-55" cy="0" r="9" fill="#c00000" />
                                {/* Phone icon vector */}
                                <path d="M-58 -4 C-58 -5 -57 -6 -56 -6 L-54 -6 C-53 -6 -53 -5 -53 -4 L-53 -3 C-53 -2 -54 -1 -55 0 C-54 1 -53 2 -52 3 C-51 4 -50 5 -49 5 L-48 4 C-47 3 -46 3 -45 3 L-44 3 C-43 3 -42 4 -42 5 L-42 7 C-42 8 -43 9 -44 9 C-47 9 -51 6 -54 3 C-57 0 -58 -4 -58 -4 Z" fill="#ffffff" />
                                <text x="-40" y="4" textAnchor="start" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#334155">07035631513</text>
                            </g>

                            {/* Vertical Gold Divider 1 */}
                            <line x1="-120" y1="8" x2="-120" y2="28" stroke="#B89947" strokeWidth="1.5" />

                            {/* Center: Address (x = 0) */}
                            <g transform="translate(0, 18)">
                                <circle cx="-135" cy="0" r="9" fill="#c00000" />
                                {/* Location Pin icon vector */}
                                <path d="M-135 -6 C-138 -6 -140 -4 -140 -1 C-140 3 -135 7 -135 7 C-135 7 -130 3 -130 -1 C-130 -4 -132 -6 -135 -6 Z M-135 1 A 2 2 0 1 1 -135 -3 A 2 2 0 1 1 -135 1 Z" fill="#ffffff" />
                                <text x="-120" y="4" textAnchor="start" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#334155">141, Idi-Iroko Road, Oju-Ore, Ota, Ogun State</text>
                            </g>

                            {/* Vertical Gold Divider 2 */}
                            <line x1="140" y1="8" x2="140" y2="28" stroke="#B89947" strokeWidth="1.5" />

                            {/* Right: Email (x = 260) */}
                            <g transform="translate(260, 18)">
                                <circle cx="-65" cy="0" r="9" fill="#c00000" />
                                {/* Email Envelope icon vector */}
                                <path d="M-70 -4 L-60 -4 C-59 -4 -59 -3 -59 -3 L-65 1 L-71 -3 C-71 -3 -71 -4 -70 -4 Z M-71 -2 L-71 4 C-71 5 -70 5 -70 5 L-60 5 C-59 5 -59 5 -59 4 L-59 -2 L-64 1.5 C-64.5 2 -65.5 2 -66 1.5 Z" fill="#ffffff" />
                                <text x="-50" y="4" textAnchor="start" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#334155">Info@stephotec.com</text>
                            </g>

                        </g>

                    </svg>
                </Box>
            </DialogContent>

            {/* MODAL ACTIONS */}
            <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, px: 3, bgcolor: "#0f172a", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2.5, textTransform: "none", color: "grey.300", borderColor: "grey.700", "&:hover": { borderColor: "white", color: "white" } }}>
                    Close
                </Button>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        startIcon={<Print />}
                        onClick={handlePrint}
                        variant="outlined"
                        sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, borderColor: "#B89947", color: "#B89947", "&:hover": { borderColor: "#F7E2A9", color: "#F7E2A9" } }}
                    >
                        Print Certificate
                    </Button>
                    <Button
                        startIcon={downloading ? null : <Download />}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        variant="contained"
                        sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, bgcolor: "#c00000", color: "white", "&:hover": { bgcolor: "#900000" } }}
                    >
                        {downloading ? "Generating PDF..." : "Download PDF Certificate"}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
