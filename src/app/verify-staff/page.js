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
    Stack,
    Divider,
} from "@mui/material";
import {
    AdminPanelSettings,
    Search,
    CheckCircle,
    Cancel,
    Home,
    VerifiedUser,
} from "@mui/icons-material";
import api from "@/lib/axios";

function VerifyStaffContent() {
    const searchParams = useSearchParams();
    const staffParam = searchParams.get("staff") || searchParams.get("username") || searchParams.get("query") || searchParams.get("id") || "";

    const [searchInput, setSearchInput] = useState(staffParam);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const verifyStaff = async (queryToVerify) => {
        if (!queryToVerify || !queryToVerify.trim()) return;
        try {
            setLoading(true);
            setErrorMsg("");
            setResult(null);

            const response = await api.get(`/staff/verify/?staff=${encodeURIComponent(queryToVerify.trim())}`);
            setResult(response.data);
        } catch (err) {
            console.error("Staff verification failed:", err);
            const detail = err?.response?.data?.detail || "No official Staff / Administrator record found matching this ID.";
            setErrorMsg(detail);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (staffParam) {
            verifyStaff(staffParam);
        }
    }, [staffParam]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        verifyStaff(searchInput);
    };

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
            {/* Header / Logo */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 1, bgcolor: "white", p: 1.5, px: 3, borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                    <img src="/logos/slogo.png" alt="Stephotec Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    <Box sx={{ textAlign: "left" }}>
                        <Typography fontWeight={800} fontSize="1.1rem" lineHeight={1.2} color="slate.900">
                            STEPHOTEC
                        </Typography>
                        <Typography fontWeight={700} fontSize="0.65rem" color="#d97706" letterSpacing={0.8}>
                            COMPUTER TECHNOLOGIES LTD
                        </Typography>
                    </Box>
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mt: 2 }}>
                    Staff / Administrator Verification
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Verify official academic staff and administrator credentials
                </Typography>
            </Box>

            {/* Search Input Box */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", mb: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                <form onSubmit={handleSearchSubmit}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter Staff ID / Username (e.g. STAFF0001)..."
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
                            {loading ? "Verifying..." : "Verify Staff"}
                        </Button>
                    </Stack>
                </form>
            </Paper>

            {/* Verification Result Area */}
            {loading && (
                <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={40} sx={{ color: "#d97706", mb: 2 }} />
                    <Typography fontWeight={600} color="text.secondary">
                        Searching Stephotec staff registry...
                    </Typography>
                </Box>
            )}

            {!loading && result && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 4,
                        border: "2px solid #d97706",
                        bgcolor: "#ffffff",
                        boxShadow: "0 20px 40px -10px rgba(217, 119, 6, 0.15)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Top Gold Staff Banner */}
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
                        <AdminPanelSettings sx={{ fontSize: 24, color: "#d97706" }} />
                        <Typography fontWeight={800} fontSize="0.95rem" letterSpacing={0.5}>
                            OFFICIAL VERIFIED STAFF / ADMINISTRATOR
                        </Typography>
                    </Box>

                    {/* Staff Info Card */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3, flexDirection: { xs: "column", sm: "row" }, textAlign: { xs: "center", sm: "left" } }}>
                        <Avatar
                            src={result.profile_picture_url}
                            sx={{
                                width: 84,
                                height: 84,
                                bgcolor: "#0f172a",
                                fontSize: 32,
                                fontWeight: 800,
                                border: "3px solid #d97706",
                                boxShadow: "0 4px 14px rgba(217, 119, 6, 0.25)",
                            }}
                        >
                            {result.first_name?.charAt(0)?.toUpperCase() || "A"}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={800} color="slate.900">
                                {result.full_name}
                            </Typography>
                            <Typography variant="body2" color="warning.main" fontWeight={800} fontFamily="monospace" sx={{ mt: 0.5 }}>
                                Staff ID: {result.username}
                            </Typography>
                            <Chip
                                label={result.role || "SYSTEM ADMINISTRATOR"}
                                color="warning"
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
                                Email Address
                            </Typography>
                            <Typography variant="body1" fontWeight={700} color="slate.900">
                                {result.email}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                                    Status
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="success.main">
                                    {result.status || "ACTIVE"}
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
                        Staff Record Not Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        {errorMsg}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        Please verify the Staff Username / ID and try again.
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

export default function VerifyStaffPage() {
    return (
        <Suspense fallback={
            <Box sx={{ py: 10, textAlign: "center" }}>
                <CircularProgress />
            </Box>
        }>
            <VerifyStaffContent />
        </Suspense>
    );
}
