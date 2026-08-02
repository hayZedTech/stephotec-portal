"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/axios";
import { errorToast, successToast } from "@/lib/toast";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Paper,
    Chip,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
} from "@mui/material";
import {
    School,
    Download,
    Visibility,
    PlayCircle,
    Description,
    CardGiftcard,
    MenuBook,
    ShoppingCart,
    CheckCircle,
    HourglassEmpty,
    AccountBalance,
    Info,
    Quiz as QuizIcon,
    PlayArrow,
    WorkspacePremium,
    Print,
} from "@mui/icons-material";
import CertificateModal from "@/components/common/CertificateModal";
import QuizPlayerModal from "@/components/quizzes/QuizPlayerModal";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function LearningPage() {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);

    // Learning Content State
    const [contents, setContents] = useState([]);
    const [filteredContents, setFilteredContents] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [viewContentOpen, setViewContentOpen] = useState(false);
    const [searchTermContent, setSearchTermContent] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterCourse, setFilterCourse] = useState("");

    // Quizzes State
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [openQuizPlayer, setOpenQuizPlayer] = useState(false);

    // Handouts State
    const [handouts, setHandouts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [filteredHandouts, setFilteredHandouts] = useState([]);
    const [selectedHandout, setSelectedHandout] = useState(null);
    const [viewHandoutOpen, setViewHandoutOpen] = useState(false);
    const [searchTermHandouts, setSearchTermHandouts] = useState("");
    const [purchasingId, setPurchasingId] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [requestingHandout, setRequestingHandout] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([]);

    // Certificates State
    const [certificates, setCertificates] = useState([]);
    const [filteredCertificates, setFilteredCertificates] = useState([]);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [openCertModal, setOpenCertModal] = useState(false);
    const [searchTermCertificates, setSearchTermCertificates] = useState("");

    // Brochure State
    const [brochures, setBrochures] = useState([]);
    const [filteredBrochures, setFilteredBrochures] = useState([]);
    const [searchTermBrochures, setSearchTermBrochures] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadAllData();
        }
    }, [user, filterCourse]);

    useEffect(() => {
        applyContentFilters();
    }, [contents, searchTermContent, filterType, filterCourse]);

    useEffect(() => {
        applyHandoutFilters();
    }, [handouts, purchases, searchTermHandouts]);

    useEffect(() => {
        applyCertificateFilters();
    }, [certificates, searchTermCertificates]);

    useEffect(() => {
        applyBrochureFilters();
    }, [brochures, searchTermBrochures]);

    const loadAllData = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const courseId = filterCourse || user.courses?.[0]?.course?.id || "";

            const [contentRes, handoutsRes, purchasesRes, certsRes, bankAccountsRes, brochuresRes, quizzesRes] = await Promise.all([
                api.get("/learning/student-learning-content/student_content/", {
                    params: { student_id: user.id, course_id: courseId },
                }).catch(() => ({ data: [] })),
                api.get("/learning/handouts/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/handout-purchases/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/certificates/").catch(() => ({ data: { results: [] } })),
                api.get("/payments/bank-accounts/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/brochures/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/quizzes/").catch(() => ({ data: { results: [] } })),
            ]);

            // Transform learning content
            const contentData = contentRes.data.results || contentRes.data || [];
            const transformedContent = Array.isArray(contentData)
                ? contentData.map((item) => ({
                    id: item.learning_content,
                    title: item.learning_content_title,
                    description: item.description || "",
                    content_type: item.content_type || "",
                    file: item.file || null,
                    video_url: item.video_url || null,
                    course: { id: item.course_id, name: item.course_name },
                    assigned_at: item.assigned_at,
                    completed_at: item.completed_at,
                }))
                : [];
            setContents(transformedContent);

            // Handouts & Purchases
            const handoutsData = handoutsRes.data.results || handoutsRes.data || [];
            const purchasesData = purchasesRes.data.results || purchasesRes.data || [];
            setHandouts(Array.isArray(handoutsData) ? handoutsData : []);
            setPurchases(Array.isArray(purchasesData) ? purchasesData : []);

            // Certificates
            const certsData = certsRes.data.results || certsRes.data || [];
            setCertificates(Array.isArray(certsData) ? certsData : []);

            // Bank Accounts
            const bankData = bankAccountsRes.data.results || bankAccountsRes.data || [];
            setBankAccounts(Array.isArray(bankData) ? bankData : []);

            // Brochures
            const brochureData = brochuresRes.data.results || brochuresRes.data || [];
            setBrochures(Array.isArray(brochureData) ? brochureData : []);

            // Quizzes
            const quizData = quizzesRes.data.results || quizzesRes.data || [];
            setQuizzes(Array.isArray(quizData) ? quizData : []);
        } catch (error) {
            console.error("Failed to load student learning data:", error);
            errorToast(error, "Failed to load learning resources");
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const applyContentFilters = () => {
        let filtered = [...contents];
        if (searchTermContent) {
            const term = searchTermContent.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(term) ||
                    (item.description && item.description.toLowerCase().includes(term))
            );
        }
        if (filterType) {
            filtered = filtered.filter((item) => item.content_type === filterType);
        }
        setFilteredContents(filtered);
    };

    const applyHandoutFilters = () => {
        let filtered = [...handouts];
        if (searchTermHandouts) {
            const term = searchTermHandouts.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(term) ||
                    (item.description && item.description.toLowerCase().includes(term))
            );
        }
        setFilteredHandouts(filtered);
    };

    const applyCertificateFilters = () => {
        let filtered = [...certificates];
        if (searchTermCertificates) {
            const term = searchTermCertificates.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(term) ||
                    (item.certificate_number && item.certificate_number.toLowerCase().includes(term)) ||
                    (item.course_name && item.course_name.toLowerCase().includes(term))
            );
        }
        setFilteredCertificates(filtered);
    };

    const applyBrochureFilters = () => {
        let filtered = [...brochures];
        if (searchTermBrochures) {
            const term = searchTermBrochures.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(term) ||
                    (item.description && item.description.toLowerCase().includes(term)) ||
                    (item.course_name && item.course_name.toLowerCase().includes(term))
            );
        }
        setFilteredBrochures(filtered);
    };

    const handleOpenContent = (content) => {
        setSelectedContent(content);
        setViewContentOpen(true);
    };

    const handleOpenRequestModal = (handout) => {
        setRequestingHandout(handout);
        setPaymentModalOpen(true);
    };

    const handleConfirmHandoutRequest = async () => {
        if (!requestingHandout) return;
        try {
            setPurchasingId(requestingHandout.id);
            await api.post("/learning/handout-purchases/purchase/", {
                handout_id: requestingHandout.id,
            });
            successToast(
                `Payment request for "${requestingHandout.title}" submitted successfully! Please transfer the payment to complete order.`
            );
            setPaymentModalOpen(false);
            setRequestingHandout(null);
            const purchasesRes = await api.get("/learning/handout-purchases/");
            setPurchases(purchasesRes.data.results || purchasesRes.data || []);
        } catch (error) {
            errorToast(error, "Failed to submit handout request");
        } finally {
            setPurchasingId(null);
        }
    };

    const getHandoutPurchaseStatus = (handoutId) => {
        const p = purchases.find((item) => item.handout === handoutId);
        return p ? p.status : null;
    };

    const getContentIcon = (type) => {
        switch (type) {
            case "VIDEO":
                return <PlayCircle sx={{ fontSize: 24, color: "#ef4444" }} />;
            case "DOCUMENT":
                return <Description sx={{ fontSize: 24, color: "#3b82f6" }} />;
            case "ARTICLE":
                return <Description sx={{ fontSize: 24, color: "#8b5cf6" }} />;
            case "RESOURCE":
                return <Download sx={{ fontSize: 24, color: "#10b981" }} />;
            default:
                return <School sx={{ fontSize: 24, color: "#6b7280" }} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* LOADING OVERLAY */}
            {loading && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        backdropFilter: "blur(2px)",
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <CircularProgress size={48} />
                        <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                            Loading learning resources...
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Page Header */}
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Learning Portal
                </Typography>
                <Typography color="text.secondary">
                    Access assigned course materials, practice quizzes, study handouts, and earned certificates.
                </Typography>
            </div>

            {/* Navigation Tabs */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200" }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, val) => setTabValue(val)}
                    aria-label="Student learning tabs"
                    sx={{
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                        px: { xs: 1, sm: 3 },
                        "& .MuiTab-root": {
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            minHeight: { xs: 48, sm: 56 },
                            textTransform: "none",
                            fontWeight: 700,
                        },
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Learning Materials" icon={<MenuBook />} iconPosition="start" />
                    <Tab label="Quizzes & Practice Tests" icon={<QuizIcon />} iconPosition="start" />
                    <Tab label="Handouts & Study Materials" icon={<School />} iconPosition="start" />
                    <Tab label="My Certificates" icon={<WorkspacePremium />} iconPosition="start" />
                    <Tab label="Course Brochure / Outline" icon={<Description />} iconPosition="start" />
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* TAB 0: LEARNING MATERIALS */}
                    <TabPanel value={tabValue} index={0}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        placeholder="Search learning materials by title or description..."
                                        value={searchTermContent}
                                        onChange={(e) => setSearchTermContent(e.target.value)}
                                        size="small"
                                    />
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Content Type</InputLabel>
                                            <Select
                                                value={filterType}
                                                label="Content Type"
                                                onChange={(e) => setFilterType(e.target.value)}
                                            >
                                                <MenuItem value="">All Types</MenuItem>
                                                <MenuItem value="VIDEO">Video</MenuItem>
                                                <MenuItem value="DOCUMENT">Document</MenuItem>
                                                <MenuItem value="ARTICLE">Article</MenuItem>
                                                <MenuItem value="RESOURCE">Resource</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Stack>
                            </Paper>

                            {filteredContents.length > 0 ? (
                                <Grid container spacing={3}>
                                    {filteredContents.map((item) => (
                                        <Grid xs={12} sm={6} md={4} key={item.id}>
                                            <Card
                                                sx={{
                                                    borderRadius: 3,
                                                    border: "1px solid",
                                                    borderColor: "grey.200",
                                                    height: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    transition: "box-shadow 0.2s",
                                                    "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                                        <Chip
                                                            label={item.content_type}
                                                            size="small"
                                                            color={
                                                                item.content_type === "VIDEO"
                                                                    ? "error"
                                                                    : item.content_type === "DOCUMENT"
                                                                    ? "primary"
                                                                    : "secondary"
                                                            }
                                                        />
                                                        {getContentIcon(item.content_type)}
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={700} mb={1}>
                                                        {item.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                                        {item.description ? item.description.slice(0, 100) + "..." : "No description provided."}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        startIcon={<Visibility />}
                                                        onClick={() => handleOpenContent(item)}
                                                    >
                                                        View Material
                                                    </Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", p: 5, textAlign: "center" }}>
                                    <MenuBook sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">No learning materials found.</Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* TAB 1: QUIZZES & PRACTICE TESTS */}
                    <TabPanel value={tabValue} index={1}>
                        <Stack spacing={3}>
                            <Paper elevation={0} sx={{ p: 3, bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 3 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color="slate.900">
                                            100% Free Practice Tests & Quizzes
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Test your knowledge with instant scoring, countdown timers, and detailed explanations.
                                        </Typography>
                                    </Box>
                                    <Chip label="INCLUDED FREE" color="warning" sx={{ fontWeight: 800 }} />
                                </Box>
                            </Paper>

                            {quizzes.length > 0 ? (
                                <Grid container spacing={3}>
                                    {quizzes.map((quiz) => (
                                        <Grid xs={12} sm={6} md={4} key={quiz.id}>
                                            <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                                <CardContent>
                                                    <Chip label={quiz.course_name || "General"} size="small" color="primary" sx={{ mb: 1.5, fontWeight: 700 }} />
                                                    <Typography variant="h6" fontWeight={700} mb={1}>
                                                        {quiz.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                                        {quiz.description || "Practice test with instant score calculation."}
                                                    </Typography>
                                                    <Stack spacing={1} sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Duration: <strong>{quiz.duration_minutes} Mins</strong>
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Pass Score: <strong>{quiz.passing_score_percentage}%</strong>
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                                <Box sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        startIcon={<PlayArrow />}
                                                        onClick={() => {
                                                            setSelectedQuizId(quiz.id);
                                                            setOpenQuizPlayer(true);
                                                        }}
                                                        sx={{ bgcolor: "#0f172a", textTransform: "none", fontWeight: 700 }}
                                                    >
                                                        Start Practice Test
                                                    </Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                                    <QuizIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">No practice quizzes available at the moment.</Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* TAB 2: HANDOUTS & STUDY MATERIALS */}
                    <TabPanel value={tabValue} index={2}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
                                <TextField
                                    fullWidth
                                    placeholder="Search handouts by title or description..."
                                    value={searchTermHandouts}
                                    onChange={(e) => setSearchTermHandouts(e.target.value)}
                                    size="small"
                                />
                            </Paper>

                            {filteredHandouts.length > 0 ? (
                                <Grid container spacing={3}>
                                    {filteredHandouts.map((handout) => {
                                        const pStatus = getHandoutPurchaseStatus(handout.id);
                                        return (
                                            <Grid xs={12} sm={6} md={4} key={handout.id}>
                                                <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                                    <CardContent>
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                                            <Chip label={handout.course_name || "Handout"} size="small" color="secondary" />
                                                            <Typography variant="h6" fontWeight={700} color="primary.main">
                                                                ₦{parseFloat(handout.price || 0).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="h6" fontWeight={700} mb={1}>
                                                            {handout.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                                            {handout.description ? handout.description.slice(0, 100) + "..." : "No description provided."}
                                                        </Typography>
                                                    </CardContent>
                                                    <Box sx={{ p: 2, pt: 0 }}>
                                                        {pStatus === "COMPLETED" ? (
                                                            <Button fullWidth variant="contained" color="success" startIcon={<Download />} href={handout.file} target="_blank" rel="noopener noreferrer">
                                                                Download Handout
                                                            </Button>
                                                        ) : pStatus === "PENDING" ? (
                                                            <Button fullWidth variant="outlined" color="warning" startIcon={<HourglassEmpty />} disabled>
                                                                Payment Pending Confirmation
                                                            </Button>
                                                        ) : (
                                                            <Button fullWidth variant="contained" color="primary" startIcon={<ShoppingCart />} onClick={() => handleOpenRequestModal(handout)}>
                                                                Request / Purchase Handout
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                                    <School sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">No handouts available.</Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* TAB 3: MY CERTIFICATES */}
                    <TabPanel value={tabValue} index={3}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
                                <TextField
                                    fullWidth
                                    placeholder="Search certificates by title, course, or serial number..."
                                    value={searchTermCertificates}
                                    onChange={(e) => setSearchTermCertificates(e.target.value)}
                                    size="small"
                                />
                            </Paper>

                            {filteredCertificates.length > 0 ? (
                                <Grid container spacing={3}>
                                    {filteredCertificates.map((cert) => (
                                        <Grid xs={12} sm={6} md={4} key={cert.id}>
                                            <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                                <CardContent>
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                                        <Chip label={cert.status} color={cert.status === "ISSUED" ? "success" : "info"} size="small" />
                                                        <WorkspacePremium sx={{ color: "#d97706" }} />
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={700} mb={1}>
                                                        {cert.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" fontFamily="monospace" display="block">
                                                        No: {cert.certificate_number}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        startIcon={<WorkspacePremium />}
                                                        onClick={() => {
                                                            setSelectedCertificate(cert);
                                                            setOpenCertModal(true);
                                                        }}
                                                        sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" }, textTransform: "none", fontWeight: 700 }}
                                                    >
                                                        View / Generate Certificate
                                                    </Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                                    <WorkspacePremium sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">No certificates earned yet. Complete your courses to earn certificates!</Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* TAB 4: BROCHURES */}
                    <TabPanel value={tabValue} index={4}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
                                <TextField
                                    fullWidth
                                    placeholder="Search course brochures / outlines..."
                                    value={searchTermBrochures}
                                    onChange={(e) => setSearchTermBrochures(e.target.value)}
                                    size="small"
                                />
                            </Paper>

                            {filteredBrochures.length > 0 ? (
                                <Grid container spacing={3}>
                                    {filteredBrochures.map((b) => (
                                        <Grid xs={12} sm={6} md={4} key={b.id}>
                                            <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                                <CardContent>
                                                    <Typography variant="h6" fontWeight={700} mb={1}>{b.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{b.description}</Typography>
                                                </CardContent>
                                                <Box sx={{ p: 2, pt: 0 }}>
                                                    <Button fullWidth variant="outlined" startIcon={<Download />} href={b.file} target="_blank" rel="noopener noreferrer">
                                                        Download Brochure
                                                    </Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                                    <Description sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">No course brochures available.</Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>
                </Box>
            </Paper>

            {/* CERTIFICATE GENERATOR MODAL */}
            <CertificateModal
                open={openCertModal}
                onClose={() => setOpenCertModal(false)}
                certificate={selectedCertificate}
            />

            {/* QUIZ PLAYER MODAL */}
            <QuizPlayerModal
                open={openQuizPlayer}
                onClose={() => setOpenQuizPlayer(false)}
                quizId={selectedQuizId}
                onAttemptComplete={loadAllData}
            />
        </div>
    );
}
