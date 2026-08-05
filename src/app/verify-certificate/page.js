"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Chip,
    CircularProgress,
    Container,
    Stack,
    Divider,
} from "@mui/material";
import {
    WorkspacePremium,
    Search,
    School,
    CheckCircle,
    Cancel,
    Download,
    Home,
    Verified,
} from "@mui/icons-material";
import api from "@/lib/axios";

function VerifyCertificateContent() {
    const searchParams = useSearchParams();
    const certParam = searchParams.get("cert") || searchParams.get("number") || searchParams.get("id") || searchParams.get("query") || "";

    const [searchInput, setSearchInput] = useState(certParam);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const verifyCertificate = async (queryToVerify) => {
        if (!queryToVerify || !queryToVerify.trim()) return;
        try {
            setLoading(true);
            setErrorMsg("");
            setResult(null);

            const response = await api.get(`/learning/certificates/verify/?cert=${encodeURIComponent(queryToVerify.trim())}`);
            setResult(response.data);
        } catch (err) {
            console.error("Certificate verification failed:", err);
            const detail = err?.response?.data?.detail || "No official certificate record found matching this reference number.";
            setErrorMsg(detail);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (certParam) {
            verifyCertificate(certParam);
        }
    }, [certParam]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        verifyCertificate(searchInput);
    };

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
            {/* Header / Logo */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 1, bgcolor: "white", p: 1.5, px: 3, borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                    <img src="/logos/slogo.png" alt="Stephotec Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    <Box sx={{ textAlign: "left" }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2, color: "slate.900" }}>
                            STEPHOTEC
                        </Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.65rem", color: "#d97706", letterSpacing: 0.8 }}>
                            COMPUTER TECHNOLOGIES LTD
                        </Typography>
                    </Box>
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mt: 2 }}>
                    Certificate Verification Portal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Authenticate official diplomas, completion certificates, and academic credentials
                </Typography>
            </Box>

            {/* Search Input Box */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", mb: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                <form onSubmit={handleSearchSubmit}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter Certificate Number (e.g. ST-CERT-2026-0001)..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !searchInput.trim()}
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
                            sx={{ borderRadius: 2.5, px: 3, textTransform: "none", fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" }, flexShrink: 0 }}
                        >
                            {loading ? "Verifying..." : "Verify Certificate"}
                        </Button>
                    </Stack>
                </form>
            </Paper>

            {/* Verification Result Area */}
            {loading && (
                <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={40} sx={{ color: "#d97706", mb: 2 }} />
                    <Typography fontWeight={600} color="text.secondary">
                        Searching Stephotec academic registry...
                    </Typography>
                </Box>
            )}

            {!loading && result && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 4,
                        border: "2px solid #eab308",
                        bgcolor: "#ffffff",
                        boxShadow: "0 20px 40px -10px rgba(234, 179, 8, 0.18)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Top Gold Verification Banner */}
                    <Box
                        sx={{
                            bgcolor: "#fef3c7",
                            color: "#92400e",
                            py: 1.5,
                            px: 3,
                            mx: -4,
                            mt: -4,
                            mb: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            borderBottom: "1px solid #fde68a",
                        }}
                    >
                        <Verified sx={{ fontSize: 22, color: "#d97706" }} />
                        <Typography fontWeight={800} fontSize="0.95rem" letterSpacing={0.5}>
                            OFFICIAL VERIFIED CERTIFICATE
                        </Typography>
                    </Box>

                    {/* Certificate Crest & Title */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        <Box sx={{ display: "inline-flex", p: 2, bgcolor: "#fffbeb", borderRadius: "50%", border: "2px solid #fcd34d", mb: 1.5, color: "#d97706" }}>
                            <WorkspacePremium sx={{ fontSize: 48 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} color="slate.900" sx={{ lineHeight: 1.3 }}>
                            {result.title}
                        </Typography>
                        <Chip
                            label={`Status: ${result.status}`}
                            color={result.status === "ISSUED" ? "success" : "warning"}
                            size="small"
                            sx={{ mt: 1.5, fontWeight: 700, px: 1 }}
                        />
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    {/* Details Stack */}
                    <Stack spacing={2}>
                        <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                Awarded To
                            </Typography>
                            <Typography variant="h6" fontWeight={800} color="slate.900">
                                {result.student_name}
                            </Typography>
                            <Typography variant="caption" color="primary.main" fontWeight={700} fontFamily="monospace">
                                Student ID: {result.student_id}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                    Certificate Ref Number
                                </Typography>
                                <Typography variant="body2" fontWeight={800} color="slate.900" fontFamily="monospace">
                                    {result.certificate_number}
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                    Program Course
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="slate.900">
                                    {result.course_name}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                    Issued Date
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="slate.900">
                                    {result.issued_date || result.earned_date || "—"}
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                    Signatory Issuer
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="slate.900">
                                    {result.issuer}
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>

                    {result.file_url && (
                        <Box sx={{ mt: 3, textAlign: "center" }}>
                            <Button
                                component="a"
                                href={result.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="contained"
                                startIcon={<Download />}
                                sx={{
                                    borderRadius: 2.5,
                                    py: 1.2,
                                    px: 3,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    bgcolor: "#10b981",
                                    "&:hover": { bgcolor: "#059669" },
                                }}
                            >
                                View / Download Certificate File
                            </Button>
                        </Box>
                    )}

                    <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                        <Typography variant="caption" color="text.disabled" display="block">
                            Verified on {result.verification_date}
                        </Typography>
                    </Box>
                </Paper>
            )}

            {!loading && errorMsg && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        border: "2px solid #ef4444",
                        bgcolor: "#ffffff",
                        textAlign: "center",
                    }}
                >
                    <Cancel sx={{ fontSize: 54, color: "#ef4444", mb: 1 }} />
                    <Typography variant="h6" fontWeight={800} color="error.main" mb={1}>
                        Certificate Not Verified
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        {errorMsg}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        Please check the Certificate Number on the document and try again.
                    </Typography>
                </Paper>
            )}

            {/* Return Link */}
            <Box sx={{ mt: 4, textAlign: "center" }}>
                <Button
                    component="a"
                    href="https://stephotec.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<Home />}
                    sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
                >
                    Return to Stephotec Website
                </Button>
            </Box>
        </Container>
    );
}

export default function VerifyCertificatePage() {
    return (
        <Suspense fallback={
            <Box sx={{ py: 10, textAlign: "center" }}>
                <CircularProgress />
            </Box>
        }>
            <VerifyCertificateContent />
        </Suspense>
    );
}
