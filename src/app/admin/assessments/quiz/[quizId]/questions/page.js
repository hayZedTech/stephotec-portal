"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box, Button, Typography, Stack, Card, CardContent, IconButton,
    CircularProgress, Alert, Chip, TextField, InputAdornment,
    Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
    Radio, RadioGroup, FormControlLabel, Tabs, Tab,
} from "@mui/material";
import {
    ArrowBack, EditOutlined, DeleteOutlineOutlined, Add,
    SearchOutlined, CloseOutlined, AddCircle, ContentPaste, UploadFile,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

const QUESTIONS_PER_PAGE = 5;

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

export default function QuizQuestionsPage() {
    const { quizId } = useParams();
    const router = useRouter();

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loadingQuiz, setLoadingQuiz] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [questionSearch, setQuestionSearch] = useState("");

    // Add / Edit question dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [questionMode, setQuestionMode] = useState("SINGLE");
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [editingOptionIds, setEditingOptionIds] = useState([]);
    const [questionText, setQuestionText] = useState("");
    const [explanationText, setExplanationText] = useState("");
    const [options, setOptions] = useState([
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
    ]);
    const [bulkText, setBulkText] = useState("");
    const [submittingBulk, setSubmittingBulk] = useState(false);
    const [savingQuestion, setSavingQuestion] = useState(false);
    const fileInputRef = useRef(null);

    // Cache: pageCache.current[cacheKey][pageNum] = results array
    const pageCache = useRef({});
    // Token object — replaced on each new prefetch run to cancel the previous one
    const prefetchToken = useRef(null);

    const pageCount = Math.ceil(totalCount / QUESTIONS_PER_PAGE);

    // ─── Load quiz metadata ───────────────────────────────────────────────────
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoadingQuiz(true);
                const res = await api.get(`/learning/quizzes/${quizId}/`);
                setQuiz(res.data);
            } catch {
                errorToast(null, "Failed to load quiz");
            } finally {
                setLoadingQuiz(false);
            }
        };
        if (quizId) fetchQuiz();
    }, [quizId]);

    // ─── Initial load: page 1 ─────────────────────────────────────────────────
    useEffect(() => {
        if (quizId) {
            pageCache.current = {};
            prefetchToken.current = null;
            loadPage(1, "");
        }
    }, [quizId]);

    // ─── Core fetch + cache store ─────────────────────────────────────────────
    const loadPage = async (p, search, silent = false) => {
        if (!silent) setLoadingQuestions(true);
        try {
            const params = new URLSearchParams({ quiz: quizId, page: p, page_size: QUESTIONS_PER_PAGE });
            if (search) params.append("search", search);
            const res = await api.get(`/learning/quiz-questions/?${params}`);
            const data = res.data;

            let results, count;
            if (data && typeof data === "object" && "results" in data) {
                results = data.results;
                count = data.count || 0;
            } else {
                const all = Array.isArray(data) ? data : [];
                results = all.slice((p - 1) * QUESTIONS_PER_PAGE, p * QUESTIONS_PER_PAGE);
                count = all.length;
            }

            // Store in cache under this search key
            const cacheKey = search;
            if (!pageCache.current[cacheKey]) pageCache.current[cacheKey] = {};
            pageCache.current[cacheKey][p] = results;

            if (!silent) {
                setQuestions(results);
                setTotalCount(count);
                // After page 1 arrives, kick off silent background prefetch for the rest
                if (p === 1 && count > QUESTIONS_PER_PAGE) {
                    prefetchRemaining(count, search);
                }
            }
            return count;
        } catch {
            if (!silent) errorToast(null, "Failed to load questions");
        } finally {
            if (!silent) setLoadingQuestions(false);
        }
    };

    // ─── Silent background prefetch of all remaining pages ───────────────────
    const prefetchRemaining = async (count, search) => {
        const token = {};
        prefetchToken.current = token;

        const totalPages = Math.ceil(count / QUESTIONS_PER_PAGE);
        for (let p = 2; p <= totalPages; p++) {
            if (prefetchToken.current !== token) return; // cancelled by a newer prefetch
            const cacheKey = search;
            if (pageCache.current[cacheKey]?.[p]) continue; // already in cache
            await loadPage(p, search, true /* silent */);
            // Small gap between requests so we don't hammer the server
            await new Promise(r => setTimeout(r, 200));
        }
    };

    // ─── Navigate pages (instant from cache if available) ────────────────────
    const handlePageChange = (_, val) => {
        const cached = pageCache.current[questionSearch]?.[val];
        if (cached) {
            setQuestions(cached);
            setPage(val);
        } else {
            setPage(val);
            loadPage(val, questionSearch);
        }
    };

    // ─── Search ───────────────────────────────────────────────────────────────
    const handleSearch = (val) => {
        setQuestionSearch(val);
        setPage(1);
        prefetchToken.current = null; // cancel ongoing prefetch
        // Serve from cache immediately if we have it, then re-fetch to confirm
        if (pageCache.current[val]?.[1]) setQuestions(pageCache.current[val][1]);
        loadPage(1, val);
    };

    // ─── Delete ───────────────────────────────────────────────────────────────
    const invalidateCache = () => { pageCache.current = {}; prefetchToken.current = null; };

    const handleDeleteQuestion = (questionId) => {
        confirmAction(
            "Delete this question? This cannot be undone.",
            async () => {
                try {
                    await api.delete(`/learning/quiz-questions/${questionId}/`);
                    successToast("Question deleted");
                    invalidateCache();
                    const newTotal = totalCount - 1;
                    const newCount = Math.max(0, newTotal);
                    const newPageCount = Math.ceil(newCount / QUESTIONS_PER_PAGE);
                    const targetPage = Math.min(page, Math.max(1, newPageCount));
                    setTotalCount(newCount);
                    setPage(targetPage);
                    loadPage(targetPage, questionSearch);
                } catch (err) {
                    errorToast(err, "Failed to delete question");
                }
            },
            null, "Delete", "Cancel", true
        );
    };

    const handleDeleteAll = () => {
        confirmAction(
            "Delete ALL questions for this quiz? This cannot be undone.",
            async () => {
                try {
                    await api.delete(`/learning/quizzes/${quizId}/delete-all-questions/`);
                    successToast("All questions deleted");
                    invalidateCache();
                    setQuestions([]);
                    setTotalCount(0);
                    setPage(1);
                    const quizRes = await api.get(`/learning/quizzes/${quizId}/`);
                    setQuiz(quizRes.data);
                } catch (err) {
                    errorToast(err, "Failed to delete all questions");
                }
            },
            null, "Delete All", "Cancel", true
        );
    };

    // ─── Open add / edit dialog ───────────────────────────────────────────────
    const openAddDialog = () => {
        setEditingQuestionId(null);
        setEditingOptionIds([]);
        setQuestionText("");
        setExplanationText("");
        setOptions([
            { text: "", is_correct: true },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
        ]);
        setBulkText("");
        setQuestionMode("SINGLE");
        setOpenDialog(true);
    };

    const openEditDialog = (question) => {
        setEditingQuestionId(question.id);
        setQuestionText(question.question_text);
        setExplanationText(question.explanation || "");
        setQuestionMode("SINGLE");
        const mapped = [
            { text: "", is_correct: true },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
        ];
        const ids = [];
        question.options.forEach((opt, i) => {
            if (i < 4) { mapped[i] = { text: opt.option_text, is_correct: opt.is_correct }; ids[i] = opt.id; }
            else { mapped.push({ text: opt.option_text, is_correct: opt.is_correct }); ids.push(opt.id); }
        });
        setOptions(mapped);
        setEditingOptionIds(ids);
        setOpenDialog(true);
    };

    // ─── Save single question ─────────────────────────────────────────────────
    const handleSaveSingleQuestion = async () => {
        if (!questionText.trim()) { errorToast(null, "Please enter the question text."); return; }
        const validOpts = options.filter(o => o.text.trim());
        if (validOpts.length < 2) { errorToast(null, "Please fill in at least 2 options."); return; }

        try {
            setSavingQuestion(true);
            if (editingQuestionId) {
                await api.patch(`/learning/quiz-questions/${editingQuestionId}/`, { question_text: questionText, explanation: explanationText });
                for (let i = 0; i < validOpts.length; i++) {
                    const opt = validOpts[i];
                    if (editingOptionIds[i]) {
                        await api.patch(`/learning/quiz-options/${editingOptionIds[i]}/`, { option_text: opt.text, is_correct: opt.is_correct });
                    } else {
                        await api.post("/learning/quiz-options/", { question: editingQuestionId, option_text: opt.text, is_correct: opt.is_correct });
                    }
                }
                successToast("Question updated!");
            } else {
                const qRes = await api.post("/learning/quiz-questions/", { quiz: quizId, question_text: questionText, explanation: explanationText, points: 1 });
                const qId = qRes.data.id;
                for (const opt of validOpts) {
                    await api.post("/learning/quiz-options/", { question: qId, option_text: opt.text, is_correct: opt.is_correct });
                }
                successToast("Question added!");
            }
            setOpenDialog(false);
            invalidateCache();
            loadPage(page, questionSearch);
            const quizRes = await api.get(`/learning/quizzes/${quizId}/`);
            setQuiz(quizRes.data);
        } catch (err) {
            errorToast(err, "Failed to save question");
        } finally {
            setSavingQuestion(false);
        }
    };

    // ─── Bulk import ──────────────────────────────────────────────────────────
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const ext = file.name.split(".").pop().toLowerCase();
            if (ext === "txt") {
                setBulkText(await file.text());
                successToast("Text file loaded!");
            } else if (["csv", "xlsx", "xls"].includes(ext)) {
                const XLSX = await import("xlsx");
                const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
                const ws = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const isSingle = json.every(r => r.length <= 1);
                if (isSingle) {
                    setBulkText(json.map(r => r[0] || "").join("\n"));
                } else {
                    let text = "";
                    const start = json[0]?.[0]?.toString().toLowerCase().includes("question") ? 1 : 0;
                    for (let i = start; i < json.length; i++) {
                        const r = json[i];
                        if (!r?.[0]) continue;
                        const correct = (r[5] || "").toString().trim().toUpperCase();
                        text += `Q: ${r[0]}\n`;
                        ["A", "B", "C", "D"].forEach((l, j) => { if (r[j + 1]) text += `${l}) ${r[j + 1]}${correct === l ? " *" : ""}\n`; });
                        if (r[6]) text += `EXPLANATION: ${r[6]}\n`;
                        text += "\n";
                    }
                    setBulkText(text.trim());
                }
                successToast("File parsed! Review the text below.");
            } else {
                errorToast(null, "Unsupported format (.txt, .csv, .xlsx only)");
            }
        } catch { errorToast(null, "Failed to read file"); }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSaveBulkQuestions = async () => {
        if (!bulkText.trim()) { errorToast(null, "Please paste question text."); return; }
        try {
            setSubmittingBulk(true);
            const blocks = bulkText.split(/\n\s*\n/).filter(b => b.trim());
            const parsed = [];
            for (const block of blocks) {
                const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
                if (lines.length < 2) continue;
                let qText = "", explanation = "";
                const opts = [];
                for (const line of lines) {
                    if (/^(Q:|QUESTION:)/i.test(line)) { qText = line.replace(/^(Q:|QUESTION:)/i, "").trim(); }
                    else if (/^(EXPLANATION:|EXP:)/i.test(line)) { explanation = line.replace(/^(EXPLANATION:|EXP:)/i, "").trim(); }
                    else if (!qText) { qText = line.replace(/^\d+[.):]?\s*/, "").trim(); }
                    else if (/^[A-F\d][.)\-:]/i.test(line)) {
                        const correct = line.includes("*") || /\(correct\)/i.test(line);
                        opts.push({ option_text: line.replace(/^[A-F\d][.)\-:]/i, "").replace(/\*|\(correct\)/gi, "").trim(), is_correct: correct });
                    } else if (opts.length > 0) { opts[opts.length - 1].option_text += " " + line; }
                    else { qText += " " + line; }
                }
                if (opts.length > 0 && !opts.some(o => o.is_correct)) opts[0].is_correct = true;
                if (qText && opts.length >= 2) parsed.push({ question_text: qText, explanation, points: 1, options: opts });
            }
            if (parsed.length === 0) { errorToast(null, "Could not parse any valid questions. Check the format."); return; }
            for (let i = 0; i < parsed.length; i += 50) {
                await api.post(`/learning/quizzes/${quizId}/bulk-questions/`, { questions: parsed.slice(i, i + 50) });
            }
            successToast(`Imported ${parsed.length} questions!`);
            setOpenDialog(false);
            invalidateCache();
            setPage(1);
            loadPage(1, questionSearch);
            const quizRes = await api.get(`/learning/quizzes/${quizId}/`);
            setQuiz(quizRes.data);
        } catch (err) { errorToast(err, "Bulk import failed"); }
        finally { setSubmittingBulk(false); }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loadingQuiz) {
        return <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <IconButton onClick={() => router.back()} sx={{ mt: 0.5 }}>
                    <ArrowBack />
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h5" fontWeight={800}>{quiz?.title}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                        <Chip label={quiz?.level || "BEGINNER"} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                        <Chip label={`${quiz?.questions_count ?? totalCount} Questions`} size="small" sx={{ fontWeight: 700 }} />
                        <Chip label={`${quiz?.duration_minutes} mins`} size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineOutlined />}
                        disabled={totalCount === 0}
                        onClick={handleDeleteAll}
                        sx={{ fontWeight: 700 }}
                    >
                        Delete All
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={openAddDialog}
                        sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" }, fontWeight: 700 }}
                    >
                        Add Question
                    </Button>
                </Stack>
            </Box>

            {/* Search */}
            <TextField
                fullWidth
                size="small"
                placeholder="Search questions..."
                value={questionSearch}
                onChange={e => handleSearch(e.target.value)}
                sx={{ mb: 3, bgcolor: "white", borderRadius: 1 }}
                slotProps={{
                    input: {
                        startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment>,
                        endAdornment: questionSearch && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => handleSearch("")}><CloseOutlined fontSize="small" /></IconButton>
                            </InputAdornment>
                        ),
                    }
                }}
            />

            {/* Questions */}
            {loadingQuestions ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : questions.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {questionSearch ? "No questions match your search." : "No questions yet. Click \"Add Question\" to get started."}
                </Alert>
            ) : (
                <Stack spacing={2}>
                    {questions.map((q, idx) => (
                        <Card key={q.id} elevation={0} sx={{ border: "1px solid #cbd5e1", borderRadius: 2 }}>
                            <CardContent>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                                        {(page - 1) * QUESTIONS_PER_PAGE + idx + 1}. {q.question_text}
                                    </Typography>
                                    <Box sx={{ display: "flex", flexShrink: 0 }}>
                                        <IconButton size="small" onClick={() => openEditDialog(q)} color="primary">
                                            <EditOutlined fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeleteQuestion(q.id)} color="error">
                                            <DeleteOutlineOutlined fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Stack spacing={0.5} sx={{ mt: 1.5, pl: 2 }}>
                                    {(q.options || []).map(opt => (
                                        <Typography key={opt.id} variant="body2" color={opt.is_correct ? "success.main" : "text.secondary"}>
                                            • {opt.option_text} {opt.is_correct && <strong>(Correct)</strong>}
                                        </Typography>
                                    ))}
                                </Stack>

                                {q.explanation && (
                                    <Alert severity="info" sx={{ mt: 1.5, py: 0, px: 2, "& .MuiAlert-message": { py: 1 } }}>
                                        <strong>Explanation:</strong> {q.explanation}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {pageCount > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" />
                </Box>
            )}

            {/* Total count */}
            {totalCount > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: "center", mt: 1 }}>
                    Showing {(page - 1) * QUESTIONS_PER_PAGE + 1}–{Math.min(page * QUESTIONS_PER_PAGE, totalCount)} of {totalCount} questions
                </Typography>
            )}

            {/* ADD / EDIT QUESTION DIALOG */}
            <Dialog open={openDialog} onClose={(e, reason) => { if (reason === "backdropClick") return; setOpenDialog(false); }} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{editingQuestionId ? "Edit Question" : `Add Question to "${quiz?.title}"`}</span>
                    <IconButton onClick={() => setOpenDialog(false)} sx={{ color: "grey.400" }}><CloseOutlined /></IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    {!editingQuestionId && (
                        <Tabs value={questionMode} onChange={(e, v) => setQuestionMode(v)} variant="scrollable" scrollButtons="auto"
                            sx={{ mb: 3, borderBottom: "1px solid #e2e8f0", "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}>
                            <Tab icon={<AddCircle />} iconPosition="start" label="Single Question" value="SINGLE" />
                            <Tab icon={<ContentPaste />} iconPosition="start" label="Bulk Import" value="BULK" />
                        </Tabs>
                    )}

                    {/* SINGLE */}
                    {questionMode === "SINGLE" && (
                        <Stack spacing={2.5}>
                            <TextField label="Question Text" multiline rows={2} fullWidth required placeholder="e.g. What does HTML stand for?"
                                value={questionText} onChange={e => setQuestionText(e.target.value)} />
                            <Typography variant="subtitle2" fontWeight={700}>Answer Options (radio = correct):</Typography>
                            <RadioGroup value={options.findIndex(o => o.is_correct)} onChange={e => {
                                const idx = parseInt(e.target.value);
                                setOptions(options.map((o, i) => ({ ...o, is_correct: i === idx })));
                            }}>
                                <Stack spacing={1.5}>
                                    {options.map((opt, idx) => (
                                        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <FormControlLabel value={idx} control={<Radio color="success" />} label={`Option ${String.fromCharCode(65 + idx)}`} sx={{ m: 0, mr: 1, whiteSpace: "nowrap", flexShrink: 0 }} />
                                            <TextField fullWidth size="small" placeholder="Type answer..." value={opt.text} onChange={e => {
                                                const o = [...options]; o[idx].text = e.target.value; setOptions(o);
                                            }} />
                                        </Box>
                                    ))}
                                </Stack>
                            </RadioGroup>
                            <TextField label="Explanation (optional)" multiline rows={2} fullWidth placeholder="Explain why the correct answer is right..."
                                value={explanationText} onChange={e => setExplanationText(e.target.value)} />
                        </Stack>
                    )}

                    {/* BULK */}
                    {questionMode === "BULK" && (
                        <Stack spacing={2}>
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                                    <Box>
                                        <strong>Upload or Paste Questions:</strong> .xlsx, .csv, or .txt (Max 10MB)<br />
                                        <em>Excel Columns: Question | Option A | Option B | Option C | Option D | Correct (A–D) | Explanation</em>
                                    </Box>
                                    <Button variant="outlined" component="label" size="small" startIcon={<UploadFile />} sx={{ whiteSpace: "nowrap" }}>
                                        Upload File
                                        <input type="file" hidden accept=".xlsx,.xls,.csv,.txt" ref={fileInputRef} onChange={handleFileUpload} />
                                    </Button>
                                </Box>
                            </Alert>
                            <TextField label="Paste Bulk Questions Here" multiline rows={12} fullWidth
                                placeholder={"Q: Question here?\nA) Option 1 *\nB) Option 2\nC) Option 3\nD) Option 4\nEXPLANATION: Reason.\n\nQ: Next question..."}
                                value={bulkText} onChange={e => setBulkText(e.target.value)} />
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: "#f8fafc" }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    {questionMode === "SINGLE" ? (
                        <Button
                            onClick={handleSaveSingleQuestion}
                            variant="contained"
                            disabled={savingQuestion}
                            sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" }, display: "flex", gap: 1 }}
                        >
                            {savingQuestion && <CircularProgress size={16} color="inherit" />}
                            {savingQuestion
                                ? (editingQuestionId ? "Updating..." : "Saving...")
                                : (editingQuestionId ? "Update Question" : "Save Question")
                            }
                        </Button>
                    ) : (
                        <Button onClick={handleSaveBulkQuestions} disabled={submittingBulk} variant="contained" startIcon={<UploadFile />} sx={{ bgcolor: "#0f172a" }}>
                            {submittingBulk ? "Importing..." : "Parse & Import Questions"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
