"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    Paper,
    Stack,
    IconButton,
    Alert,
} from "@mui/material";
import {
    Close,
    CheckCircle,
    Cancel,
    EmojiEvents,
    Lightbulb,
} from "@mui/icons-material";

export default function QuizHistoryModal({ open, onClose, attempt }) {
    if (!open || !attempt) return null;

    const feedback = attempt.answers_data?.feedback || [];

    return (
        <Dialog
            open={open}
            onClose={(e, reason) => { if (reason === 'backdropClick') return; onClose(e, reason); }}
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
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                        Quiz History: {attempt.quiz_title}
                    </Typography>
                    <Typography variant="caption" color="grey.400">
                        Completed on {new Date(attempt.completed_at).toLocaleDateString()}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: "grey.400" }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#f8fafc" }}>
                <Stack spacing={3}>
                    {/* Overall Result Banner */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 4 },
                            borderRadius: 3.5,
                            textAlign: "center",
                            bgcolor: attempt.passed ? "#f0fdf4" : "#fffbeb",
                            border: "2px solid",
                            borderColor: attempt.passed ? "#86efac" : "#fde68a",
                        }}
                    >
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                bgcolor: attempt.passed ? "#22c55e" : "#f59e0b",
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
                            {attempt.passed ? "Test Passed! 🎉" : "Failed / Keep Practicing 💪"}
                        </Typography>

                        <Typography variant="h3" fontWeight={900} color={attempt.passed ? "success.main" : "warning.main"} mb={1}>
                            {attempt.score_percentage}%
                        </Typography>

                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Score: {attempt.correct_answers_count} of {attempt.total_questions} correct questions
                        </Typography>
                    </Paper>

                    <Typography variant="h6" fontWeight={700} color="slate.900" sx={{ mt: 1 }}>
                        Answer Breakdown & Explanations:
                    </Typography>

                    {feedback.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                            <Typography color="text.secondary">No detailed question feedback available for this attempt.</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {feedback.map((item, idx) => (
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
                    )}
                </Stack>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #e2e8f0" }}>
                <Button variant="outlined" onClick={onClose} sx={{ textTransform: "none", borderRadius: 2 }}>Close Window</Button>
            </DialogActions>
        </Dialog>
    );
}
