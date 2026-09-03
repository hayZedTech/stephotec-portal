"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    Paper,
    Typography,
    Stack,
    TextField,
    Button,
    IconButton,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Checkbox,
    Chip,
    Tabs,
    Tab,
    CircularProgress,
    InputAdornment,
} from "@mui/material";
import {
    ArrowBack,
    CloudUpload,
    Save,
    Send,
    EditNote,
    AttachFile,
    Search,
    Close,
    School,
    Workspaces,
    CheckCircle,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { getCachedGroups, getCachedStudents } from "@/services/adminTargetCache";
import { successToast, errorToast } from "@/lib/toast";

function CreateAssignmentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");

    // Core data
    const [courses, setCourses] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [dueDate, setDueDate] = useState("");
    const [maxScore, setMaxScore] = useState(100);
    const [status, setStatus] = useState("PUBLISHED");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");

    // Content Writing / Uploading state
    // "WRITE", "UPLOAD", "BOTH"
    const [contentMode, setContentMode] = useState("WRITE");
    const [writtenQuestions, setWrittenQuestions] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [existingFileUrl, setExistingFileUrl] = useState(null);

    // Direct Target Assignment state
    const [assignTab, setAssignTab] = useState(0); // 0=Groups, 1=Individual Students
    const [selectedGroupIds, setSelectedGroupIds] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [targetCourseFilter, setTargetCourseFilter] = useState("");
    const [groupSearchQuery, setGroupSearchQuery] = useState("");
    const [studentSearchQuery, setStudentSearchQuery] = useState("");

    // Load Courses, Groups, Students, and existing Assignment (if editId)
    useEffect(() => {
        let isMounted = true;

        const loadAllData = async () => {
            try {
                setLoadingInitial(true);
                const [coursesData, groupsData, studentsData] = await Promise.all([
                    getCourses().catch(() => []),
                    getCachedGroups().catch(() => []),
                    getCachedStudents().catch(() => []),
                ]);

                if (!isMounted) return;

                setCourses(coursesData || []);
                setAllGroups(groupsData || []);
                setAllStudents(studentsData || []);

                // If editing existing assignment
                if (editId) {
                    try {
                        const { data: assignData } = await api.get(`/learning/assignments/${editId}/`);
                        setTitle(assignData.title || "");
                        setSelectedCourseIds(assignData.course ? [assignData.course] : []);
                        if (assignData.due_date) {
                            const d = new Date(assignData.due_date);
                            const pad = (n) => String(n).padStart(2, "0");
                            const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                            setDueDate(localIso);
                        }
                        setMaxScore(assignData.max_score || 100);
                        setStatus(assignData.status || "DRAFT");
                        setDescription(assignData.description || "");
                        setInstructions(assignData.instructions || "");
                        if (assignData.file) {
                            setExistingFileUrl(assignData.file);
                            setContentMode("UPLOAD");
                        }
                        if (assignData.instructions && !assignData.file) {
                            setWrittenQuestions(assignData.instructions);
                            setContentMode("WRITE");
                        } else if (assignData.instructions && assignData.file) {
                            setWrittenQuestions(assignData.instructions);
                            setContentMode("BOTH");
                        }

                        // Load already assigned students for this assignment
                        const assignedRes = await api.get(`/learning/student-assignments/?assignment=${editId}`).catch(() => ({ data: [] }));
                        const assignedList = Array.isArray(assignedRes.data) ? assignedRes.data : assignedRes.data?.results || [];
                        const assignedIds = assignedList.map((a) => a.student);
                        setSelectedStudentIds(assignedIds);
                    } catch (e) {
                        errorToast(e, "Failed to load assignment details for editing");
                    }
                } else {
                    // Default due date: 7 days from now at 23:59
                    const now = new Date();
                    now.setDate(now.getDate() + 7);
                    now.setHours(23, 59, 0, 0);
                    const pad = (n) => String(n).padStart(2, "0");
                    setDueDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
                }
            } catch (err) {
                errorToast(err, "Failed to load initial assignment data");
            } finally {
                if (isMounted) setLoadingInitial(false);
            }
        };

        loadAllData();
        return () => {
            isMounted = false;
        };
    }, [editId]);

    // Quick date offset helpers
    const setDueDateDaysAhead = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        d.setHours(23, 59, 0, 0);
        const pad = (n) => String(n).padStart(2, "0");
        setDueDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    };

    // Filtered Groups for Target Assignment
    const filteredGroups = useMemo(() => {
        return allGroups.filter((g) => {
            if (targetCourseFilter && String(g.course) !== String(targetCourseFilter)) return false;
            if (!groupSearchQuery.trim()) return true;
            const q = groupSearchQuery.toLowerCase();
            const name = (g.name || "").toLowerCase();
            const courseName = (g.course_name || "").toLowerCase();
            return name.includes(q) || courseName.includes(q);
        });
    }, [allGroups, targetCourseFilter, groupSearchQuery]);

    // Filtered Students for Target Assignment
    const filteredStudents = useMemo(() => {
        return allStudents.filter((st) => {
            if (targetCourseFilter) {
                const enrolled = (st.courses || []).some(
                    (c) => String(c.course_id || c.course || c.id) === String(targetCourseFilter)
                );
                if (!enrolled) return false;
            }
            if (!studentSearchQuery.trim()) return true;
            const q = studentSearchQuery.toLowerCase();
            const fullName = `${st.first_name || ""} ${st.last_name || ""}`.toLowerCase();
            const email = (st.email || "").toLowerCase();
            const username = (st.username || "").toLowerCase();
            return fullName.includes(q) || email.includes(q) || username.includes(q);
        });
    }, [allStudents, targetCourseFilter, studentSearchQuery]);

    // Format text inserter for the writing editor
    const insertSnippet = (snippet) => {
        setWrittenQuestions((prev) => {
            if (!prev) return snippet;
            return `${prev}\n\n${snippet}`;
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                errorToast(null, `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
                return;
            }
            setUploadedFile(file);
        }
    };

    // Main Save / Publish handler
    const handleSubmit = async (overrideStatus = null) => {
        if (!title.trim()) {
            errorToast(null, "Assignment Title is required.");
            return;
        }
        if (!dueDate) {
            errorToast(null, "Due Date is required.");
            return;
        }

        const finalStatus = overrideStatus || status;
        setSaving(true);

        try {
            // Determine courses to create assignment for
            const coursesToApply = selectedCourseIds.length > 0
                ? selectedCourseIds
                : [courses[0]?.id || null]; // fallback to first course or null if no course selected

            // Combined instructions content
            let finalInstructions = instructions.trim();
            if (writtenQuestions.trim()) {
                if (finalInstructions) {
                    finalInstructions = `### QUESTIONS & TASKS:\n${writtenQuestions.trim()}\n\n### SUBMISSION GUIDELINES:\n${finalInstructions}`;
                } else {
                    finalInstructions = writtenQuestions.trim();
                }
            }

            // If user wrote assignment directly and uploaded no file, auto-bundle written text as a downloadable file
            let fileToUpload = uploadedFile;
            if (!fileToUpload && writtenQuestions.trim() && contentMode !== "UPLOAD") {
                const textBlob = new Blob([
                    `ASSIGNMENT: ${title.toUpperCase()}\n`,
                    `DUE DATE: ${new Date(dueDate).toLocaleString()}\n`,
                    `MAX SCORE: ${maxScore} PTS\n`,
                    `--------------------------------------------------\n\n`,
                    writtenQuestions.trim(),
                    instructions.trim() ? `\n\n--------------------------------------------------\nINSTRUCTIONS:\n${instructions.trim()}` : "",
                ], { type: "text/plain;charset=utf-8" });

                const safeFileName = `${title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)}_assignment.txt`;
                fileToUpload = new File([textBlob], safeFileName, { type: "text/plain" });
            }

            const createdAssignmentIds = [];

            if (editId) {
                // Editing existing single assignment
                const data = new FormData();
                if (selectedCourseIds.length > 0) {
                    data.append("course", selectedCourseIds[0]);
                }
                data.append("title", title.trim());
                data.append("description", description.trim() || title.trim() || "Assignment");
                data.append("instructions", finalInstructions);
                data.append("status", finalStatus);
                data.append("due_date", dueDate);
                data.append("max_score", maxScore);
                if (fileToUpload) {
                    data.append("file", fileToUpload);
                }

                await api.patch(`/learning/assignments/${editId}/`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                createdAssignmentIds.push(editId);
                successToast("Assignment updated successfully!");
            } else {
                // Creating new assignment(s) across chosen courses
                for (const cId of coursesToApply) {
                    const data = new FormData();
                    if (cId) {
                        data.append("course", cId);
                    }
                    data.append("title", title.trim());
                    data.append("description", description.trim() || title.trim() || "Assignment");
                    data.append("instructions", finalInstructions);
                    data.append("status", finalStatus);
                    data.append("due_date", dueDate);
                    data.append("max_score", maxScore);
                    if (fileToUpload) {
                        data.append("file", fileToUpload);
                    }

                    const res = await api.post("/learning/assignments/", data, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    if (res.data?.id) {
                        createdAssignmentIds.push(res.data.id);
                    }
                }
                successToast(
                    createdAssignmentIds.length > 1
                        ? `Created ${createdAssignmentIds.length} assignments across selected courses!`
                        : "Assignment created successfully!"
                );
            }

            // Immediately assign selected groups and individual students
            if (createdAssignmentIds.length > 0 && (selectedGroupIds.length > 0 || selectedStudentIds.length > 0)) {
                let assignedCount = 0;
                for (const aId of createdAssignmentIds) {
                    // Assign groups
                    for (const gid of selectedGroupIds) {
                        try {
                            await api.post("/learning/student-assignments/assign_to_students/", {
                                assignment_id: aId,
                                group_id: gid,
                            });
                            assignedCount++;
                        } catch (err) {
                            console.error("Failed to assign to group:", gid, err);
                        }
                    }

                    // Assign individual students
                    if (selectedStudentIds.length > 0) {
                        try {
                            await api.post("/learning/student-assignments/assign_to_students/", {
                                assignment_id: aId,
                                student_ids: selectedStudentIds,
                            });
                            assignedCount += selectedStudentIds.length;
                        } catch (err) {
                            console.error("Failed to assign to students:", err);
                        }
                    }
                }
                if (assignedCount > 0) {
                    successToast("Assigned to selected study groups and students!");
                }
            }

            router.push("/admin/assessments?tab=assignments");
        } catch (error) {
            errorToast(error, "Failed to save assignment");
        } finally {
            setSaving(false);
        }
    };

    if (loadingInitial) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2 }}>
                <CircularProgress size={48} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Loading assignment studio...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 8, maxWidth: 1200, mx: "auto" }}>
            {/* Top Navigation Bar */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.push("/admin/assessments?tab=assignments")}
                    sx={{ fontWeight: 700, color: "text.primary" }}
                >
                    Back to Assessments
                </Button>

                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Button
                        variant="outlined"
                        onClick={() => handleSubmit("DRAFT")}
                        disabled={saving}
                        startIcon={<Save />}
                        sx={{ fontWeight: 700 }}
                    >
                        Save as Draft
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleSubmit("PUBLISHED")}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Send />}
                        sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 800, px: 2.5 }}
                    >
                        {saving ? "Saving..." : selectedGroupIds.length > 0 || selectedStudentIds.length > 0 ? "Publish & Assign" : "Publish Assignment"}
                    </Button>
                </Stack>
            </Box>

            {/* Title Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                        {editId ? "Edit Assignment" : "Create New Assignment"}
                    </Typography>
                    {editId && (
                        <Chip
                            label={`Status: ${status}`}
                            size="small"
                            color={status === "PUBLISHED" ? "success" : "default"}
                            sx={{ fontWeight: 700 }}
                        />
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Write assignment questions directly or attach documents, configure multi-course access, and assign directly to groups or students.
                </Typography>
            </Box>

            <Stack spacing={3}>
                {/* 1. BASIC ASSIGNMENT DETAILS */}
                <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }} elevation={0}>
                    <Typography variant="subtitle1" fontWeight={800} color="primary" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <School fontSize="small" /> 1. Assignment Details & Course Scope
                    </Typography>

                    <Stack spacing={2.5}>
                        {/* Title */}
                        <TextField
                            fullWidth
                            label="Assignment Title *"
                            placeholder="e.g. Milestone 2: Build a Reactive Dashboard with Next.js"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />

                        {/* Multi-Course Selection */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel id="courses-multi-select-label">Target Course(s) (Optional)</InputLabel>
                                <Select
                                    labelId="courses-multi-select-label"
                                    multiple
                                    label="Target Course(s) (Optional)"
                                    value={selectedCourseIds}
                                    onChange={(e) => {
                                        const val = typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value;
                                        setSelectedCourseIds(val);
                                    }}
                                    renderValue={(selected) => {
                                        if (selected.length === 0) return <em>All Courses / General (No single course restricted)</em>;
                                        return (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {selected.map((cid) => {
                                                    const c = courses.find((item) => String(item.id) === String(cid));
                                                    return (
                                                        <Chip
                                                            key={cid}
                                                            label={c?.name || `Course #${cid}`}
                                                            size="small"
                                                            sx={{ fontWeight: 600, bgcolor: "#eff6ff", color: "#1d4ed8" }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        );
                                    }}
                                >
                                    {courses.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            <Checkbox checked={selectedCourseIds.includes(c.id)} size="small" />
                                            <Typography variant="body2">{c.name} {c.code ? `(${c.code})` : ""}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.8, px: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {selectedCourseIds.length === 0
                                        ? "General / Course-Agnostic: Available across all learning tracks"
                                        : `Selected ${selectedCourseIds.length} course(s). Assignment will be linked to each selected course.`}
                                </Typography>
                                {selectedCourseIds.length > 0 && (
                                    <Button
                                        size="small"
                                        onClick={() => setSelectedCourseIds([])}
                                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0, minWidth: "auto" }}
                                    >
                                        Make Course-Agnostic
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {/* Due Date & Max Score */}
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Due Date & Time *"
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    required
                                />
                                <Box sx={{ display: "flex", gap: 0.8, mt: 0.8, flexWrap: "wrap", alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Presets:
                                    </Typography>
                                    <Chip label="+3 Days" size="small" onClick={() => setDueDateDaysAhead(3)} sx={{ cursor: "pointer", height: 20, fontSize: "0.68rem" }} />
                                    <Chip label="+1 Week" size="small" onClick={() => setDueDateDaysAhead(7)} sx={{ cursor: "pointer", height: 20, fontSize: "0.68rem" }} />
                                    <Chip label="+2 Weeks" size="small" onClick={() => setDueDateDaysAhead(14)} sx={{ cursor: "pointer", height: 20, fontSize: "0.68rem" }} />
                                    <Chip label="+1 Month" size="small" onClick={() => setDueDateDaysAhead(30)} sx={{ cursor: "pointer", height: 20, fontSize: "0.68rem" }} />
                                </Box>
                            </Box>

                            <TextField
                                size="small"
                                label="Max Score"
                                type="number"
                                value={maxScore}
                                onChange={(e) => setMaxScore(Number(e.target.value) || 0)}
                                sx={{ width: { xs: "100%", md: 180 } }}
                            />
                        </Stack>

                        {/* Optional Description */}
                        <TextField
                            fullWidth
                            label="Overview / Description (Optional)"
                            placeholder="Provide a brief introductory summary of this assignment..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={2}
                        />
                    </Stack>
                </Paper>

                {/* 2. ASSIGNMENT CONTENT (WRITE DIRECTLY VS UPLOAD) */}
                <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }} elevation={0}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={800} color="primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <EditNote fontSize="small" /> 2. Assignment Content & Tasks
                        </Typography>

                        {/* Mode Switcher */}
                        <Tabs
                            value={contentMode}
                            onChange={(e, val) => setContentMode(val)}
                            sx={{ minHeight: 36, bgcolor: "#f8fafc", p: 0.5, borderRadius: 2, "& .MuiTab-root": { minHeight: 32, py: 0, px: 2, textTransform: "none", fontWeight: 700, borderRadius: 1.5, fontSize: "0.8rem" } }}
                        >
                            <Tab value="WRITE" label="✍️ Write Questions" />
                            <Tab value="UPLOAD" label="📎 Upload File" />
                            <Tab value="BOTH" label="🔄 Write & Upload Both" />
                        </Tabs>
                    </Box>

                    {/* WRITING SECTION */}
                    {(contentMode === "WRITE" || contentMode === "BOTH") && (
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                                <Typography variant="body2" fontWeight={700}>
                                    Assignment Questions & Deliverables:
                                </Typography>
                                <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Quick Templates:
                                    </Typography>
                                    <Chip
                                        label="+ Question"
                                        size="small"
                                        onClick={() => insertSnippet("### Question 1:\nDescribe the core architectural components of...\n\n- Expected output:\n- Evaluation criteria:")}
                                        sx={{ cursor: "pointer", height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                                    />
                                    <Chip
                                        label="+ Code Task"
                                        size="small"
                                        onClick={() => insertSnippet("```javascript\n// Complete the implementation below:\nfunction calculateDiscount(price, discountPercent) {\n    // TODO\n}\n```")}
                                        sx={{ cursor: "pointer", height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                                    />
                                    <Chip
                                        label="+ Deliverables"
                                        size="small"
                                        onClick={() => insertSnippet("### Deliverables:\n1. GitHub repository URL\n2. Live deployment demo link\n3. Short explanation report (1 page)")}
                                        sx={{ cursor: "pointer", height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                                    />
                                </Stack>
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                rows={10}
                                placeholder="Type or paste assignment questions, problem statement, tasks, and rubric here...&#10;&#10;e.g.&#10;Question 1: Implement an authentication middleware...&#10;Question 2: Write unit tests verifying edge cases..."
                                value={writtenQuestions}
                                onChange={(e) => setWrittenQuestions(e.target.value)}
                                sx={{
                                    "& .MuiInputBase-root": {
                                        fontFamily: "inherit",
                                        lineHeight: 1.6,
                                        bgcolor: "#fafafa",
                                    },
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                {writtenQuestions.length} character(s) · Students will read these questions directly in their portal without needing to download external files.
                            </Typography>
                        </Box>
                    )}

                    {/* UPLOAD SECTION */}
                    {(contentMode === "UPLOAD" || contentMode === "BOTH") && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                                Upload Assignment File:
                            </Typography>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderStyle: "dashed",
                                    borderColor: uploadedFile ? "success.main" : "grey.300",
                                    bgcolor: uploadedFile ? "success.50" : "#fafafa",
                                    textAlign: "center",
                                    borderRadius: 2,
                                }}
                            >
                                {uploadedFile ? (
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                                        <AttachFile color="success" />
                                        <Box sx={{ textAlign: "left" }}>
                                            <Typography variant="body2" fontWeight={700}>{uploadedFile.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" color="error" onClick={() => setUploadedFile(null)}>
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    <Box>
                                        <CloudUpload sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                                        <Typography variant="body2" fontWeight={700}>
                                            Choose an assignment document to upload
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                            Supported: PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), ZIP (Max: 10MB)
                                        </Typography>
                                        <Button variant="outlined" component="label" size="small" sx={{ fontWeight: 700 }}>
                                            Browse Computer
                                            <input type="file" hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.ppt,.zip,.txt" />
                                        </Button>
                                    </Box>
                                )}
                            </Paper>

                            {existingFileUrl && !uploadedFile && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, px: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Current file:
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        component="a"
                                        href={existingFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ color: "primary.main", textDecoration: "underline", fontWeight: 700 }}
                                    >
                                        View current attached file
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* OPTIONAL INSTRUCTIONS */}
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Submission Guidelines & Instructions (Optional)"
                            placeholder="e.g. Upload a single PDF file or submit your GitHub repo link before the deadline..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            multiline
                            rows={2}
                        />
                    </Box>
                </Paper>

                {/* 3. DIRECT TARGET ASSIGNMENT (GROUPS & STUDENTS) */}
                <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }} elevation={0}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 1 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={800} color="primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Workspaces fontSize="small" /> 3. Assign Target (Groups & Students)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Select study groups or individual students to assign this assignment to immediately upon creation.
                            </Typography>
                        </Box>

                        <Chip
                            icon={<CheckCircle sx={{ fontSize: "1rem !important" }} />}
                            label={`${selectedGroupIds.length} Group(s) · ${selectedStudentIds.length} Student(s) Selected`}
                            color={selectedGroupIds.length > 0 || selectedStudentIds.length > 0 ? "primary" : "default"}
                            variant="outlined"
                            sx={{ fontWeight: 800, height: 26 }}
                        />
                    </Box>

                    {/* Tabs: By Study Group vs Individual Students */}
                    <Tabs
                        value={assignTab}
                        onChange={(e, val) => setAssignTab(val)}
                        sx={{ borderBottom: "1px solid", borderColor: "grey.200", mb: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}
                    >
                        <Tab label={`Study Groups (${allGroups.length})`} />
                        <Tab label={`Individual Students (${allStudents.length})`} />
                    </Tabs>

                    {/* Course Filter Dropdown for Targeting */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, alignItems: "center" }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="target-course-filter-label">Filter by Course</InputLabel>
                            <Select
                                labelId="target-course-filter-label"
                                label="Filter by Course"
                                value={targetCourseFilter}
                                onChange={(e) => setTargetCourseFilter(e.target.value)}
                            >
                                <MenuItem value="">All Courses ({courses.length})</MenuItem>
                                {courses.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {assignTab === 0 ? (
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search study groups by name or course..."
                                value={groupSearchQuery}
                                onChange={(e) => setGroupSearchQuery(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                                        endAdornment: groupSearchQuery ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setGroupSearchQuery("")} edge="end"><Close fontSize="small" /></IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                            />
                        ) : (
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search students by name, email, or username..."
                                value={studentSearchQuery}
                                onChange={(e) => setStudentSearchQuery(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                                        endAdornment: studentSearchQuery ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setStudentSearchQuery("")} edge="end"><Close fontSize="small" /></IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                            />
                        )}
                    </Stack>

                    {/* TAB 0: STUDY GROUPS */}
                    {assignTab === 0 && (
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                    Showing {filteredGroups.length} group(s)
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            const allIds = filteredGroups.map((g) => g.id);
                                            setSelectedGroupIds(Array.from(new Set([...selectedGroupIds, ...allIds])));
                                        }}
                                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0 }}
                                    >
                                        Select Visible
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => setSelectedGroupIds([])}
                                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0 }}
                                    >
                                        Clear Groups
                                    </Button>
                                </Box>
                            </Box>

                            <Box sx={{ maxHeight: 280, overflowY: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 2, p: 1, bgcolor: "#fafafa" }}>
                                {filteredGroups.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: "center" }}>
                                        <Typography variant="body2" color="text.secondary">No study groups match the filter.</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={0.8}>
                                        {filteredGroups.map((g) => {
                                            const isSelected = selectedGroupIds.includes(g.id);
                                            return (
                                                <Paper
                                                    key={g.id}
                                                    onClick={() => {
                                                        setSelectedGroupIds((prev) =>
                                                            isSelected ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                                                        );
                                                    }}
                                                    sx={{
                                                        p: 1.2,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                        cursor: "pointer",
                                                        borderRadius: 2,
                                                        border: "1px solid",
                                                        borderColor: isSelected ? "primary.main" : "grey.200",
                                                        bgcolor: isSelected ? "primary.50" : "background.paper",
                                                        "&:hover": { borderColor: "primary.main" },
                                                        transition: "all 0.15s",
                                                    }}
                                                    elevation={0}
                                                >
                                                    <Checkbox checked={isSelected} size="small" onClick={(e) => e.stopPropagation()} onChange={() => {
                                                        setSelectedGroupIds((prev) =>
                                                            isSelected ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                                                        );
                                                    }} />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={700} noWrap>{g.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            Course: {g.course_name || "General"} · {g.member_count ?? g.members_count ?? g.members_detail?.length ?? 0} members
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* TAB 1: INDIVIDUAL STUDENTS */}
                    {assignTab === 1 && (
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                    Showing {filteredStudents.length} student(s)
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            const allIds = filteredStudents.map((s) => s.id);
                                            setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...allIds])));
                                        }}
                                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0 }}
                                    >
                                        Select Visible
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => setSelectedStudentIds([])}
                                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0 }}
                                    >
                                        Clear Students
                                    </Button>
                                </Box>
                            </Box>

                            <Box sx={{ maxHeight: 280, overflowY: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 2, p: 1, bgcolor: "#fafafa" }}>
                                {filteredStudents.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: "center" }}>
                                        <Typography variant="body2" color="text.secondary">No students match the filter.</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={0.8}>
                                        {filteredStudents.map((s) => {
                                            const isSelected = selectedStudentIds.includes(s.id);
                                            return (
                                                <Paper
                                                    key={s.id}
                                                    onClick={() => {
                                                        setSelectedStudentIds((prev) =>
                                                            isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                                                        );
                                                    }}
                                                    sx={{
                                                        p: 1.2,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                        cursor: "pointer",
                                                        borderRadius: 2,
                                                        border: "1px solid",
                                                        borderColor: isSelected ? "primary.main" : "grey.200",
                                                        bgcolor: isSelected ? "primary.50" : "background.paper",
                                                        "&:hover": { borderColor: "primary.main" },
                                                        transition: "all 0.15s",
                                                    }}
                                                    elevation={0}
                                                >
                                                    <Checkbox checked={isSelected} size="small" onClick={(e) => e.stopPropagation()} onChange={() => {
                                                        setSelectedStudentIds((prev) =>
                                                            isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                                                        );
                                                    }} />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={700} noWrap>
                                                            {s.first_name} {s.last_name} {s.username ? `(@${s.username})` : ""}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {s.email}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* BOTTOM ACTION BAR */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 2, borderTop: "1px solid", borderColor: "grey.200", flexWrap: "wrap", gap: 2 }}>
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={() => router.push("/admin/assessments?tab=assignments")}
                    >
                        Cancel
                    </Button>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            onClick={() => handleSubmit("DRAFT")}
                            disabled={saving}
                            startIcon={<Save />}
                            sx={{ fontWeight: 700 }}
                        >
                            Save as Draft
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleSubmit("PUBLISHED")}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Send />}
                            sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 800, px: 3 }}
                        >
                            {saving ? "Saving..." : selectedGroupIds.length > 0 || selectedStudentIds.length > 0 ? "Publish & Assign" : "Publish Assignment"}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}

export default function CreateAssignmentPage() {
    return (
        <Suspense fallback={<Box sx={{ p: 6, textAlign: "center" }}><CircularProgress /></Box>}>
            <CreateAssignmentForm />
        </Suspense>
    );
}
