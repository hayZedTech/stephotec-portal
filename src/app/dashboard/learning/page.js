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
} from "@mui/icons-material";

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
    const [viewCertOpen, setViewCertOpen] = useState(false);
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

            const [contentRes, handoutsRes, purchasesRes, certsRes, bankAccountsRes, brochuresRes] = await Promise.all([
                api.get("/learning/student-learning-content/student_content/", {
                    params: { student_id: user.id, course_id: courseId },
                }).catch(() => ({ data: [] })),
                api.get("/learning/handouts/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/handout-purchases/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/certificates/").catch(() => ({ data: { results: [] } })),
                api.get("/payments/bank-accounts/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/brochures/").catch(() => ({ data: { results: [] } })),
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
                    item.description.toLowerCase().includes(term)
            );
        }
        if (filterType) {
            filtered = filtered.filter((item) => item.content_type === filterType);
        }
        if (filterCourse) {
            filtered = filtered.filter((item) => item.course?.id === parseInt(filterCourse));
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
                    (item.title && item.title.toLowerCase().includes(term)) ||
                    (item.description && item.description.toLowerCase().includes(term)) ||
                    (item.course_name && item.course_name.toLowerCase().includes(term))
            );
        }
        setFilteredBrochures(filtered);
    };

    // Open Payment Modal
    const handleOpenPaymentModal = (handout) => {
        setRequestingHandout(handout);
        setPaymentModalOpen(true);
    };

    // Handout Purchase Handler
    const handlePurchaseHandout = async () => {
        if (!requestingHandout) return;
        try {
            setPurchasingId(requestingHandout.id);
            await api.post("/learning/handout-purchases/purchase/", {
                handout_id: requestingHandout.id,
            });
            successToast("Handout request submitted! Admin will confirm your payment.");
            setPaymentModalOpen(false);
            setRequestingHandout(null);
            // Reload purchases
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

    const coursesList = user?.courses || [];

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
                    Access assigned course materials, study handouts, and earned certificates.
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
                            fontWeight: 600,
                        },
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Learning Materials" icon={<MenuBook />} iconPosition="start" />
                    <Tab label="Handouts & Study Materials" icon={<School />} iconPosition="start" />
                    <Tab label="My Certificates" icon={<CardGiftcard />} iconPosition="start" />
                    <Tab label="Course Brochure / Outline" icon={<MenuBook />} iconPosition="start" />
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* TAB 0: LEARNING MATERIALS */}
                    <TabPanel value={tabValue} index={0}>
                        <Stack spacing={3}>
                            {/* Filter Bar */}
                            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        placeholder="Search learning materials by title or description..."
                                        value={searchTermContent}
                                        onChange={(e) => setSearchTermContent(e.target.value)}
                                        size="small"
                                    />
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <FormControl sx={{ minWidth: 150 }} size="small">
                                            <InputLabel>Content Type</InputLabel>
                                            <Select
                                                value={filterType}
                                                onChange={(e) => setFilterType(e.target.value)}
                                                label="Content Type"
                                            >
                                                <MenuItem value="">All Types</MenuItem>
                                                <MenuItem value="VIDEO">Videos</MenuItem>
                                                <MenuItem value="DOCUMENT">Documents</MenuItem>
                                                <MenuItem value="ARTICLE">Articles</MenuItem>
                                                <MenuItem value="RESOURCE">Resources</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl sx={{ minWidth: 150 }} size="small">
                                            <InputLabel>Course</InputLabel>
                                            <Select
                                                value={filterCourse}
                                                onChange={(e) => setFilterCourse(e.target.value)}
                                                label="Course"
                                            >
                                                <MenuItem value="">All Courses</MenuItem>
                                                {coursesList.map((course) => (
                                                    <MenuItem key={course.id} value={course.course.id}>
                                                        {course.course.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </Stack>
                            </Paper>

                            {/* Content Grid */}
                            {filteredContents.length > 0 ? (
                                <Grid container spacing={3}>
                                    {filteredContents.map((content) => (
                                        <Grid xs={12} sm={6} md={4} key={content.id}>
                                            <Card
                                                sx={{
                                                    borderRadius: 3,
                                                    border: "1px solid",
                                                    borderColor: "grey.200",
                                                    height: "100%",
                                                    transition: "all 0.3s ease",
                                                    "&:hover": {
                                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                                        transform: "translateY(-4px)",
                                                    },
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                                        {getContentIcon(content.content_type)}
                                                        <Chip label={content.content_type} size="small" variant="outlined" />
                                                    </Box>

                                                    <Typography variant="h6" fontWeight={700} mb={1}>
                                                        {content.title}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                                        {content.description || "No description"}
                                                    </Typography>

                                                    <Stack spacing={1} sx={{ mt: 2 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {content.course?.name || "Course"}
                                                        </Typography>
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            startIcon={<Visibility />}
                                                            onClick={() => {
                                                                setSelectedContent(content);
                                                                setViewContentOpen(true);
                                                            }}
                                                        >
                                                            View
                                                        </Button>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        p: 5,
                                        textAlign: "center",
                                    }}
                                >
                                    <School sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">
                                        No learning materials assigned yet.
                                    </Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* TAB 1: HANDOUTS & STUDY MATERIALS */}
                    <TabPanel value={tabValue} index={1}>
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
                                        const purchaseStatus = getHandoutPurchaseStatus(handout.id);
                                        const isFree = parseFloat(handout.price || 0) === 0;
                                        const isApproved = purchaseStatus === "COMPLETED";
                                        const isPending = purchaseStatus === "PENDING";

                                        let borderColor = "grey.200";
                                        if (isApproved) borderColor = "success.light";
                                        if (isPending) borderColor = "warning.light";

                                        return (
                                            <Grid xs={12} sm={6} md={4} key={handout.id}>
                                                <Card
                                                    sx={{
                                                        borderRadius: 3,
                                                        border: "1px solid",
                                                        borderColor,
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
                                                                label={isFree ? "FREE" : `₦${parseFloat(handout.price).toLocaleString()}`}
                                                                color={isFree ? "success" : "primary"}
                                                                size="small"
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                            {isApproved && (
                                                                <Chip
                                                                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                                                    label="Approved"
                                                                    color="success"
                                                                    size="small"
                                                                />
                                                            )}
                                                            {isPending && (
                                                                <Chip
                                                                    icon={<HourglassEmpty sx={{ fontSize: 14 }} />}
                                                                    label="Awaiting Approval"
                                                                    color="warning"
                                                                    size="small"
                                                                />
                                                            )}
                                                        </Box>

                                                        <Typography variant="h6" fontWeight={700} mb={1}>
                                                            {handout.title}
                                                        </Typography>

                                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                                            {handout.description || "No description provided."}
                                                        </Typography>
                                                    </CardContent>

                                                    <Box sx={{ p: 2, pt: 0 }}>
                                                        {(isApproved || isFree) ? (
                                                            <Button
                                                                fullWidth
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={<Download />}
                                                                href={handout.file}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Download Handout
                                                            </Button>
                                                        ) : isPending ? (
                                                            <Button
                                                                fullWidth
                                                                variant="outlined"
                                                                color="warning"
                                                                startIcon={<HourglassEmpty />}
                                                                disabled
                                                            >
                                                                Awaiting Payment Confirmation
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                fullWidth
                                                                variant="contained"
                                                                color="primary"
                                                                startIcon={<AccountBalance />}
                                                                onClick={() => handleOpenPaymentModal(handout)}
                                                            >
                                                                Request Handout
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        p: 5,
                                        textAlign: "center",
                                    }}
                                >
                                    <MenuBook sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">
                                        No study handouts available at this time.
                                    </Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* TAB 2: MY CERTIFICATES */}
                    <TabPanel value={tabValue} index={2}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
                                <TextField
                                    fullWidth
                                    placeholder="Search certificates by title, course, or certificate number..."
                                    value={searchTermCertificates}
                                    onChange={(e) => setSearchTermCertificates(e.target.value)}
                                    size="small"
                                />
                            </Paper>

                            {filteredCertificates.length > 0 ? (
                                <Grid container spacing={3}>
                                    {filteredCertificates.map((cert) => (
                                        <Grid xs={12} sm={6} md={4} key={cert.id}>
                                            <Card
                                                sx={{
                                                    borderRadius: 3,
                                                    border: "1px solid",
                                                    borderColor: cert.status === "ISSUED" ? "success.main" : "grey.200",
                                                    height: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                                        <CardGiftcard sx={{ fontSize: 32, color: "#7c3aed" }} />
                                                        <Chip
                                                            label={cert.status}
                                                            color={cert.status === "ISSUED" ? "success" : cert.status === "EARNED" ? "info" : "error"}
                                                            size="small"
                                                        />
                                                    </Box>

                                                    <Typography variant="h6" fontWeight={700} mb={0.5}>
                                                        {cert.title}
                                                    </Typography>

                                                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                                                        {cert.course_name || "Course Certificate"}
                                                    </Typography>

                                                    <Box sx={{ bgcolor: "grey.50", p: 1.5, borderRadius: 2, mb: 2 }}>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Certificate #: <strong>{cert.certificate_number}</strong>
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Earned Date: {cert.earned_date}
                                                        </Typography>
                                                        {cert.issued_date && (
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                Issued Date: {cert.issued_date}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </CardContent>

                                                <Box sx={{ p: 2, pt: 0 }}>
                                                    {cert.file ? (
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<Download />}
                                                            href={cert.file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Download Certificate
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled
                                                        >
                                                            {cert.status === "ISSUED" ? "File Pending Upload" : "Processing Issue"}
                                                        </Button>
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        p: 5,
                                        textAlign: "center",
                                    }}
                                >
                                    <CardGiftcard sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">
                                        No certificates earned yet. Complete your courses to earn certificates!
                                    </Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* TAB 3: BROCHURES / COURSE OUTLINES */}
                    <TabPanel value={tabValue} index={3}>
                        <Stack spacing={3}>
                            {/* Search Filter */}
                            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
                                <TextField
                                    fullWidth
                                    placeholder="Search course brochures / outlines by title, course, description..."
                                    value={searchTermBrochures}
                                    onChange={(e) => setSearchTermBrochures(e.target.value)}
                                    size="small"
                                />
                            </Paper>

                            {/* Brochures Grid */}
                            {filteredBrochures.length > 0 ? (
                                <Grid container spacing={3}>
                                    {filteredBrochures.map((brochure) => (
                                        <Grid xs={12} sm={6} md={4} key={brochure.id}>
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
                                                            label={brochure.course_name || "Course Brochure"}
                                                            color="primary"
                                                            size="small"
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                        <MenuBook sx={{ fontSize: 24, color: "primary.main" }} />
                                                    </Box>

                                                    <Typography variant="h6" fontWeight={700} mb={1}>
                                                        {brochure.title}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                                        {brochure.description || "Official course brochure and outline."}
                                                    </Typography>

                                                    {brochure.created_at && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Uploaded: {new Date(brochure.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                </CardContent>

                                                <Box sx={{ p: 2, pt: 0 }}>
                                                    {brochure.file ? (
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<Download />}
                                                            href={brochure.file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Download Brochure
                                                        </Button>
                                                    ) : (
                                                        <Button fullWidth variant="outlined" disabled>
                                                            No File Attached
                                                        </Button>
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        p: 5,
                                        textAlign: "center",
                                    }}
                                >
                                    <MenuBook sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography color="text.secondary">
                                        No course brochures or outlines available at the moment.
                                    </Typography>
                                </Paper>
                            )}
                        </Stack>
                    </TabPanel>
                </Box>
            </Paper>

            {/* View Content Dialog */}
            <Dialog open={viewContentOpen} onClose={() => setViewContentOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Learning Material</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {selectedContent && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Title
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedContent.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Type
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip label={selectedContent.content_type} size="small" variant="outlined" />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body2">
                                    {selectedContent.description || "—"}
                                </Typography>
                            </Box>

                            {selectedContent.video_url && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Video Link
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="a"
                                        href={selectedContent.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ color: "primary.main", textDecoration: "none", wordBreak: "break-all", display: "block" }}
                                    >
                                        {selectedContent.video_url}
                                    </Typography>
                                </Box>
                            )}

                            {selectedContent.file && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Attachment File
                                    </Typography>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Download />}
                                        href={selectedContent.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ mt: 0.5 }}
                                    >
                                        Download File
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewContentOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Bank Payment Modal */}
            <Dialog
                open={paymentModalOpen}
                onClose={() => {
                    if (!purchasingId) {
                        setPaymentModalOpen(false);
                        setRequestingHandout(null);
                    }
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccountBalance sx={{ color: "primary.main" }} />
                    Request Handout
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {requestingHandout && (
                        <Stack spacing={3}>
                            {/* Handout summary */}
                            <Box sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.100", borderRadius: 2, p: 2 }}>
                                <Typography variant="subtitle2" color="primary.main" fontWeight={700} mb={0.5}>
                                    {requestingHandout.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {requestingHandout.description || "Study handout"}
                                </Typography>
                                <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="h6" fontWeight={800} color="primary.main">
                                        ₦{parseFloat(requestingHandout.price).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Bank account details */}
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <AccountBalance sx={{ color: "success.main", fontSize: 20 }} />
                                    <Typography variant="subtitle1" fontWeight={700}>Payment Account Details</Typography>
                                </Box>
                                {bankAccounts.length === 0 ? (
                                    <Box sx={{ bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200", borderRadius: 2, p: 2, textAlign: "center" }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Bank account details will be provided by the admin. Please contact support.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {bankAccounts.map((acct) => (
                                            <Box
                                                key={acct.id}
                                                sx={{
                                                    bgcolor: "success.50",
                                                    border: "1px solid",
                                                    borderColor: "success.200",
                                                    borderRadius: 2,
                                                    p: 2,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 0.75,
                                                }}
                                            >
                                                {acct.description && (
                                                    <Typography variant="caption" color="success.dark" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                                                        {acct.description}
                                                    </Typography>
                                                )}
                                                {[
                                                    { label: "Bank Name", value: acct.bank_name },
                                                    { label: "Account Name", value: acct.account_name },
                                                    { label: "Account Number", value: acct.account_number },
                                                    { label: "Amount", value: `₦${parseFloat(requestingHandout.price).toLocaleString()}` },
                                                    { label: "Reference", value: `HANDOUT-${requestingHandout.id}` },
                                                ].map(({ label, value }) => (
                                                    <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{label}:</Typography>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={label === "Account Number" ? 800 : 600}
                                                            fontFamily={label === "Account Number" ? "monospace" : "inherit"}
                                                            letterSpacing={label === "Account Number" ? 1 : 0}
                                                            sx={{ textAlign: "right", wordBreak: "break-all" }}
                                                        >
                                                            {value}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </Box>

                            {/* Instructions */}
                            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", bgcolor: "info.50", border: "1px solid", borderColor: "info.100", borderRadius: 2, p: 1.5 }}>
                                <Info sx={{ color: "info.main", fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="body2" color="text.secondary">
                                    After clicking <strong>"Submit Request"</strong>, your request will be marked as <strong>Pending</strong>. Once you make the bank transfer, our team will verify and approve your access. You\'ll receive a notification when approved.
                                </Typography>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={() => {
                            setPaymentModalOpen(false);
                            setRequestingHandout(null);
                        }}
                        disabled={!!purchasingId}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePurchaseHandout}
                        disabled={!!purchasingId}
                        startIcon={purchasingId ? <CircularProgress size={16} color="inherit" /> : <AccountBalance />}
                    >
                        {purchasingId ? "Submitting..." : "Submit Request"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
