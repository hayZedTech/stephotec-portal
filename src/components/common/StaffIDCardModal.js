"use client";

import { useRef, useState, useEffect } from "react";
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
    Close, Download, Print, Badge as BadgeIcon, Flip,
    Person, Work, CalendarToday, LocationOn, Phone, Email, Language, TrackChanges, Add, Lock,
    AdminPanelSettings
} from "@mui/icons-material";
import { successToast, errorToast } from "@/lib/toast";

export default function StaffIDCardModal({ open, onClose, staff }) {
    const cardRef = useRef(null);
    const [downloading, setDownloading] = useState(false);
    const [activeSide, setActiveSide] = useState("front");

    if (!staff) return null;

    const profilePic =
        staff?.profile_picture_url ||
        staff?.profilePictureUrl ||
        staff?.user?.profile_picture_url ||
        staff?.user?.profilePictureUrl ||
        staff?.profile_picture ||
        staff?.profilePicture ||
        staff?.user?.profile_picture ||
        staff?.user?.profilePicture ||
        staff?.avatar ||
        staff?.user?.avatar;

    const fullName =
        [staff.first_name || staff.firstName, staff.last_name || staff.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || staff.username || "Staff Member";

    const username = staff.username || "STAFF0001";
    const roleTitle = staff.role_title || staff.job_title || staff.jobTitle || "System Administrator";
    const issueYear = staff.date_joined ? new Date(staff.date_joined).getFullYear() : (staff.issue_year || new Date().getFullYear());
    const createdDateRaw = staff.created_at || staff.createdAt || staff.date_joined;
    let issueDateStr = `01 / 01 / ${issueYear}`;
    if (createdDateRaw) {
        const d = new Date(createdDateRaw);
        if (!isNaN(d.getTime())) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            issueDateStr = `${dd} / ${mm} / ${yyyy}`;
        }
    }

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
            successToast("Staff ID Card PDF downloaded successfully!");
        } catch (error) {
            console.error("Failed to generate Staff ID PDF:", error);
            errorToast(error, "Failed to download ID card PDF. Try printing instead.");
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = async () => {
        try {
            const html2canvas = (await import("html2canvas")).default;
            const element = cardRef.current;
            if (!element) return;

            const originalShadow = element.style.boxShadow;
            element.style.boxShadow = "none";

            const canvas = await html2canvas(element, {
                scale: 4,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                onclone: (clonedDoc) => {
                    const container = clonedDoc.getElementById("id-card-container-staff");
                    if (container) {
                        container.style.transform = "none";
                    }
                }
            });

            element.style.boxShadow = originalShadow;

            const imgData = canvas.toDataURL("image/png");
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.right = "0";
            iframe.style.bottom = "0";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "none";
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
                <html>
                    <head>
                        <title>Staff ID Card - ${fullName}</title>
                        <style>
                            @page {
                                size: 85.6mm 53.98mm;
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
                                background: transparent !important;
                                overflow: hidden;
                            }
                            img {
                                width: 85.6mm;
                                height: 53.98mm;
                                object-fit: contain;
                                display: block;
                                margin: auto;
                            }
                            @media print {
                                body { background: transparent !important; }
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${imgData}" alt="ID Card" />
                    </body>
                </html>
            `);
            doc.close();

            iframe.contentWindow.focus();
            setTimeout(() => {
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 300);
        } catch (err) {
            console.error("Print preparation failed:", err);
            errorToast("Failed to prepare print document. Try PDF download instead.");
        }
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
                    <AdminPanelSettings sx={{ color: "#c00000" }} />
                    <Typography variant="h6" fontWeight={700} fontSize="1.1rem">
                        Digital Staff / Administrator ID Card
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 4, px: { xs: 1, sm: 3 }, bgcolor: "#f8fafc", textAlign: "center" }}>
                {/* Side Selector Tabs */}
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: { xs: 3, sm: 3 }, mb: { xs: 5, sm: 4 } }}>
                    <Button
                        size="small"
                        variant={activeSide === "front" ? "contained" : "outlined"}
                        onClick={() => setActiveSide("front")}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, bgcolor: activeSide === "front" ? "#c00000" : "transparent", color: activeSide === "front" ? "white" : "#c00000", borderColor: "#c00000", "&:hover": { bgcolor: activeSide === "front" ? "#900000" : "rgba(192,0,0,0.05)", borderColor: "#900000" } }}
                    >
                        Front Side
                    </Button>
                    <Button
                        size="small"
                        variant={activeSide === "back" ? "contained" : "outlined"}
                        onClick={() => setActiveSide("back")}
                        startIcon={<Flip fontSize="small" />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, bgcolor: activeSide === "back" ? "#c00000" : "transparent", color: activeSide === "back" ? "white" : "#c00000", borderColor: "#c00000", "&:hover": { bgcolor: activeSide === "back" ? "#900000" : "rgba(192,0,0,0.05)", borderColor: "#900000" } }}
                    >
                        Back Side
                    </Button>
                </Box>

                {/* ID Card Display Area (CR80 ratio: 480x303) */}
                <Box
                    id="id-card-container-staff"
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        py: { xs: 0, sm: 1 },
                        mb: { xs: 4, sm: 4 },
                        transform: { xs: "scale(0.7)", sm: "scale(0.85)", md: "scale(1)" },
                        transformOrigin: "center top",
                        height: { xs: "220px", sm: "270px", md: "320px" },
                    }}
                >
                    <div
                        ref={cardRef}
                        style={{
                            width: "480px",
                            height: "303px",
                            borderRadius: "16px",
                            border: "1.5px solid #111111",
                            boxShadow: "0 20px 35px -10px rgba(15, 23, 42, 0.3)",
                            position: "relative",
                            overflow: "hidden",
                            background: "#ffffff",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23000000' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                            color: "#111111",
                            boxSizing: "border-box",
                            fontFamily: "Inter, Roboto, sans-serif",
                            userSelect: "none",
                            flexShrink: 0,
                        }}
                    >
                        {activeSide === "front" ? (
                            /* ================= FRONT SIDE ================= */
                            <>
                                {/* Geometric Background Shapes via SVG */}
                                <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, zIndex: 1, pointerEvents: "none" }}>
                                    {/* === TOP LEFT BANNER (Red -> White -> Red -> Black + Gold Ribbon) === */}
                                    <polygon points="0,0 35,0 0,35" fill="#c00000" />
                                    <polygon points="35,0 37.5,0 0,37.5 0,35" fill="#ffffff" />
                                    <polygon points="37.5,0 65,0 0,65 0,37.5" fill="#c00000" />
                                    <polygon points="65,0 85,0 0,85 0,65" fill="#111111" />
                                    <line x1="85" y1="0" x2="0" y2="85" stroke="#B89947" strokeWidth="2.5" />
                                    
                                    {/* === TOP RIGHT BANNER (Black triangle with Gold Ribbon outline & Rich Circuit Traces) === */}
                                    <polygon points="480,0 360,0 480,120" fill="#B89947" />
                                    <polygon points="480,0 368,0 480,112" fill="#111111" />
                                    
                                    {/* Circuit Traces Network */}
                                    <g stroke="#B89947" strokeWidth="1.2" fill="none" opacity="0.95">
                                        <path d="M475,12 L445,12 L425,32 L425,58" />
                                        <circle cx="425" cy="58" r="2.5" fill="#B89947" stroke="none" />
                                        
                                        <path d="M475,26 L452,26 L440,38 L440,72" />
                                        <circle cx="440" cy="72" r="2.5" fill="#B89947" stroke="none" />
                                        
                                        <path d="M475,40 L458,40 L448,50 L448,84" />
                                        <circle cx="448" cy="84" r="2" fill="#B89947" stroke="none" />

                                        <path d="M425,22 L410,22 L400,32" />
                                        <circle cx="400" cy="32" r="2" fill="#B89947" stroke="none" />

                                        <circle cx="445" cy="12" r="2" fill="#B89947" stroke="none" />
                                        <circle cx="452" cy="26" r="2" fill="#B89947" stroke="none" />
                                        <circle cx="458" cy="40" r="2" fill="#B89947" stroke="none" />
                                    </g>

                                    {/* === BOTTOM BANNER === */}
                                    <path d="M0,230 C 0,260 45,282 140,303 L0,303 Z" fill="#c00000" />
                                    <path d="M0,230 C 0,260 45,282 140,303 L134,303 C 42,282 0,262 0,235 Z" fill="#B89947" />

                                    <path d="M100,303 C 180,268 310,265 480,238 L480,242 C 312,269 183,272 105,303 Z" fill="#B89947" />
                                    <path d="M105,303 C 183,272 312,269 480,242 L480,303 Z" fill="#111111" />
                                </svg>

                                {/* Header text */}
                                <div style={{ position: "absolute", top: 2, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
                                    <div style={{ lineHeight: 1, fontFamily: "'Germania One', cursive, sans-serif" }}>
                                        <span style={{ color: "#c00000", fontSize: "36px", fontWeight: 400 }}>S</span>
                                        <span style={{ color: "#111111", fontSize: "27px", fontWeight: 400, letterSpacing: "0px" }}>tephotec</span>
                                    </div>
                                    <div style={{ color: "#111111", fontSize: "11.5px", fontWeight: 400, marginTop: "0px", letterSpacing: "0.5px", fontFamily: "'Germania One', cursive, sans-serif" }}>
                                        Computer Technologies Ltd
                                    </div>
                                </div>

                                {/* Profile Photo */}
                                <div style={{ position: "absolute", top: 74, left: 20, width: "125px", height: "125px", border: "2.5px solid #B89947", borderRadius: "12px", overflow: "hidden", backgroundColor: "#e2e8f0", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                                    {profilePic ? (
                                        <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)" }}>
                                            <Person sx={{ fontSize: 55, color: "#64748b" }} />
                                        </div>
                                    )}
                                </div>

                                {/* Info Fields */}
                                <div style={{ position: "absolute", top: 70, left: 160, right: 20, zIndex: 10, display: "flex", flexDirection: "column", gap: "9px" }}>
                                    
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                            <Person sx={{ fontSize: 14 }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#111", marginBottom: "1px" }}>STAFF / INSTRUCTOR NAME</div>
                                            <div style={{ borderBottom: "1px dashed #cbd5e1", fontSize: "13px", fontWeight: 700, color: "#333", paddingBottom: "2px", lineHeight: 1.2, fontFamily: '"Ancizar Sans", "Inter", sans-serif', textTransform: "uppercase" }}>{fullName}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                            <BadgeIcon sx={{ fontSize: 14 }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#111", marginBottom: "1px" }}>STAFF / EMPLOYEE ID</div>
                                            <div style={{ borderBottom: "1px dashed #cbd5e1", fontSize: "13px", fontWeight: 700, color: "#333", paddingBottom: "2px", lineHeight: 1.2, fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>{username}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                            <Work sx={{ fontSize: 14 }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#111", marginBottom: "1px" }}>DESIGNATION / ROLE</div>
                                            <div style={{ borderBottom: "1px dashed #cbd5e1", fontSize: "11.5px", fontWeight: 700, color: "#c00000", paddingBottom: "3px", lineHeight: 1.3, fontFamily: '"Ancizar Sans", "Inter", sans-serif', whiteSpace: "nowrap", overflow: "visible" }}>
                                                {roleTitle}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horizontal Divider Line */}
                                    <div style={{ width: "100%", borderBottom: "1.5px solid #B89947", marginTop: "1px", marginBottom: "1px" }} />

                                    {/* Dates Row */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                        {/* Issue Date */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                                <CalendarToday sx={{ fontSize: 13 }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "8px", fontWeight: 800, color: "#111", lineHeight: 1.1 }}>ISSUE DATE</div>
                                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#c00000", lineHeight: 1.2, fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>{issueDateStr}</div>
                                            </div>
                                        </div>

                                        {/* Vertical Gold Divider */}
                                        <div style={{ width: "1.5px", backgroundColor: "#B89947", height: "24px", flexShrink: 0 }} />

                                        {/* Expiry Date */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, paddingLeft: "4px" }}>
                                            <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                                <CalendarToday sx={{ fontSize: 13 }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "8px", fontWeight: 800, color: "#111", lineHeight: 1.1 }}>EXPIRY DATE</div>
                                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#c00000", lineHeight: 1.2, fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>DD / MM / YYYY</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                                {/* Footer Website Link */}
                                <div style={{ position: "absolute", bottom: 12, left: 90, right: 0, textAlign: "center", zIndex: 10, color: "white", fontSize: "10px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <div style={{ display: "flex", alignItems: "center", height: "13px" }}>
                                        <Language sx={{ fontSize: 13, color: "#B89947" }} />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", height: "13px", lineHeight: "13px" }}>
                                        www.stephotec.com
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* ================= BACK SIDE ================= */
                            <>
                                {/* Row 1: Top School Name Header Banner */}
                                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "32px", backgroundColor: "#111111", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <div style={{ color: "white", fontWeight: 800, fontSize: "12px", letterSpacing: "0.8px", fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>
                                        STEPHOTEC COMPUTER TECHNOLOGIES LIMITED
                                    </div>
                                </div>
                                <div style={{ position: "absolute", top: 0, left: 0, width: "36px", height: "32px", background: "#c00000", clipPath: "polygon(0 0, 100% 0, 0 100%)", zIndex: 3 }} />
                                <div style={{ position: "absolute", top: 0, right: 0, width: "36px", height: "32px", background: "#c00000", clipPath: "polygon(0 0, 100% 0, 100% 100%)", zIndex: 3 }} />
                                <div style={{ position: "absolute", top: 0, left: 0, width: "42px", height: "32px", background: "#B89947", clipPath: "polygon(0 0, 100% 0, 0 100%)", zIndex: 2 }} />
                                <div style={{ position: "absolute", top: 0, right: 0, width: "42px", height: "32px", background: "#B89947", clipPath: "polygon(0 0, 100% 0, 100% 100%)", zIndex: 2 }} />

                                {/* Main Content Area */}
                                <div style={{ position: "absolute", top: 32, bottom: 24, left: 0, right: 0, padding: "8px 14px", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    
                                    {/* Watermark Logo */}
                                    <div style={{ position: "absolute", top: "45px", left: "90px", display: "flex", alignItems: "center", opacity: 0.05, transform: "rotate(-10deg)", pointerEvents: "none" }}>
                                        <div style={{ color: "#c00000", fontSize: "70px", fontWeight: 900, lineHeight: 1 }}>S</div>
                                        <div style={{ marginLeft: "4px" }}>
                                            <div style={{ color: "#111", fontSize: "24px", fontWeight: 800 }}>tephotec</div>
                                            <div style={{ color: "#111", fontSize: "10px", fontWeight: 700 }}>Computer Technologies Ltd</div>
                                        </div>
                                    </div>

                                    {/* Row 2: Contact Info & QR Code */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
                                        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, marginRight: "8px" }}>
                                                    <LocationOn sx={{ fontSize: 11 }} />
                                                </div>
                                                <div style={{ fontSize: "9px", fontWeight: 700, color: "#111", lineHeight: 1.2, fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>
                                                    141, Idi-Iroko Road, Oju-Ore, Ota, Ogun State
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, marginRight: "8px" }}>
                                                    <Phone sx={{ fontSize: 11 }} />
                                                </div>
                                                <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#111", fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>
                                                    07035631513
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, marginRight: "8px" }}>
                                                    <Email sx={{ fontSize: 11 }} />
                                                </div>
                                                <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#111", fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>
                                                    info@stephotec.com
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#c00000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, marginRight: "8px" }}>
                                                    <Language sx={{ fontSize: 11 }} />
                                                </div>
                                                <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#111", fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>
                                                    www.stephotec.com
                                                </div>
                                            </div>
                                        </div>

                                        {/* QR Code & authentic seal */}
                                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, marginLeft: "12px" }}>
                                            <div style={{ width: "68px", height: "68px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "3px", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", marginRight: "8px" }}>
                                                <img src={qrCodeUrl} alt="QR Code" style={{ width: "100%", height: "100%" }} />
                                            </div>

                                            <div style={{ width: "42px", height: "42px", flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #f8fafc 100%)", border: "1px dashed #94a3b8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 8px rgba(255,255,255,1), 0 2px 4px rgba(0,0,0,0.08)" }}>
                                                <div style={{ fontSize: "5px", fontWeight: 800, color: "#64748b" }}>VERIFIED</div>
                                                <div style={{ fontSize: "14px", fontWeight: 900, color: "#334155", lineHeight: 1 }}>S</div>
                                                <div style={{ fontSize: "5px", fontWeight: 800, color: "#64748b" }}>AUTHENTIC</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Our Mission Box */}
                                    <div style={{ border: "1.5px solid #B89947", borderRadius: "8px", padding: "6px 10px", display: "flex", alignItems: "center", background: "rgba(255,255,255,0.95)", zIndex: 1 }}>
                                        <TrackChanges sx={{ fontSize: 24, color: "#B89947", flexShrink: 0, marginRight: "8px" }} />
                                        <div>
                                            <div style={{ color: "#c00000", fontSize: "9.5px", fontWeight: 800, marginBottom: "1px" }}>OUR MISSION</div>
                                            <div style={{ fontSize: "7.8px", color: "#333", fontWeight: 600, lineHeight: 1.3, fontFamily: '"Ancizar Sans", "Inter", sans-serif' }}>
                                                Empowering individuals and organizations through world-class technology training, innovative solutions, and continuous excellence.<br/>
                                                <strong style={{ color: "#111" }}>Building Skills. Creating Futures. Driving Innovation.</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 4: Emergency Contact Box */}
                                    <div style={{ background: "#c00000", borderRadius: "8px", padding: "6px 10px", display: "flex", alignItems: "center", color: "white", zIndex: 1 }}>
                                        <div style={{ width: 24, height: 24, background: "white", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "10px" }}>
                                            <Add sx={{ color: "#c00000", fontSize: 20, fontWeight: "bold" }} />
                                        </div>
                                        <div style={{ flexShrink: 0, marginRight: "10px" }}>
                                            <div style={{ fontSize: "9px", fontWeight: 800, lineHeight: 1.15 }}>EMERGENCY<br/>CONTACT</div>
                                        </div>
                                        <div style={{ width: "1.5px", background: "rgba(255,255,255,0.4)", height: "22px", flexShrink: 0, marginRight: "10px" }} />
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                            <div style={{ display: "flex", fontSize: "8.5px", fontWeight: 600, alignItems: "flex-end", marginBottom: "4px" }}>
                                                <span style={{ width: "68px" }}>Name :</span>
                                                <span style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.6)", height: "8px" }}></span>
                                            </div>
                                            <div style={{ display: "flex", fontSize: "8.5px", fontWeight: 600, alignItems: "flex-end", marginBottom: "4px" }}>
                                                <span style={{ width: "68px" }}>Relationship :</span>
                                                <span style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.6)", height: "8px" }}></span>
                                            </div>
                                            <div style={{ display: "flex", fontSize: "8.5px", fontWeight: 600, alignItems: "flex-end" }}>
                                                <span style={{ width: "68px" }}>Phone :</span>
                                                <span style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.6)", height: "8px" }}></span>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Row 5: Bottom Footer Disclaimer */}
                                <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "24px", backgroundColor: "#111111", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Lock sx={{ color: "#B89947", fontSize: 13, marginRight: "8px" }} />
                                    <div style={{ color: "#94a3b8", fontSize: "7.5px", fontWeight: 500, lineHeight: 1.2 }}>
                                        This card is the property of Stephotec Computer Technologies Limited. It must be returned upon request or termination of employment.
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 }, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1.5, sm: 1 }, "& > button": { m: "0 !important", width: { xs: "100%", sm: "auto" } } }}>
                <Button onClick={onClose} color="inherit" sx={{ width: { xs: "100%", sm: "auto" } }}>
                    Close
                </Button>
                <Button
                    onClick={handlePrint}
                    variant="outlined"
                    startIcon={<Print />}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, width: { xs: "100%", sm: "auto" } }}
                >
                    Print Card
                </Button>
                <Button
                    onClick={handleDownloadPDF}
                    variant="contained"
                    disabled={downloading}
                    startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, bgcolor: "#c00000", "&:hover": { bgcolor: "#900000" }, width: { xs: "100%", sm: "auto" } }}
                >
                    {downloading ? "Generating PDF..." : "Download PDF ID Card"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
