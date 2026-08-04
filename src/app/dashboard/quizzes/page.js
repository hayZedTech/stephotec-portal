"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Paper,
    Chip,
    Stack,
    CircularProgress,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Quiz as QuizIcon,
    Search,
    Timer,
    CheckCircle,
    Cancel,
    PlayArrow,
    History,
    Help,
    EmojiEvents,
    School,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { useAuth } from "@/providers/AuthProvider";
import { errorToast } from "@/lib/toast";
import QuizPlayerModal from "@/components/quizzes/QuizPlayerModal";
import QuizHistoryModal from "@/components/quizzes/QuizHistoryModal";
import { Visibility } from "@mui/icons-material";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function StudentQuizzesPage() {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [tabValue, setTabValue] = useState(0);

    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Active Quiz Modal
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [openPlayerModal, setOpenPlayerModal] = useState(false);
    
    // History Modal
    const [openHistoryModal, setOpenHistoryModal] = useState(false);
    const [selectedHistoryAttempt, setSelectedHistoryAttempt] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [quizzesRes, attemptsRes] = await Promise.allSettled([
                api.get("/learning/quizzes/"),
                api.get("/learning/quiz-attempts/"),
            ]);

            if (quizzesRes.status === "fulfilled") {
                const data = quizzesRes.value.data;
                setQuizzes(Array.isArray(data) ? data : data.results || []);
            }

            if (attemptsRes.status === "fulfilled") {
                const data = attemptsRes.value.data;
                setAttempts(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            errorToast(error, "Failed to load quizzes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredQuizzes = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return quizzes;
        return quizzes.filter(
            (q) =>
                q.title?.toLowerCase().includes(keyword) ||
                q.description?.toLowerCase().includes(keyword) ||
                q.course_name?.toLowerCase().includes(keyword)
        );
    }, [quizzes, search]);

    const handleStartQuiz = (quizId) => {
        setSelectedQuizId(quizId);
        setOpenPlayerModal(true);
    };

    const handleViewHistory = (attempt) => {
        setSelectedHistoryAttempt(attempt);
        setOpenHistoryModal(true);
    };

    const handleAttemptComplete = () => {
        loadData();
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* PAGE HEADER */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <QuizIcon sx={{ color: "#d97706", fontSize: { xs: 28, sm: 36 } }} /> Interactive Quizzes & Practice Tests
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                        100% Free practice tests to prepare for course assessments and test your knowledge.
                    </Typography>
                </Box>


            </Box>

            {/* SEARCH & NAVIGATION TABS */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", p: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, px: 2, pt: 1 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, val) => setTabValue(val)}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } } }}
                    >
                        <Tab icon={<QuizIcon fontSize="small" />} iconPosition="start" label={`Available Quizzes (${filteredQuizzes.length})`} />
                        <Tab icon={<History fontSize="small" />} iconPosition="start" label={`My Test History (${attempts.length})`} />
                    </Tabs>

                    {tabValue === 0 && (
                        <TextField
                            placeholder="Search quizzes by title or course..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{ width: { xs: "100%", sm: 300 } }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    )}
                </Box>
            </Paper>

            {/* TAB 0: AVAILABLE QUIZZES */}
            <TabPanel value={tabValue} index={0}>
                {loading ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <CircularProgress sx={{ color: "#d97706" }} />
                    </Box>
                ) : filteredQuizzes.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        <Help sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
                        <Typography variant="h6" fontWeight={700} color="slate.900">
                            No Quizzes Found
                        </Typography>
                        <Typography color="text.secondary">
                            There are currently no practice tests matching your search or course enrollment.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {filteredQuizzes.map((quiz) => {
                            const pastAttempt = attempts.find((a) => a.quiz === quiz.id);
                            return (
                                <Grid key={quiz.id} xs={12} sm={6} md={4}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            borderRadius: 4,
                                            border: "1px solid #e2e8f0",
                                            transition: "all 0.2s ease",
                                            "&:hover": { boxShadow: "0 12px 30px rgba(0,0,0,0.06)", borderColor: "#fbbf24" },
                                        }}
                                    >
                                        <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                                <Chip
                                                    label={quiz.course_name || "General"}
                                                    size="small"
                                                    icon={<School style={{ fontSize: 14 }} />}
                                                    sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: "0.7rem" }}
                                                />

                                            </Box>

                                            <Typography variant="h6" fontWeight={700} color="slate.900" mb={1} sx={{ fontSize: "1.1rem" }}>
                                                {quiz.title}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary" mb={3} sx={{ flex: 1, minHeight: 40 }}>
                                                {quiz.description || "Interactive practice test with instant scoring and explanation review."}
                                            </Typography>

                                            <Stack spacing={1.5} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, mb: 3 }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <Timer fontSize="inherit" /> Test Duration:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={700} color="slate.900">
                                                        {quiz.duration_minutes} Minutes
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Total Questions:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={700} color="slate.900">
                                                        {quiz.display_questions_count || quiz.questions_count || 0} Questions
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Pass Mark:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={700} color="warning.main">
                                                        {quiz.passing_score_percentage}% Score
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {pastAttempt && (
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, px: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">Last Score:</Typography>
                                                    <Chip
                                                        label={`${pastAttempt.score_percentage}% (${pastAttempt.passed ? "Passed" : "Failed"})`}
                                                        color={pastAttempt.passed ? "success" : "warning"}
                                                        size="small"
                                                        sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                                                    />
                                                </Box>
                                            )}

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                startIcon={<PlayArrow />}
                                                onClick={() => handleStartQuiz(quiz.id)}
                                                sx={{
                                                    borderRadius: 2.5,
                                                    py: 1.2,
                                                    fontWeight: 700,
                                                    textTransform: "none",
                                                    bgcolor: "#0f172a",
                                                    "&:hover": { bgcolor: "#1e1b4b" },
                                                }}
                                            >
                                                {pastAttempt ? "Retake Practice Test" : "Start Free Test"}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </TabPanel>

            {/* TAB 1: MY TEST ATTEMPTS & HISTORY */}
            <TabPanel value={tabValue} index={1}>
                <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    {attempts.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: "center" }}>
                            <EmojiEvents sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
                            <Typography color="text.secondary">You haven't completed any practice tests yet.</Typography>
                        </Box>
                    ) : isMobile ? (
                        <Stack spacing={2} sx={{ p: 2 }}>
                            {attempts.map((att) => (
                                <Card key={att.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                            {att.quiz_title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                            {att.course_name} • {new Date(att.completed_at).toLocaleDateString()}
                                        </Typography>
                                        
                                        <Stack spacing={1.5} mb={2}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Score</Typography>
                                                <Typography variant="body2" fontWeight={800} color={att.passed ? "success.main" : "warning.main"}>
                                                    {att.score_percentage}%
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                                                <Chip
                                                    label={att.passed ? "PASSED" : "RETRY RECOMMENDED"}
                                                    color={att.passed ? "success" : "warning"}
                                                    size="small"
                                                    sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                                                />
                                            </Box>
                                        </Stack>
                                        
                                        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", mt: 2, pt: 2, borderTop: "1px solid", borderColor: "grey.100" }}>
                                            <Button
                                                size="small"
                                                startIcon={<Visibility fontSize="small" />}
                                                onClick={() => handleViewHistory(att)}
                                                sx={{ textTransform: "none", fontWeight: 700, color: "#2563eb", flex: 1 }}
                                            >
                                                History
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<PlayArrow fontSize="small" />}
                                                onClick={() => handleStartQuiz(att.quiz)}
                                                sx={{ textTransform: "none", fontWeight: 700, color: "#d97706", flex: 1 }}
                                            >
                                                Retake
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Practice Test</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Correct Answers</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Score (%)</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Completed Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attempts.map((att) => (
                                        <TableRow key={att.id} hover>
                                            <TableCell sx={{ fontWeight: 700, color: "slate.900" }}>{att.quiz_title}</TableCell>
                                            <TableCell>{att.course_name}</TableCell>
                                            <TableCell align="center">
                                                {att.correct_answers_count} / {att.total_questions}
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: att.passed ? "success.main" : "warning.main" }}>
                                                {att.score_percentage}%
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={att.passed ? "PASSED" : "RETRY RECOMMENDED"}
                                                    color={att.passed ? "success" : "warning"}
                                                    size="small"
                                                    sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                                                {new Date(att.completed_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                                                    <Button
                                                        size="small"
                                                        startIcon={<Visibility fontSize="small" />}
                                                        onClick={() => handleViewHistory(att)}
                                                        sx={{ textTransform: "none", fontWeight: 700, color: "#2563eb" }}
                                                    >
                                                        View History
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        startIcon={<PlayArrow fontSize="small" />}
                                                        onClick={() => handleStartQuiz(att.quiz)}
                                                        sx={{ textTransform: "none", fontWeight: 700, color: "#d97706" }}
                                                    >
                                                        Retake
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </TabPanel>

            {/* QUIZ PLAYER MODAL */}
            <QuizPlayerModal
                open={openPlayerModal}
                onClose={() => setOpenPlayerModal(false)}
                quizId={selectedQuizId}
                onAttemptComplete={handleAttemptComplete}
            />

            {/* QUIZ HISTORY MODAL */}
            <QuizHistoryModal
                open={openHistoryModal}
                onClose={() => setOpenHistoryModal(false)}
                attempt={selectedHistoryAttempt}
            />
        </Box>
    );
}
