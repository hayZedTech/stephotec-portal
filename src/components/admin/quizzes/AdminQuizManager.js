"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Paper,
    Stack,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Radio,
    RadioGroup,
    FormControlLabel,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Pagination,
} from "@mui/material";
import {
    Quiz as QuizIcon,
    Add,
    EditOutlined,
    DeleteOutlineOutlined,
    Search,
    Timer,
    CheckCircle,
    Close,
    School,
    AddCircle,
    Help,
    People,
    UploadFile,
    ContentPaste,
    SearchOutlined,
    CloseOutlined,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";

export default function AdminQuizManager() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const router = useRouter();

    const [quizzes, setQuizzes] = useState([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    // Filters
    const [search, setSearch] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterLevel, setFilterLevel] = useState("");

    // Create / Edit Quiz Dialog
    const [openQuizDialog, setOpenQuizDialog] = useState(false);
    const [editingQuizId, setEditingQuizId] = useState(null);
    const [quizFormData, setQuizFormData] = useState({
        course: "",
        title: "",
        description: "",
        level: "BEGINNER",
        duration_minutes: 15,
        passing_score_percentage: 70,
        is_published: true,
    });

    // Add Question & Bulk Upload Dialog
    const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
    const [selectedQuizForQuestion, setSelectedQuizForQuestion] = useState(null);
    const [questionMode, setQuestionMode] = useState("SINGLE"); // 'SINGLE' or 'BULK'
    
    // Single question state
    const [questionText, setQuestionText] = useState("");
    const [explanationText, setExplanationText] = useState("");
    const [options, setOptions] = useState([
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
    ]);

    // Bulk question state
    const [bulkText, setBulkText] = useState("");
    const [submittingBulk, setSubmittingBulk] = useState(false);
    const fileInputRef = useRef(null);

    // View Questions Dialog
    const [openViewQuestionsDialog, setOpenViewQuestionsDialog] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [viewQuestionsPage, setViewQuestionsPage] = useState(1);
    const QUESTIONS_PER_PAGE = 20;
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [editingOptionIds, setEditingOptionIds] = useState([]); // Array to map frontend options to backend IDs
    const [questionSearch, setQuestionSearch] = useState("");

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop().toLowerCase();
            
            if (fileExt === 'txt') {
                const text = await file.text();
                setBulkText(text);
                successToast("Text file loaded successfully!");
            } else if (fileExt === 'csv' || fileExt === 'xlsx' || fileExt === 'xls') {
                const XLSX = await import("xlsx");
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Check if it's a single column
                let isSingleColumn = true;
                for (const row of json) {
                    if (row.length > 1) {
                        isSingleColumn = false;
                        break;
                    }
                }
                
                if (isSingleColumn) {
                    // Just join the first column
                    const text = json.map(row => row[0] || "").join("\n");
                    setBulkText(text);
                } else {
                    // Expected tabular: Question | Option A | Option B | Option C | Option D | Correct (A-D) | Explanation
                    let generatedText = "";
                    let startIndex = 0;
                    if (json[0] && json[0][0] && json[0][0].toString().toLowerCase().includes("question")) {
                        startIndex = 1;
                    }
                    
                    for (let i = startIndex; i < json.length; i++) {
                        const row = json[i];
                        if (!row || row.length === 0 || !row[0]) continue;
                        
                        const question = row[0];
                        const optA = row[1];
                        const optB = row[2];
                        const optC = row[3];
                        const optD = row[4];
                        const correctCol = row[5] ? row[5].toString().trim().toUpperCase() : "";
                        const explanation = row[6];
                        
                        generatedText += `Q: ${question}\n`;
                        if (optA) generatedText += `A) ${optA} ${correctCol === 'A' ? '*' : ''}\n`.replace(/ \n/, '\n');
                        if (optB) generatedText += `B) ${optB} ${correctCol === 'B' ? '*' : ''}\n`.replace(/ \n/, '\n');
                        if (optC) generatedText += `C) ${optC} ${correctCol === 'C' ? '*' : ''}\n`.replace(/ \n/, '\n');
                        if (optD) generatedText += `D) ${optD} ${correctCol === 'D' ? '*' : ''}\n`.replace(/ \n/, '\n');
                        
                        if (explanation) {
                            generatedText += `EXPLANATION: ${explanation}\n`;
                        }
                        generatedText += "\n";
                    }
                    setBulkText(generatedText.trim());
                }
                successToast("Excel/CSV parsed successfully! Review the text below.");
            } else {
                errorToast("Unsupported file format. Please upload .txt, .csv, or .xlsx");
            }
        } catch (error) {
            console.error("Error reading file:", error);
            errorToast("Failed to read file.");
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [quizzes, search, filterCourse, filterLevel]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [coursesList, quizzesRes, attemptsRes] = await Promise.all([
                getCourses().catch(() => []),
                api.get("/learning/quizzes/").catch(() => ({ data: { results: [] } })),
                api.get("/learning/quiz-attempts/").catch(() => ({ data: { results: [] } })),
            ]);

            const quizzesList = quizzesRes.data?.results || quizzesRes.data || [];
            const attemptsList = attemptsRes.data?.results || attemptsRes.data || [];

            setCourses(Array.isArray(coursesList) ? coursesList : []);
            setQuizzes(Array.isArray(quizzesList) ? quizzesList : []);
            setAttempts(Array.isArray(attemptsList) ? attemptsList : []);
        } catch (error) {
            console.error("Failed to load quiz data", error);
            errorToast(error, "Failed to load quizzes");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...quizzes];
        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(
                (q) =>
                    q.title.toLowerCase().includes(term) ||
                    (q.description && q.description.toLowerCase().includes(term)) ||
                    (q.course_name && q.course_name.toLowerCase().includes(term))
            );
        }
        if (filterCourse) {
            filtered = filtered.filter((q) => String(q.course) === String(filterCourse));
        }
        if (filterLevel) {
            filtered = filtered.filter((q) => q.level === filterLevel);
        }
        setFilteredQuizzes(filtered);
    };

    const handleOpenAddQuiz = () => {
        setEditingQuizId(null);
        setQuizFormData({
            course: courses[0]?.id || "",
            title: "",
            description: "",
            level: "BEGINNER",
            duration_minutes: 15,
            passing_score_percentage: 70,
            display_questions_count: "",
            is_published: true,
        });
        setOpenQuizDialog(true);
    };

    const handleOpenEditQuiz = (quiz) => {
        setEditingQuizId(quiz.id);
        setQuizFormData({
            course: quiz.course,
            title: quiz.title,
            description: quiz.description || "",
            level: quiz.level || "BEGINNER",
            duration_minutes: quiz.duration_minutes || 15,
            passing_score_percentage: quiz.passing_score_percentage || 70,
            display_questions_count: quiz.display_questions_count || "",
            is_published: quiz.is_published,
        });
        setOpenQuizDialog(true);
    };

    const handleSaveQuiz = async (e) => {
        e.preventDefault();
        if (!quizFormData.course || !quizFormData.title) {
            errorToast("Please select a course and enter a quiz title.");
            return;
        }

        try {
            const payload = {
                ...quizFormData,
                display_questions_count: quizFormData.display_questions_count === "" ? null : parseInt(quizFormData.display_questions_count)
            };
            if (editingQuizId) {
                await api.patch(`/learning/quizzes/${editingQuizId}/`, payload);
                successToast("Quiz updated successfully!");
            } else {
                await api.post("/learning/quizzes/", payload);
                successToast("New practice quiz created successfully!");
            }
            setOpenQuizDialog(false);
            loadInitialData();
        } catch (error) {
            errorToast(error, "Failed to save quiz");
        }
    };

    const handleDeleteQuiz = (id) => {
        confirmAction(
            "Are you sure you want to delete this practice test? All questions and student attempt history will be removed.",
            async () => {
                try {
                    await api.delete(`/learning/quizzes/${id}/`);
                    successToast("Quiz deleted successfully");
                    setQuizzes((prev) => prev.filter((q) => q.id !== id));
                } catch (error) {
                    errorToast(error, "Failed to delete quiz");
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    };

    // QUESTION MANAGEMENT
    const handleOpenViewQuestions = async (quiz) => {
        setSelectedQuizForQuestion(quiz);
        setQuestionSearch("");
        setViewQuestionsPage(1);
        setOpenViewQuestionsDialog(true);
        fetchQuestionsForQuiz(quiz.id);
    };

    const fetchQuestionsForQuiz = async (quizId) => {
        setLoadingQuestions(true);
        try {
            const res = await api.get(`/learning/quiz-questions/?quiz=${quizId}`);
            setQuizQuestions(res.data);
        } catch (error) {
            errorToast(error, "Failed to load questions");
        } finally {
            setLoadingQuestions(false);
        }
    };

    const handleEditQuestion = (question) => {
        setEditingQuestionId(question.id);
        setQuestionMode("SINGLE");
        setQuestionText(question.question_text);
        setExplanationText(question.explanation || "");
        
        // Map backend options to frontend state
        const mappedOptions = [
            { text: "", is_correct: true },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
        ];
        
        const optionIds = [];
        
        question.options.forEach((opt, index) => {
            if (index < 4) {
                mappedOptions[index] = { text: opt.option_text, is_correct: opt.is_correct };
                optionIds[index] = opt.id;
            } else {
                mappedOptions.push({ text: opt.option_text, is_correct: opt.is_correct });
                optionIds.push(opt.id);
            }
        });
        
        setOptions(mappedOptions);
        setEditingOptionIds(optionIds);
        setOpenQuestionDialog(true);
        setOpenViewQuestionsDialog(false);
    };

    const handleDeleteQuestion = (questionId) => {
        confirmAction(
            "Are you sure you want to delete this question? This action cannot be undone.",
            async () => {
                try {
                    await api.delete(`/learning/quiz-questions/${questionId}/`);
                    successToast("Question deleted successfully");
                    fetchQuestionsForQuiz(selectedQuizForQuestion.id);
                    loadInitialData(); // Refresh quiz questions count
                } catch (error) {
                    errorToast(error, "Failed to delete question");
                }
            },
            null,
            "Delete",
            "Cancel",
            true
        );
    };

    const handleDeleteAllQuestions = () => {
        confirmAction(
            "Are you sure you want to delete ALL questions for this practice test? This action cannot be undone.",
            async () => {
                try {
                    await api.delete(`/learning/quizzes/${selectedQuizForQuestion.id}/delete-all-questions/`);
                    successToast("All questions deleted successfully.");
                    setQuizQuestions([]);
                    loadInitialData(); // Refresh quiz questions count
                } catch (error) {
                    errorToast(error, "Failed to delete all questions");
                }
            },
            null,
            "Delete All",
            "Cancel",
            true
        );
    };

    const handleOpenAddQuestion = (quiz) => {
        setEditingQuestionId(null);
        setEditingOptionIds([]);
        setSelectedQuizForQuestion(quiz);
        setQuestionMode("SINGLE");
        setQuestionText("");
        setExplanationText("");
        setOptions([
            { text: "", is_correct: true },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
        ]);
        setBulkText("");
        setOpenQuestionDialog(true);
    };

    const handleOptionTextChange = (idx, text) => {
        const newOpts = [...options];
        newOpts[idx].text = text;
        setOptions(newOpts);
    };

    const handleCorrectOptionChange = (correctIdx) => {
        const newOpts = options.map((opt, idx) => ({
            ...opt,
            is_correct: idx === correctIdx,
        }));
        setOptions(newOpts);
    };

    const handleSaveSingleQuestion = async () => {
        if (!questionText.trim()) {
            errorToast("Please enter the question text.");
            return;
        }

        const validOpts = options.filter((o) => o.text.trim());
        if (validOpts.length < 2) {
            errorToast("Please fill in at least 2 option choices.");
            return;
        }

        try {
            let questionId = editingQuestionId;
            
            if (editingQuestionId) {
                // Update existing question
                await api.patch(`/learning/quiz-questions/${editingQuestionId}/`, {
                    question_text: questionText,
                    explanation: explanationText,
                });
                
                // Update options
                for (let i = 0; i < validOpts.length; i++) {
                    const opt = validOpts[i];
                    if (editingOptionIds[i]) {
                        // Update existing option
                        await api.patch(`/learning/quiz-options/${editingOptionIds[i]}/`, {
                            option_text: opt.text,
                            is_correct: opt.is_correct,
                        });
                    } else {
                        // Create new option if more were added
                        await api.post("/learning/quiz-options/", {
                            question: questionId,
                            option_text: opt.text,
                            is_correct: opt.is_correct,
                        });
                    }
                }
                successToast("Question updated successfully!");
            } else {
                // Create new question
                const qRes = await api.post("/learning/quiz-questions/", {
                    quiz: selectedQuizForQuestion.id,
                    question_text: questionText,
                    explanation: explanationText,
                    points: 1,
                });

                questionId = qRes.data.id;
                for (const opt of validOpts) {
                    await api.post("/learning/quiz-options/", {
                        question: questionId,
                        option_text: opt.text,
                        is_correct: opt.is_correct,
                    });
                }
                successToast("Question added successfully!");
            }

            setOpenQuestionDialog(false);
            loadInitialData();
            if (editingQuestionId && openViewQuestionsDialog) {
                fetchQuestionsForQuiz(selectedQuizForQuestion.id);
            }
        } catch (error) {
            errorToast(error, "Failed to save question");
        }
    };

    // BULK QUESTION PARSER & UPLOADER
    const handleSaveBulkQuestions = async () => {
        if (!bulkText.trim()) {
            errorToast("Please paste question text to import.");
            return;
        }

        try {
            setSubmittingBulk(true);
            const blocks = bulkText.split(/\n\s*\n/).filter((b) => b.trim());
            const parsedQuestions = [];

            for (const block of blocks) {
                const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
                if (lines.length < 2) continue;

                let questionText = "";
                let explanation = "";
                const optionsList = [];

                for (const line of lines) {
                    if (line.toUpperCase().startsWith("Q:") || line.toUpperCase().startsWith("QUESTION:")) {
                        questionText = line.replace(/^(Q:|QUESTION:)/i, "").trim();
                    } else if (line.toUpperCase().startsWith("EXPLANATION:") || line.toUpperCase().startsWith("EXP:")) {
                        explanation = line.replace(/^(EXPLANATION:|EXP:)/i, "").trim();
                    } else if (!questionText) {
                        // If questionText is empty, this line MUST be the question (even if it starts with '1.')
                        // Strip leading question numbers like "1.", "1)", "1:" if they exist
                        questionText = line.replace(/^\d+[\.\)\:]\s*/, "").trim();
                    } else if (/^[A-F\d][\.\)\-:]/i.test(line)) {
                        // Option line
                        const isCorrect = line.includes("*") || line.toLowerCase().includes("(correct)");
                        const cleanOpt = line.replace(/^[A-F\d][\.\)\-:]/i, "").replace(/\*|\(correct\)/gi, "").trim();
                        optionsList.push({ option_text: cleanOpt, is_correct: isCorrect });
                    } else {
                        // Multi-line fallback: append to the last parsed item
                        if (optionsList.length > 0) {
                            optionsList[optionsList.length - 1].option_text += "\n" + line;
                        } else {
                            questionText += "\n" + line;
                        }
                    }
                }

                if (optionsList.length > 0 && !optionsList.some((o) => o.is_correct)) {
                    optionsList[0].is_correct = true;
                }

                if (questionText && optionsList.length >= 2) {
                    parsedQuestions.push({
                        question_text: questionText,
                        explanation: explanation,
                        points: 1,
                        options: optionsList,
                    });
                }
            }

            if (parsedQuestions.length === 0) {
                errorToast("Could not parse any valid questions. Please check the sample format.");
                setSubmittingBulk(false);
                return;
            }

            const chunkSize = 50;
            let totalImported = 0;
            
            for (let i = 0; i < parsedQuestions.length; i += chunkSize) {
                const chunk = parsedQuestions.slice(i, i + chunkSize);
                await api.post(`/learning/quizzes/${selectedQuizForQuestion.id}/bulk-questions/`, {
                    questions: chunk,
                });
                totalImported += chunk.length;
            }

            successToast(`Successfully imported ${totalImported} questions!`);
            setOpenQuestionDialog(false);
            loadInitialData();
        } catch (error) {
            errorToast(error, "Bulk import failed");
        } finally {
            setSubmittingBulk(false);
        }
    };

    return (
        <Box className="space-y-6">
            {/* TOP ACTION BAR */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={800} color="slate.900">
                        Interactive Quizzes & Practice Tests
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create practice tests per course level (Beginner, Level 1, Advanced), bulk upload questions, and view student test results.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenAddQuiz}
                    sx={{ borderRadius: 2.5, px: 3, textTransform: "none", fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}
                >
                    Create Practice Test
                </Button>
            </Box>

            {/* NAVIGATION & FILTERS */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", p: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, px: 2, pt: 1 }}>
                    <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} variant="scrollable" scrollButtons="auto" sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } } }}>
                        <Tab icon={<QuizIcon />} iconPosition="start" label={`Quizzes (${filteredQuizzes.length})`} />
                        <Tab icon={<People />} iconPosition="start" label={`Student Test Performance (${attempts.length})`} />
                    </Tabs>

                    {tabValue === 0 && (
                        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
                            <TextField
                                placeholder="Search quizzes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                size="small"
                                sx={{ width: 220 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Filter Course</InputLabel>
                                <Select value={filterCourse} label="Filter Course" onChange={(e) => setFilterCourse(e.target.value)}>
                                    <MenuItem value="">All Courses</MenuItem>
                                    {courses.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Filter Level</InputLabel>
                                <Select value={filterLevel} label="Filter Level" onChange={(e) => setFilterLevel(e.target.value)}>
                                    <MenuItem value="">All Levels</MenuItem>
                                    <MenuItem value="BEGINNER">Beginner</MenuItem>
                                    <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                                    <MenuItem value="ADVANCED">Advanced</MenuItem>
                                    <MenuItem value="GENERAL">General</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    )}
                </Box>

                {/* TAB 0: QUIZZES GRID */}
                {tabValue === 0 && (
                    <Box sx={{ p: 2, pt: 3 }}>
                        {loading ? (
                            <Box sx={{ py: 8, textAlign: "center" }}>
                                <CircularProgress sx={{ color: "#d97706" }} />
                            </Box>
                        ) : filteredQuizzes.length === 0 ? (
                            <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                                <Help sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                                <Typography variant="h6" fontWeight={700} color="slate.900">
                                    No Practice Quizzes Available
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Click 'Create Practice Test' above to add your first course practice test!
                                </Typography>
                                <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddQuiz} sx={{ bgcolor: "#0f172a" }}>
                                    Create Practice Test Now
                                </Button>
                            </Paper>
                        ) : (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 3 }}>
                                {filteredQuizzes.map((quiz) => (
                                    <Card key={quiz.id} elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", height: "100%", display: "flex", flexDirection: "column" }}>
                                        <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                                            <Stack spacing={1} sx={{ mb: 1.5, alignItems: "flex-start" }}>
                                                <Chip
                                                    label={quiz.level || "BEGINNER"}
                                                    size="small"
                                                    variant="outlined"
                                                    color="warning"
                                                    sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22 }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={700}
                                                    sx={{
                                                        bgcolor: "#eff6ff",
                                                        color: "#1d4ed8",
                                                        px: 1.2,
                                                        py: 0.4,
                                                        borderRadius: 1.5,
                                                        fontSize: "0.7rem",
                                                        lineHeight: 1.3,
                                                        wordBreak: "break-word",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {quiz.course_name || "General Course"}
                                                </Typography>
                                            </Stack>

                                            <Typography variant="h6" fontWeight={700} color="slate.900" mb={1}>
                                                {quiz.title}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary" mb={2} sx={{ flex: 1 }}>
                                                {quiz.description || "No description provided."}
                                            </Typography>

                                            <Stack spacing={1} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, mb: 2 }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Typography variant="caption" color="text.secondary">Duration:</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{quiz.duration_minutes} Mins</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Typography variant="caption" color="text.secondary">Questions:</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{quiz.questions_count || 0} Questions</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Typography variant="caption" color="text.secondary">Pass Score:</Typography>
                                                    <Typography variant="caption" fontWeight={700} color="warning.main">{quiz.passing_score_percentage}%</Typography>
                                                </Box>
                                            </Stack>

                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", pt: 1.5, mt: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => router.push(`/admin/assessments/quiz/${quiz.id}/questions`)}
                                                    sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}
                                                >
                                                    View / Edit Questions
                                                </Button>
                                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                                    <IconButton onClick={() => handleOpenEditQuiz(quiz)} size="small" sx={{ color: "primary.main" }}>
                                                        <EditOutlined fontSize="small" />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleDeleteQuiz(quiz.id)} size="small" sx={{ color: "error.main" }}>
                                                        <DeleteOutlineOutlined fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* TAB 1: STUDENT TEST PERFORMANCE TABLE */}
                {tabValue === 1 && (
                    <Box sx={{ p: 2, pt: 3 }}>
                        {isMobile ? (
                            <Stack spacing={2}>
                                {attempts.map((att) => (
                                    <Card key={att.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                        <CardContent>
                                            <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                                {att.student_name || "Student"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                                {att.quiz_title} • {att.course_name}
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
                                                    <Chip label={att.passed ? "PASSED" : "FAILED"} color={att.passed ? "success" : "error"} size="small" sx={{ fontWeight: 800 }} />
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Completed</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(att.completed_at).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        ) : (
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Quiz Title</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                                            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Score (%)</TableCell>
                                            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Completed Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attempts.map((att) => (
                                            <TableRow key={att.id} hover>
                                                <TableCell sx={{ fontWeight: 700, color: "slate.900" }}>{att.student_name || "Student"}</TableCell>
                                                <TableCell>{att.quiz_title}</TableCell>
                                                <TableCell>{att.course_name}</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: att.passed ? "success.main" : "warning.main" }}>
                                                    {att.score_percentage}%
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip label={att.passed ? "PASSED" : "FAILED"} color={att.passed ? "success" : "error"} size="small" sx={{ fontWeight: 800 }} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                                                    {new Date(att.completed_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
            </Paper>

            {/* CREATE / EDIT QUIZ DIALOG */}
            <Dialog open={openQuizDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenQuizDialog(false); }} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
                <form onSubmit={handleSaveQuiz} noValidate>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "white" }}>
                        {editingQuizId ? "Edit Practice Test" : "Create New Practice Test"}
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Course</InputLabel>
                                <Select
                                    value={quizFormData.course}
                                    label="Course"
                                    onChange={(e) => setQuizFormData({ ...quizFormData, course: e.target.value })}
                                >
                                    {courses.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name} ({c.code_prefix})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Quiz Title"
                                required
                                fullWidth
                                placeholder="e.g. Web Development - Beginner Level Test 1"
                                value={quizFormData.title}
                                onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Course Level</InputLabel>
                                <Select
                                    value={quizFormData.level}
                                    label="Course Level"
                                    onChange={(e) => setQuizFormData({ ...quizFormData, level: e.target.value })}
                                >
                                    <MenuItem value="BEGINNER">Beginner Level</MenuItem>
                                    <MenuItem value="INTERMEDIATE">Intermediate Level (Level 1)</MenuItem>
                                    <MenuItem value="ADVANCED">Advanced Level</MenuItem>
                                    <MenuItem value="GENERAL">General Practice</MenuItem>
                                </Select>
                            </FormControl>

                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Duration (Minutes)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={quizFormData.duration_minutes}
                                    onChange={(e) => setQuizFormData({ ...quizFormData, duration_minutes: parseInt(e.target.value) || 15 })}
                                />
                                <TextField
                                    label="Pass Mark (%)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={quizFormData.passing_score_percentage}
                                    onChange={(e) => setQuizFormData({ ...quizFormData, passing_score_percentage: parseInt(e.target.value) || 70 })}
                                />
                                <TextField
                                    label="Random Questions Count"
                                    type="number"
                                    fullWidth
                                    placeholder="Leave empty for all"
                                    value={quizFormData.display_questions_count}
                                    onChange={(e) => setQuizFormData({ ...quizFormData, display_questions_count: e.target.value })}
                                    slotProps={{ input: { min: 1 } }}
                                    helperText="Leave blank to show all questions"
                                />
                            </Stack>

                            <TextField
                                label="Description & Instructions"
                                multiline
                                rows={3}
                                fullWidth
                                placeholder="Write practice test instructions or details..."
                                value={quizFormData.description}
                                onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, bgcolor: "#f8fafc" }}>
                        <Button onClick={() => setOpenQuizDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                        <Button type="submit" variant="contained" sx={{ borderRadius: 2, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}>
                            Save Practice Test
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* ADD QUESTIONS & BULK IMPORT DIALOG */}
            <Dialog open={openQuestionDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenQuestionDialog(false); }} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
                <DialogTitle sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" component="span" fontWeight={800}>
                        Add Questions to "{selectedQuizForQuestion?.title}"
                    </Typography>
                    <IconButton onClick={() => setOpenQuestionDialog(false)} sx={{ color: "grey.400" }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    <Tabs value={questionMode} onChange={(e, val) => setQuestionMode(val)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: "1px solid #e2e8f0", "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" }, minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } } }}>
                        <Tab icon={<AddCircle />} iconPosition="start" label="Single Question Builder" value="SINGLE" sx={{ fontWeight: 700 }} />
                        <Tab icon={<ContentPaste />} iconPosition="start" label="Bulk Import Questions" value="BULK" sx={{ fontWeight: 700 }} />
                    </Tabs>

                    {/* SINGLE QUESTION MODE */}
                    {questionMode === "SINGLE" && (
                        <Stack spacing={2.5}>
                            <TextField
                                label="Question Text"
                                multiline
                                rows={2}
                                fullWidth
                                required
                                placeholder="e.g. What does HTML stand for?"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                            />

                            <Typography variant="subtitle2" fontWeight={700} color="slate.800">
                                Answer Options (Select radio for Correct Option):
                            </Typography>

                            <RadioGroup value={options.findIndex((o) => o.is_correct)} onChange={(e) => handleCorrectOptionChange(parseInt(e.target.value))}>
                                <Stack spacing={1.5}>
                                    {options.map((opt, idx) => (
                                        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "nowrap" }}>
                                            <FormControlLabel 
                                                value={idx} 
                                                control={<Radio color="success" />} 
                                                label={`Option ${String.fromCharCode(65 + idx)}`} 
                                                sx={{ m: 0, mr: 1, whiteSpace: "nowrap", flexShrink: 0 }}
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder={`Type answer...`}
                                                value={opt.text}
                                                onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                            />
                                        </Box>
                                    ))}
                                </Stack>
                            </RadioGroup>

                            <TextField
                                label="Answer Explanation (Shown after test submission)"
                                multiline
                                rows={2}
                                fullWidth
                                placeholder="Explain why the correct answer is right..."
                                value={explanationText}
                                onChange={(e) => setExplanationText(e.target.value)}
                            />
                        </Stack>
                    )}

                    {/* BULK IMPORT MODE */}
                    {questionMode === "BULK" && (
                        <Stack spacing={2}>
                            <Alert severity="info" sx={{ borderRadius: 2.5, display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, width: '100%' }}>
                                    <Box>
                                        <strong>Upload or Paste Questions:</strong> Upload a <code>.xlsx</code>, <code>.csv</code>, or <code>.txt</code> file (Max 10MB), or paste your questions directly below.
                                        <br/>
                                        <em>Excel Columns: Question | Option A | Option B | Option C | Option D | Correct (A-D) | Explanation</em>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        size="small"
                                        startIcon={<UploadFile />}
                                        sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.50' }, whiteSpace: 'nowrap' }}
                                    >
                                        Upload File
                                        <input
                                            type="file"
                                            hidden
                                            accept=".xlsx,.xls,.csv,.txt"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                        />
                                    </Button>
                                </Box>
                            </Alert>

                            <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #cbd5e1" }}>
                                <Typography variant="caption" fontWeight={700} display="block" color="slate.700" mb={1}>
                                    📝 Sample Text Format — Copy & Paste this style:
                                </Typography>
                                <Typography variant="caption" fontFamily="monospace" color="#0f172a" component="pre" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "0.78rem" }}>
{`Q: What does HTML stand for?
A) HyperText Markup Language *
B) High Technical Method Language
C) Hyperlink Text Mechanism
D) Hyper Training Machine Language
EXPLANATION: HTML stands for HyperText Markup Language, which is the standard markup language for creating web pages.

Q: Which CSS property is used to change the background color?
A) color
B) background-color *
C) bg-color
D) background-style
EXPLANATION: The background-color CSS property sets the background color of an element.`}
                                </Typography>
                            </Paper>

                            <TextField
                                label="Paste Bulk Questions Text Here"
                                multiline
                                rows={12}
                                fullWidth
                                placeholder={`Q: Your question here?\nA) Option 1 *\nB) Option 2\nC) Option 3\nD) Option 4\nEXPLANATION: Optional explanation here.\n\nQ: Next question...`}
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                            />
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: "#f8fafc" }}>
                    <Button onClick={() => setOpenQuestionDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                    {questionMode === "SINGLE" ? (
                        <Button onClick={handleSaveSingleQuestion} variant="contained" sx={{ borderRadius: 2, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}>
                            Save Question
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSaveBulkQuestions}
                            disabled={submittingBulk}
                            variant="contained"
                            startIcon={<UploadFile />}
                            sx={{ borderRadius: 2, bgcolor: "#0f172a" }}
                        >
                            {submittingBulk ? "Importing..." : "Parse & Import All Questions"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
            {/* VIEW QUESTIONS DIALOG */}
            <Dialog open={openViewQuestionsDialog} onClose={(e, reason) => { if (reason === 'backdropClick') return; setOpenViewQuestionsDialog(false); }} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    Questions for {selectedQuizForQuestion?.title}
                </DialogTitle>
                <DialogContent sx={{ p: 3, bgcolor: "#f1f5f9" }}>
                    {/* Search Bar */}
                    {!loadingQuestions && quizQuestions.length > 0 && (
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search questions..."
                            value={questionSearch}
                            onChange={(e) => {
                                setQuestionSearch(e.target.value);
                                setViewQuestionsPage(1);
                            }}
                            sx={{ mb: 2, bgcolor: "white", borderRadius: 1 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: questionSearch && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setQuestionSearch("")}>
                                                <CloseOutlined fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    )}
                    {loadingQuestions ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : quizQuestions.length === 0 ? (
                        <Alert severity="info">No questions found for this quiz.</Alert>
                    ) : (
                        <Box>
                            {(() => {
                                const filteredQuestions = quizQuestions.filter(q => q.question_text.toLowerCase().includes(questionSearch.toLowerCase()));
                                const pageCount = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
                                const paginatedQuestions = filteredQuestions.slice((viewQuestionsPage - 1) * QUESTIONS_PER_PAGE, viewQuestionsPage * QUESTIONS_PER_PAGE);
                                
                                return (
                                    <>
                                        <Stack spacing={2}>
                                            {paginatedQuestions.map((q, idx) => (
                                                <Card key={q.id} elevation={0} sx={{ border: "1px solid #cbd5e1", borderRadius: 2 }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Typography variant="subtitle1" fontWeight={700}>
                                                                {((viewQuestionsPage - 1) * QUESTIONS_PER_PAGE) + idx + 1}. {q.question_text}
                                                            </Typography>
                                                            <Box>
                                                                <IconButton size="small" onClick={() => handleEditQuestion(q)} color="primary">
                                                                    <EditOutlined fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small" onClick={() => handleDeleteQuestion(q.id)} color="error">
                                                                    <DeleteOutlineOutlined fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                        
                                                        <Stack spacing={1} sx={{ mt: 2, pl: 2 }}>
                                                            {q.options.map(opt => (
                                                                <Typography 
                                                                    key={opt.id} 
                                                                    variant="body2" 
                                                                    color={opt.is_correct ? "success.main" : "text.secondary"}
                                                                >
                                                                    • {opt.option_text} {opt.is_correct && <strong>(Correct Answer)</strong>}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                        
                                                        {q.explanation && (
                                                            <Alert severity="info" sx={{ mt: 2, py: 0, px: 2, '& .MuiAlert-message': { py: 1 } }}>
                                                                <strong>Explanation:</strong> {q.explanation}
                                                            </Alert>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                        {pageCount > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pt: 2 }}>
                                                <Pagination 
                                                    count={pageCount} 
                                                    page={viewQuestionsPage} 
                                                    onChange={(e, val) => setViewQuestionsPage(val)} 
                                                    color="primary" 
                                                />
                                            </Box>
                                        )}
                                    </>
                                );
                            })()}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                    <Button onClick={handleDeleteAllQuestions} disabled={quizQuestions.length === 0} color="error" variant="outlined" startIcon={<DeleteOutlineOutlined />}>
                        Delete All Questions
                    </Button>
                    <Button onClick={() => setOpenViewQuestionsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
