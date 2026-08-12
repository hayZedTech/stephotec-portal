"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    Paper,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    CircularProgress,
    Stack,
    Chip,
    Divider,
    IconButton,
    LinearProgress,
    Alert,
} from "@mui/material";
import {
    Close,
    Timer,
    CheckCircle,
    Cancel,
    EmojiEvents,
    Refresh,
    ArrowBack,
    ArrowForward,
    Help,
    Lightbulb,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

export default function QuizPlayerModal({ open, onClose, quizId, onAttemptComplete }) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
    const [results, setResults] = useState(null);

    // Fetch quiz data when modal opens
    useEffect(() => {
        if (open && quizId) {
            fetchQuizDetails();
        } else {
            resetQuizState();
        }
    }, [open, quizId]);

    // Timer countdown effect
    useEffect(() => {
        if (!open || results || timeRemainingSeconds <= 0) return;

        const timer = setInterval(() => {
            setTimeRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitQuiz(true); // Auto submit when time runs out
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [open, results, timeRemainingSeconds]);

    const resetQuizState = () => {
        setQuiz(null);
        setLoading(true);
        setSubmitting(false);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setTimeRemainingSeconds(0);
        setResults(null);
    };

    const fetchQuizDetails = async () => {
        try {
            setLoading(true);
            setResults(null);
            const response = await api.get(`/learning/quizzes/${quizId}/`);
            const quizData = response.data;
            setQuiz(quizData);
            setAnswers({});
            setCurrentQuestionIndex(0);
            setTimeRemainingSeconds((quizData.duration_minutes || 15) * 60);
        } catch (error) {
            errorToast(error, "Failed to load practice test details.");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionId, optionId) => {
        if (results) return;
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const handleSubmitQuiz = async (autoSubmit = false) => {
        if (submitting || !quiz) return;
        
        const answeredCount = Object.keys(answers).length;
        const totalCount = quiz.questions?.length || 0;
        
        const executeSubmit = async () => {
            try {
                setSubmitting(true);
                const question_ids = quiz.questions?.map((q) => q.id) || [];
                const response = await api.post(`/learning/quizzes/${quiz.id}/submit/`, {
                    answers: answers,
                    question_ids: question_ids,
                });
                setResults(response.data);
                successToast("Practice test completed!");
                if (onAttemptComplete) {
                    onAttemptComplete(response.data);
                }
            } catch (error) {
                errorToast(error, "Failed to submit practice test.");
            } finally {
                setSubmitting(false);
            }
        };

        if (autoSubmit) {
            executeSubmit();
        } else {
            confirmAction(
                `You have answered ${answeredCount}/${totalCount} questions. Are you sure you want to submit?`,
                executeSubmit,
                null,
                "Submit Quiz",
                "Review Answers"
            );
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (!open) return null;

    const questions = quiz?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    return (
        <Dialog
            open={open}
            onClose={(e, reason) => { if (reason === 'backdropClick') return; {
                if (!submitting) onClose();
            ; }}}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: { xs: 2, sm: 4 },
                        maxHeight: "92vh",
                        bgcolor: "#f8fafc",
                    },
                },
            }}
        >
            {/* MODAL HEADER */}
            <DialogTitle
                sx={{
                    p: { xs: 2, sm: 3 },
                    bgcolor: "#0f172a",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                        <Chip
                            label="100% FREE PRACTICE TEST"
                            size="small"
                            sx={{ bgcolor: "#fbbf24", color: "#0f172a", fontWeight: 800, fontSize: "0.65rem" }}
                        />
                        {quiz?.course_code && (
                            <Chip
                                label={quiz.course_code}
                                size="small"
                                sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, fontSize: "0.65rem" }}
                            />
                        )}
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                        {quiz?.title || "Practice Test"}
                    </Typography>
                </Box>

                {!results && !loading && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            bgcolor: timeRemainingSeconds < 120 ? "#ef4444" : "rgba(255,255,255,0.1)",
                            px: 2,
                            py: 0.75,
                            borderRadius: 2.5,
                            border: "1px solid rgba(255,255,255,0.2)",
                            flexShrink: 0,
                        }}
                    >
                        <Timer sx={{ color: "#fbbf24", fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={800} fontFamily="monospace">
                            {formatTime(timeRemainingSeconds)}
                        </Typography>
                    </Box>
                )}

                <IconButton onClick={onClose} disabled={submitting} sx={{ color: "grey.400", flexShrink: 0, ml: "auto" }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            {/* MODAL CONTENT */}
            <DialogContent dividers sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#f8fafc" }}>
                {loading ? (
                    <Box sx={{ py: 10, textAlign: "center" }}>
                        <CircularProgress sx={{ color: "#d97706" }} />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Loading quiz questions...
                        </Typography>
                    </Box>
                ) : results ? (
                    /* RESULTS & SCORECARD VIEW */
                    <Stack spacing={3}>
                        {/* Overall Result Banner */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, sm: 4 },
                                borderRadius: 3.5,
                                textAlign: "center",
                                bgcolor: results.passed ? "#f0fdf4" : "#fffbeb",
                                border: "2px solid",
                                borderColor: results.passed ? "#86efac" : "#fde68a",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: "50%",
                                    bgcolor: results.passed ? "#22c55e" : "#f59e0b",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mx: "auto",
                                    mb: 2,
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                }}
                            >
                                <EmojiEvents sx={{ fontSize: 40 }} />
                            </Box>

                            <Typography variant="h4" fontWeight={800} color="slate.900" mb={1}>
                                {results.passed ? "Test Passed! 🎉" : "Keep Practicing! 💪"}
                            </Typography>

                            <Typography variant="h3" fontWeight={900} color={results.passed ? "success.main" : "warning.main"} mb={1}>
                                {results.score_percentage}%
                            </Typography>

                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Score: {results.correct_answers_count} of {results.total_questions} correct questions (Pass Mark: {results.passing_score_percentage}%)
                            </Typography>
                        </Paper>

                        <Typography variant="h6" fontWeight={700} color="slate.900" sx={{ mt: 1 }}>
                            Answer Breakdown & Explanations:
                        </Typography>

                        {/* Detailed Question Review List */}
                        <Stack spacing={2}>
                            {results.questions_feedback?.map((item, idx) => (
                                <Paper
                                    key={item.question_id || idx}
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: item.is_correct ? "#bbf7d0" : "#fecaca",
                                        bgcolor: item.is_correct ? "#f0fdf4" : "#fef2f2",
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                                        {item.is_correct ? (
                                            <CheckCircle sx={{ color: "#16a34a", mt: 0.2 }} />
                                        ) : (
                                            <Cancel sx={{ color: "#dc2626", mt: 0.2 }} />
                                        )}
                                        <Box flex={1}>
                                            <Typography variant="subtitle1" fontWeight={700} color="slate.900">
                                                Q{idx + 1}. {item.question_text}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Stack spacing={1} sx={{ pl: 4 }}>
                                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "white", border: "1px solid #e2e8f0" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                                                YOUR ANSWER:
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color={item.is_correct ? "success.main" : "error.main"}>
                                                {item.selected_option_text}
                                            </Typography>
                                        </Box>

                                        {!item.is_correct && (
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                                                <Typography variant="caption" color="success.dark" fontWeight={700} display="block">
                                                    CORRECT ANSWER:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={700} color="success.dark">
                                                    {item.correct_option_text}
                                                </Typography>
                                            </Box>
                                        )}

                                        {item.explanation && (
                                            <Alert severity="info" icon={<Lightbulb fontSize="inherit" />} sx={{ borderRadius: 2, mt: 1, py: 0.5 }}>
                                                <Typography variant="caption" fontWeight={700} display="block">
                                                    EXPLANATION:
                                                </Typography>
                                                <Typography variant="caption">{item.explanation}</Typography>
                                            </Alert>
                                        )}
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Stack>
                ) : questions.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <Help sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary">No questions available for this practice test yet.</Typography>
                    </Box>
                ) : (
                    /* ACTIVE LIVE TEST QUESTION VIEW */
                    <Stack spacing={3}>
                        {/* Progress Bar & Stepper */}
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Answered: {answeredCount} / {questions.length}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={progressPercent}
                                sx={{ height: 8, borderRadius: 4, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: "#d97706" } }}
                            />
                        </Box>

                        {/* Current Question Card */}
                        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3.5, border: "1px solid #e2e8f0", bgcolor: "white" }}>
                            <Typography variant="h6" fontWeight={700} color="slate.900" mb={3} sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }}>
                                {currentQuestionIndex + 1}. {currentQuestion?.question_text}
                            </Typography>

                            <FormControl component="fieldset" fullWidth>
                                <RadioGroup
                                    value={answers[currentQuestion?.id] || ""}
                                    onChange={(e) => handleOptionSelect(currentQuestion?.id, parseInt(e.target.value))}
                                >
                                    <Stack spacing={1.5}>
                                        {currentQuestion?.options?.map((opt) => {
                                            const isSelected = answers[currentQuestion?.id] === opt.id;
                                            return (
                                                <Paper
                                                    key={opt.id}
                                                    elevation={0}
                                                    onClick={() => handleOptionSelect(currentQuestion?.id, opt.id)}
                                                    sx={{
                                                        p: 1.5,
                                                        px: 2,
                                                        borderRadius: 2.5,
                                                        border: "2px solid",
                                                        borderColor: isSelected ? "#d97706" : "#e2e8f0",
                                                        bgcolor: isSelected ? "#fffbeb" : "white",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease",
                                                        "&:hover": { borderColor: "#f59e0b", bgcolor: "#fffbeb" },
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value={opt.id}
                                                        control={<Radio sx={{ color: "#d97706", "&.Mui-checked": { color: "#d97706" } }} />}
                                                        label={
                                                            <Typography variant="body1" fontWeight={isSelected ? 700 : 500} color="slate.900">
                                                                {opt.option_text}
                                                            </Typography>
                                                        }
                                                        sx={{ width: "100%", m: 0 }}
                                                    />
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                </RadioGroup>
                            </FormControl>
                        </Paper>
                    </Stack>
                )}
            </DialogContent>

            {/* MODAL ACTIONS */}
            <DialogActions sx={{ p: { xs: 2, sm: 3 }, bgcolor: "white", justifyContent: "space-between" }}>
                {results ? (
                    <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
                        <Button startIcon={<Refresh />} onClick={fetchQuizDetails} variant="outlined" sx={{ borderRadius: 2.5, textTransform: "none" }}>
                            Retake Test
                        </Button>
                        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2.5, textTransform: "none", bgcolor: "#0f172a" }}>
                            Close Scorecard
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Button
                            startIcon={<ArrowBack />}
                            disabled={currentQuestionIndex === 0 || submitting}
                            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                            sx={{ textTransform: "none" }}
                        >
                            Previous
                        </Button>

                        <Box sx={{ display: "flex", gap: 1 }}>
                            {currentQuestionIndex < questions.length - 1 ? (
                                <Button
                                    endIcon={<ArrowForward />}
                                    variant="contained"
                                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                    sx={{ borderRadius: 2.5, px: 3, textTransform: "none", bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e1b4b" } }}
                                >
                                    Next Question
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    endIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                                    onClick={() => handleSubmitQuiz(false)}
                                    disabled={submitting}
                                    sx={{ borderRadius: 2.5, px: 4, textTransform: "none", fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                                >
                                    {submitting ? "Evaluating..." : "Submit Test"}
                                </Button>
                            )}
                        </Box>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
