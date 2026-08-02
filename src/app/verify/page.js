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
    Avatar,
    CircularProgress,
    Container,
    Card,
    CardContent,
    Stack,
    Divider,
} from "@mui/material";
import {
    VerifiedUser,
    Search,
    School,
    Badge as BadgeIcon,
    Cancel,
    CheckCircle,
    Home,
} from "@mui/icons-material";
import api from "@/lib/axios";
import Link from "next/link";

function VerifyContent() {
    const searchParams = useSearchParams();
    const studentParam = searchParams.get("student") || searchParams.get("id") || searchParams.get("query") || "";

    const [searchInput, setSearchInput] = useState(studentParam);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const verifyStudent = async (queryToVerify) => {
        if (!queryToVerify || !queryToVerify.trim()) return;
        try {
            setLoading(true);
            setErrorMsg("");
            setResult(null);

            const response = await api.get(`/student/verify/?student=${encodeURIComponent(queryToVerify.trim())}`);
            setResult(response.data);
        } catch (err) {
            console.error("Verification failed:", err);
            const detail = err?.response?.data?.detail || "No official student record found matching this ID.";
            setErrorMsg(detail);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentParam) {
            verifyStudent(studentParam);
        }
    }, [studentParam]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        verifyStudent(searchInput);
    };

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
            {/* Header / Logo */}
            <Box sx={{ textCenter: "center", textAlign: "center", mb: 4 }}>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 1, bgcolor: "white", p: 1.5, px: 3, borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                    <img src="/logos/slogo.png" alt="Stephotec Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    <Box sx={{ textAlign: "left" }}>
                        <Typography fontWeight={800} fontSize="1.1rem" lineHeight={1.2} color="slate.900">
                            STEPHOTEC
                        </Typography>
                        <Typography fontWeight={700} fontSize="0.65rem" color="#7c3aed" letterSpacing={0.8}>
                            COMPUTER TECHNOLOGIES LTD
                        </Typography>
                    </Box>
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mt: 2 }}>
                    Official Credentials Verification
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Verify student identity, course enrollment, and credentials
                </Typography>
            </Box>

            {/* Search Input Box */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", mb: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                <form onSubmit={handleSearchSubmit}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter Student ID / Username (e.g. SE/26/0001)..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !searchInput.trim()}
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
                            sx={{ borderRadius: 2.5, px: 3, textTransform: "none", fontWeight: 700, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" }, flexShrink: 0 }}
                        >
                            {loading ? "Verifying..." : "Verify ID"}
                        </Button>
                    </Stack>
                </form>
            </Paper>

            {/* Verification Result Area */}
            {loading && (
                <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={40} sx={{ color: "#7c3aed", mb: 2 }} />
                    <Typography fontWeight={600} color="text.secondary">
                        Searching Stephotec student directory...
                    </Typography>
                </Box>
            )}

            {!loading && result && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 4,
                        border: "2px solid #22c55e",
                        bgcolor: "#ffffff",
                        boxShadow: "0 20px 40px -10px rgba(34, 197, 94, 0.15)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Top Green Verified Banner */}
                    <Box
                        sx={{
                            bgcolor: "#dcfce7",
                            color: "#15803d",
                            py: 1.5,
                            px: 3,
                            mx: -4,
                            mt: -4,
                            mb: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            borderBottom: "1px solid #bbf7d0",
                        }}
                    >
                        <CheckCircle sx={{ fontSize: 22 }} />
                        <Typography fontWeight={800} fontSize="0.95rem" letterSpacing={0.5}>
                            OFFICIAL VERIFIED STUDENT
                        </Typography>
                    </Box>

                    {/* Student Info Card */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3, flexDirection: { xs: "column", sm: "row" }, textAlign: { xs: "center", sm: "left" } }}>
                        <Avatar
                            src={result.profile_picture_url}
                            sx={{
                                width: 84,
                                height: 84,
                                bgcolor: "#2563eb",
                                fontSize: 32,
                                fontWeight: 800,
                                border: "3px solid #7c3aed",
                                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.2)",
                            }}
                        >
                            {result.first_name?.charAt(0)?.toUpperCase() || "S"}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={800} color="slate.900">
                                {result.full_name}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={700} fontFamily="monospace" sx={{ mt: 0.5 }}>
                                Student ID: {result.username}
                            </Typography>
                            <Chip
                                label={result.status || "ACTIVE"}
                                color={result.status === "ACTIVE" ? "success" : "warning"}
                                size="small"
                                sx={{ mt: 1, fontWeight: 700, px: 1 }}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    {/* Details Grid */}
                    <Stack spacing={2}>
                        <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                Primary Course Program
                            </Typography>
                            <Typography variant="body1" fontWeight={700} color="slate.900">
                                {result.primary_course}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                    Admission Year
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="slate.900">
                                    {result.admission_year || "—"}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                    Institution
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="slate.900" sx={{ fontSize: "0.8rem" }}>
                                    Stephotec Computer Tech Ltd
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>

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
                        Record Not Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        {errorMsg}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        Please verify the Student ID or Username and try again.
                    </Typography>
                </Paper>
            )}

            {/* Back Home Link */}
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

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <Box sx={{ py: 10, textAlign: "center" }}>
                <CircularProgress />
            </Box>
        }>
            <VerifyContent />
        </Suspense>
    );
}
