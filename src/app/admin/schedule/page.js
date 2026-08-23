"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Paper,
    Typography,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    IconButton,
    Checkbox,
    CircularProgress,
    InputAdornment,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    ToggleButtonGroup,
    ToggleButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControlLabel,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Alert,
    RadioGroup,
    Radio,
} from "@mui/material";
import {
    Add,
    Edit,
    Delete,
    Search,
    AccessTime,
    CalendarMonth,
    ViewWeek,
    TableRows,
    VideoCameraFront,
    LocationOn,
    School,
    Workspaces,
    Person,
    OpenInNew,
    Close,
    ExpandMore,
    ContentCopy,
    AutoAwesome,
    Email,
    NotificationsActive,
    Send,
    Campaign,
    CheckCircle,
    WarningAmber,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { getCourses } from "@/services/courses";
import { successToast, errorToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import WeeklyTimetableGrid from "@/components/schedule/WeeklyTimetableGrid";
import {
    DAYS_OF_WEEK,
    DAY_PRESETS,
    DURATION_OPTIONS,
    COLOR_PRESETS,
    generateSlotsForDuration,
    formatTime12,
    timeStringToMinutes,
    getScheduleOverlaps,
    getScheduleTargetLabel,
} from "@/utils/scheduleUtils";
import ConcurrentScheduleModal from "@/components/schedule/ConcurrentScheduleModal";

export default function AdminSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("GRID"); // "GRID" or "TABLE"

    // Modal state for viewing concurrent schedule clashes & enrolled students
    const [conflictModalData, setConflictModalData] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDay, setFilterDay] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterMode, setFilterMode] = useState("");

    // Modal state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [saving, setSaving] = useState(false);
    const [savingType, setSavingType] = useState(null); // "SAVE_ONLY" or "SAVE_EMAIL"
    const [groupsSelectOpen, setGroupsSelectOpen] = useState(false);
    const [studentsSelectOpen, setStudentsSelectOpen] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [bulkDuration, setBulkDuration] = useState(90);

    const [loadingStudents, setLoadingStudents] = useState(false);

    // Standalone Reminder Dialog State
    const [reminderOpen, setReminderOpen] = useState(false);
    const [reminderSending, setReminderSending] = useState(false);
    const [reminderTargetType, setReminderTargetType] = useState("GROUP"); // "GROUP", "STUDENTS", "SCHEDULE", "COURSE"
    const [reminderScheduleId, setReminderScheduleId] = useState("");
    const [reminderGroupId, setReminderGroupId] = useState("");
    const [reminderCourseId, setReminderCourseId] = useState("");
    const [reminderStudentId, setReminderStudentId] = useState("");
    const [reminderSelectedScheduleIds, setReminderSelectedScheduleIds] = useState([]);
    const [reminderCustomNote, setReminderCustomNote] = useState("");
    const [reminderSearchQuery, setReminderSearchQuery] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        course: "",
        assigned_group_ids: [],
        assigned_student_ids: [],
        day_times: [
            { day: "MONDAY", start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 },
            { day: "WEDNESDAY", start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 },
            { day: "FRIDAY", start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 },
        ],
        mode: "PHYSICAL", // PHYSICAL is default
        venue_or_link: "",
        instructor_name: "",
        color_tag: "#2563eb",
        notes: "",
        is_active: true,
    });

    const loadAll = async () => {
        try {
            setLoading(true);
            const [schedRes, coursesData, groupsRes] = await Promise.all([
                api.get("/learning/lecture-schedules/").catch(() => ({ data: [] })),
                getCourses().catch(() => []),
                api.get("/admin/groups/").catch(() => ({ data: [] })),
            ]);

            setSchedules(Array.isArray(schedRes.data) ? schedRes.data : schedRes.data?.results || []);
            setCourses(coursesData || []);
            setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data?.results || []);
        } catch (err) {
            errorToast(err, "Failed to load schedules");
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        if (students.length > 0 || loadingStudents) return;
        try {
            setLoadingStudents(true);
            const studentsRes = await api.get("/admin/students/?page_size=1000").catch(() => ({ data: { results: [] } }));
            setStudents(studentsRes.data?.results || (Array.isArray(studentsRes.data) ? studentsRes.data : []));
        } catch (e) {
            console.error("Error loading students:", e);
        } finally {
            setLoadingStudents(false);
        }
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        loadAll();
    }, []);

    const openCreate = () => {
        setEditingSchedule(null);
        setFormData({
            title: "",
            course: "",
            assigned_group_ids: [],
            assigned_student_ids: [],
            day_times: [
                { day: "MONDAY", start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 },
                { day: "WEDNESDAY", start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 },
                { day: "FRIDAY", start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 },
            ],
            mode: "PHYSICAL", // PHYSICAL Classroom is default
            venue_or_link: "",
            instructor_name: "",
            color_tag: "#2563eb",
            notes: "",
            is_active: true,
        });
        setBulkDuration(90);
        setStudentSearchTerm("");
        setDialogOpen(true);
        loadStudents();
    };

    const openEdit = (sched) => {
        setEditingSchedule(sched);

        // Populate day_times from backend or synthesize from days_of_week
        let initialDayTimes = [];
        if (sched.day_times && Array.isArray(sched.day_times) && sched.day_times.length > 0) {
            initialDayTimes = sched.day_times.map((dt) => ({
                day: dt.day,
                start_time: dt.start_time || sched.start_time || "10:30:00",
                end_time: dt.end_time || sched.end_time || "12:00:00",
                duration_minutes: dt.duration_minutes || sched.duration_minutes || 90,
            }));
        } else {
            const days = sched.days_of_week || ["MONDAY"];
            initialDayTimes = days.map((d) => ({
                day: d,
                start_time: sched.start_time || "10:30:00",
                end_time: sched.end_time || "12:00:00",
                duration_minutes: sched.duration_minutes || 90,
            }));
        }

        setFormData({
            title: sched.title,
            course: sched.course || "",
            assigned_group_ids: sched.assigned_groups_details?.map((g) => g.id) || sched.assigned_group_ids || [],
            assigned_student_ids: sched.assigned_students_details?.map((s) => s.id) || sched.assigned_student_ids || [],
            day_times: initialDayTimes,
            mode: sched.mode || "PHYSICAL",
            venue_or_link: sched.venue_or_link || "",
            instructor_name: sched.instructor_name || "",
            color_tag: sched.color_tag || "#2563eb",
            notes: sched.notes || "",
            is_active: sched.is_active !== false,
        });
        setBulkDuration(initialDayTimes[0]?.duration_minutes || 90);
        setStudentSearchTerm("");
        setDialogOpen(true);
        loadStudents();
    };

    const handleSave = async (sendEmail = false) => {
        if (!formData.title.trim()) {
            errorToast(null, "Lecture Title is required.");
            return;
        }
        if (!formData.day_times || formData.day_times.length === 0) {
            errorToast(null, "Please select at least one day of the week.");
            return;
        }

        // Validate each day's timing
        for (const dt of formData.day_times) {
            if (!dt.start_time || !dt.end_time) {
                errorToast(null, `Start and end time are required for ${dt.day}.`);
                return;
            }
        }

        try {
            setSaving(true);
            setSavingType(sendEmail ? "SAVE_EMAIL" : "SAVE_ONLY");
            const daysOfWeek = formData.day_times.map((dt) => dt.day);
            const firstDt = formData.day_times[0];

            const formattedDayTimes = formData.day_times.map((dt) => ({
                day: dt.day,
                start_time: dt.start_time.length === 5 ? `${dt.start_time}:00` : dt.start_time,
                end_time: dt.end_time.length === 5 ? `${dt.end_time}:00` : dt.end_time,
                duration_minutes: dt.duration_minutes === "CUSTOM" ? 90 : Number(dt.duration_minutes) || 90,
            }));

            const payload = {
                title: formData.title.trim(),
                course: formData.course || null,
                assigned_group_ids: formData.assigned_group_ids,
                assigned_student_ids: formData.assigned_student_ids,
                days_of_week: daysOfWeek,
                day_times: formattedDayTimes,
                duration_minutes: firstDt.duration_minutes === "CUSTOM" ? 90 : Number(firstDt.duration_minutes) || 90,
                start_time: firstDt.start_time.length === 5 ? `${firstDt.start_time}:00` : firstDt.start_time,
                end_time: firstDt.end_time.length === 5 ? `${firstDt.end_time}:00` : firstDt.end_time,
                mode: formData.mode,
                venue_or_link: formData.venue_or_link.trim(),
                instructor_name: formData.instructor_name.trim(),
                color_tag: formData.color_tag,
                notes: formData.notes.trim(),
                is_active: formData.is_active,
                send_email: Boolean(sendEmail),
            };

            if (editingSchedule) {
                const res = await api.patch(`/learning/lecture-schedules/${editingSchedule.id}/`, payload);
                const count = res.data?.emails_sent;
                successToast(sendEmail && count ? `Schedule updated & email dispatched to ${count} student(s)!` : (sendEmail ? "Schedule updated & notification emails dispatched!" : "Lecture schedule updated successfully!"));
            } else {
                const res = await api.post("/learning/lecture-schedules/", payload);
                const count = res.data?.emails_sent;
                successToast(sendEmail && count ? `Lecture scheduled & email dispatched to ${count} student(s)!` : (sendEmail ? "Lecture scheduled & notification emails dispatched!" : "Lecture scheduled successfully!"));
            }

            setDialogOpen(false);
            loadAll();
        } catch (err) {
            errorToast(err, "Failed to save lecture schedule");
        } finally {
            setSaving(false);
            setSavingType(null);
        }
    };

    const matchingReminderSchedules = useMemo(() => {
        if (reminderTargetType === "GROUP") {
            if (!reminderGroupId) return [];
            return schedules.filter((s) => {
                const groupIds = (s.assigned_group_ids || []).map(String);
                const groupDetailIds = (s.assigned_groups_details || []).map((g) => String(g.id));
                return groupIds.includes(String(reminderGroupId)) || groupDetailIds.includes(String(reminderGroupId));
            });
        }
        if (reminderTargetType === "STUDENTS") {
            if (!reminderStudentId) return [];
            const studentObj = students.find((st) => String(st.id) === String(reminderStudentId));

            // Find this student's groups
            const studentGroups = groups.filter((g) => (g.members_detail || g.members || []).some((m) => String(m.id || m) === String(reminderStudentId)));
            const studentGroupIds = studentGroups.map((g) => String(g.id));

            return schedules.filter((s) => {
                const directStudentIds = (s.assigned_student_ids || []).map(String);
                const directDetailIds = (s.assigned_students_details || []).map((st) => String(st.id));
                const isDirect = directStudentIds.includes(String(reminderStudentId)) || directDetailIds.includes(String(reminderStudentId));

                const scheduleGroupIds = (s.assigned_group_ids || []).map(String);
                const scheduleGroupDetailIds = (s.assigned_groups_details || []).map((g) => String(g.id));
                const isGroup = scheduleGroupIds.some((gid) => studentGroupIds.includes(gid)) ||
                               scheduleGroupDetailIds.some((gid) => studentGroupIds.includes(gid));

                const studentCourseIds = (studentObj?.courses || []).map((c) => String(c.course?.id || c.course || c.id || c));
                const isCourse = Boolean(s.course && studentCourseIds.includes(String(s.course)));

                return isDirect || isGroup || isCourse;
            });
        }
        if (reminderTargetType === "SCHEDULE") {
            if (!reminderScheduleId) return [];
            const sched = schedules.find((s) => String(s.id) === String(reminderScheduleId));
            return sched ? [sched] : [];
        }
        if (reminderTargetType === "COURSE") {
            if (!reminderCourseId) return [];
            return schedules.filter((s) => String(s.course) === String(reminderCourseId));
        }
        return [];
    }, [reminderTargetType, reminderGroupId, reminderStudentId, reminderScheduleId, reminderCourseId, schedules, groups]);

    const filteredGroups = useMemo(() => {
        if (!reminderSearchQuery.trim()) return groups;
        const term = reminderSearchQuery.toLowerCase();
        return groups.filter((g) => (g.name || "").toLowerCase().includes(term));
    }, [groups, reminderSearchQuery]);

    const filteredStudents = useMemo(() => {
        if (!reminderSearchQuery.trim()) return students;
        const term = reminderSearchQuery.toLowerCase();
        return students.filter((st) => {
            const fullName = `${st.first_name || ""} ${st.last_name || ""}`.toLowerCase();
            const username = (st.username || "").toLowerCase();
            const email = (st.email || "").toLowerCase();
            return fullName.includes(term) || username.includes(term) || email.includes(term);
        });
    }, [students, reminderSearchQuery]);

    const filteredSchedules = useMemo(() => {
        if (!reminderSearchQuery.trim()) return schedules;
        const term = reminderSearchQuery.toLowerCase();
        return schedules.filter((s) => {
            const title = (s.title || "").toLowerCase();
            const course = (s.course_name || "").toLowerCase();
            const instructor = (s.instructor_name || "").toLowerCase();
            const days = (s.days_of_week || []).join(" ").toLowerCase();
            return title.includes(term) || course.includes(term) || instructor.includes(term) || days.includes(term);
        });
    }, [schedules, reminderSearchQuery]);

    const filteredCourses = useMemo(() => {
        if (!reminderSearchQuery.trim()) return courses;
        const term = reminderSearchQuery.toLowerCase();
        return courses.filter((c) => {
            const name = (c.name || "").toLowerCase();
            const code = (c.code_prefix || c.code || "").toLowerCase();
            return name.includes(term) || code.includes(term);
        });
    }, [courses, reminderSearchQuery]);

    useEffect(() => {
        setReminderSelectedScheduleIds(matchingReminderSchedules.map((s) => s.id));
    }, [matchingReminderSchedules]);

    const handleOpenReminderModal = (preselectedScheduleId = "") => {
        if (preselectedScheduleId) {
            setReminderTargetType("SCHEDULE");
            setReminderScheduleId(preselectedScheduleId);
            setReminderGroupId("");
            setReminderStudentId("");
            setReminderCourseId("");
        } else {
            setReminderTargetType("GROUP");
            setReminderGroupId(groups[0]?.id || "");
            setReminderStudentId("");
            setReminderScheduleId("");
            setReminderCourseId("");
        }
        setReminderCustomNote("");
        setReminderSearchQuery("");
        setReminderOpen(true);
        loadStudents();
    };

    const handleSendReminder = async () => {
        if (reminderSelectedScheduleIds.length === 0) {
            errorToast(null, "Please select at least one matching lecture schedule to send.");
            return;
        }

        try {
            setReminderSending(true);
            const payload = {
                schedule_ids: reminderSelectedScheduleIds,
                group_id: reminderTargetType === "GROUP" ? reminderGroupId : undefined,
                student_ids: reminderTargetType === "STUDENTS" && reminderStudentId ? [reminderStudentId] : undefined,
                course_id: reminderTargetType === "COURSE" ? reminderCourseId : undefined,
                custom_note: reminderCustomNote.trim() || undefined,
            };

            const res = await api.post("/learning/lecture-schedules/send-reminder/", payload);
            successToast(res.data?.message || "Lecture reminders sent successfully!");
            setReminderOpen(false);
        } catch (err) {
            errorToast(err, "Failed to send lecture reminder");
        } finally {
            setReminderSending(false);
        }
    };

    const handleDelete = (sched) => {
        confirmAction(`Delete lecture schedule "${sched.title}"?`, async () => {
            try {
                await api.delete(`/learning/lecture-schedules/${sched.id}/`);
                successToast("Schedule deleted");
                loadAll();
            } catch (err) {
                errorToast(err, "Failed to delete schedule");
            }
        }, null, "Delete", "Cancel", true);
    };

    // Day Management Helpers
    const toggleDay = (dayKey) => {
        setFormData((prev) => {
            const exists = prev.day_times.some((dt) => dt.day === dayKey);
            if (exists) {
                return { ...prev, day_times: prev.day_times.filter((dt) => dt.day !== dayKey) };
            } else {
                const defaultTiming = prev.day_times.length > 0 ? prev.day_times[prev.day_times.length - 1] : { start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 };
                return {
                    ...prev,
                    day_times: [...prev.day_times, { day: dayKey, start_time: defaultTiming.start_time, end_time: defaultTiming.end_time, duration_minutes: defaultTiming.duration_minutes }],
                };
            }
        });
    };

    const applyDayPreset = (daysList) => {
        setFormData((prev) => {
            const existingMap = new Map(prev.day_times.map((dt) => [dt.day, dt]));
            const fallback = prev.day_times[0] || { start_time: "10:30:00", end_time: "12:00:00", duration_minutes: 90 };
            const newDayTimes = daysList.map((d) => existingMap.get(d) || { day: d, start_time: fallback.start_time, end_time: fallback.end_time, duration_minutes: fallback.duration_minutes });
            return { ...prev, day_times: newDayTimes };
        });
    };

    const updateDayTiming = (dayKey, updates) => {
        setFormData((prev) => ({
            ...prev,
            day_times: prev.day_times.map((dt) => (dt.day === dayKey ? { ...dt, ...updates } : dt)),
        }));
    };

    const copyDayTimeToAll = (sourceDayKey) => {
        setFormData((prev) => {
            const source = prev.day_times.find((dt) => dt.day === sourceDayKey);
            if (!source) return prev;
            return {
                ...prev,
                day_times: prev.day_times.map((dt) => ({
                    ...dt,
                    start_time: source.start_time,
                    end_time: source.end_time,
                    duration_minutes: source.duration_minutes,
                })),
            };
        });
        successToast(`Copied ${sourceDayKey} time to all picked days!`);
    };

    const applyBulkSlotToAll = (slot) => {
        setFormData((prev) => ({
            ...prev,
            day_times: prev.day_times.map((dt) => ({
                ...dt,
                start_time: slot.start_time,
                end_time: slot.end_time,
                duration_minutes: slot.duration,
            })),
        }));
        successToast(`Applied ${slot.label} to all picked days!`);
    };

    // Filtered schedules
    const filtered = schedules.filter((s) => {
        const matchesSearch =
            !searchTerm ||
            s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.venue_or_link?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterDay) {
            const inDays = (s.days_of_week || []).map((d) => String(d).toUpperCase()).includes(filterDay.toUpperCase());
            const inDayTimes = (s.day_times || []).some((dt) => String(dt.day).toUpperCase() === filterDay.toUpperCase());
            if (!inDays && !inDayTimes) return false;
        }

        if (filterCourse && String(s.course) !== String(filterCourse)) return false;
        if (filterMode && s.mode !== filterMode) return false;

        return true;
    });

    const { slotOverlapMap, totalConcurrentCount, allConflictSlots } = useMemo(() => getScheduleOverlaps(schedules), [schedules]);
    const bulkSlots = generateSlotsForDuration(bulkDuration === "CUSTOM" ? 90 : Number(bulkDuration) || 90);

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        Lecture Timetable & Schedule
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Schedule and manage recurring classes for student groups, individual students, or entire courses with custom per-day timings.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Button
                        variant="outlined"
                        startIcon={<NotificationsActive />}
                        onClick={() => handleOpenReminderModal()}
                        sx={{
                            color: "#2563eb",
                            borderColor: "#bfdbfe",
                            bgcolor: "#eff6ff",
                            "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" },
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: "none",
                        }}
                    >
                        Send Schedule Reminder
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={openCreate}
                        sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 700, borderRadius: 2, textTransform: "none" }}
                    >
                        Schedule Class
                    </Button>
                </Stack>
            </Box>

            {/* Quick Broadcast Alert Banner */}
            <Alert
                severity="info"
                icon={<Campaign sx={{ color: "#2563eb" }} />}
                sx={{
                    mb: 3,
                    borderRadius: 2.5,
                    bgcolor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    "& .MuiAlert-message": { width: "100%" },
                }}
                action={
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<Send sx={{ fontSize: "0.85rem !important" }} />}
                        onClick={() => handleOpenReminderModal()}
                        sx={{
                            bgcolor: "#15803d",
                            "&:hover": { bgcolor: "#166534" },
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            textTransform: "none",
                            borderRadius: 1.5,
                            boxShadow: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Broadcast Reminder
                    </Button>
                }
            >
                <Typography variant="subtitle2" fontWeight={800} color="#15803d">
                    Instant Schedule Reminder Alert
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                    Need to remind students about a lecture? Choose any student group, course, or specific students to send email reminders anytime.
                </Typography>
            </Alert>

            {/* Filter and View Mode Toolbar */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
                        <TextField
                            size="small"
                            placeholder="Search class title, instructor, venue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Day of Week"
                            value={filterDay}
                            onChange={(e) => setFilterDay(e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All Days</MenuItem>
                            {DAYS_OF_WEEK.map((d) => (
                                <MenuItem key={d.key} value={d.key}>{d.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Course"
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="">All Courses</MenuItem>
                            {courses.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Mode"
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All Modes</MenuItem>
                            <MenuItem value="PHYSICAL">Physical (Classroom)</MenuItem>
                            <MenuItem value="ONLINE">Online</MenuItem>
                            <MenuItem value="HYBRID">Hybrid</MenuItem>
                        </TextField>
                    </Stack>

                    {/* View Switcher Toggle */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px solid", borderColor: "grey.100", flexWrap: "wrap", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Showing {filtered.length} scheduled lecture(s)
                            </Typography>
                            {totalConcurrentCount > 0 && (
                                <Tooltip arrow title="Multiple classes share the same day and time slot. Click to inspect all clashes and enrolled students.">
                                    <Chip
                                        icon={<WarningAmber sx={{ color: "white !important", fontSize: "0.85rem !important" }} />}
                                        label={`${totalConcurrentCount} Concurrent Time Slot${totalConcurrentCount === 1 ? "" : "s"} (Click)`}
                                        size="small"
                                        onClick={() => setConflictModalData({ isAllSlots: true, allConflictSlots })}
                                        sx={{
                                            bgcolor: "#dc2626",
                                            color: "white",
                                            fontWeight: 800,
                                            fontSize: "0.68rem",
                                            height: 22,
                                            cursor: "pointer",
                                            boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                                            "&:hover": { bgcolor: "#b91c1c" },
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </Box>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            size="small"
                            onChange={(e, val) => { if (val) setViewMode(val); }}
                        >
                            <ToggleButton value="GRID" sx={{ fontWeight: 700, px: { xs: 1.5, sm: 2 }, gap: 0.5 }}>
                                <ViewWeek fontSize="small" /> Weekly Grid
                            </ToggleButton>
                            <ToggleButton value="TABLE" sx={{ fontWeight: 700, px: { xs: 1.5, sm: 2 }, gap: 0.5 }}>
                                <TableRows fontSize="small" /> List View
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Stack>
            </Paper>

            {/* MAIN CONTENT VIEW */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: "center", borderRadius: 3 }}>
                    <CalendarMonth sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                        No lecture schedules found
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                        Create your first lecture timetable to help students track their daily classes.
                    </Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 700 }}>
                        Schedule Class
                    </Button>
                </Paper>
            ) : viewMode === "GRID" ? (
                <WeeklyTimetableGrid schedules={filtered} isAdmin={true} onEdit={openEdit} onDelete={handleDelete} />
            ) : (
                <Box>
                    {/* Desktop Table View */}
                    <TableContainer component={Paper} sx={{ borderRadius: 3, display: { xs: "none", md: "block" } }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "#0f172a" }}>
                                <TableRow>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Class / Title</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Days & Per-Day Timings</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Target (Groups / Students)</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Mode & Venue</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }}>Instructor</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 700 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((sched) => (
                                    <TableRow key={sched.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Box sx={{ width: 10, height: 36, borderRadius: 1, bgcolor: sched.color_tag || "#2563eb", flexShrink: 0 }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight={800}>{sched.title}</Typography>
                                                    {sched.course_name && (
                                                        <Typography variant="caption" color="text.secondary">{sched.course_name}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.8}>
                                                {sched.day_times && sched.day_times.length > 0 ? (
                                                    sched.day_times.map((dt) => {
                                                        const overlapInfo = slotOverlapMap?.[`${String(dt.day).toUpperCase()}-${sched.id}`];
                                                        return (
                                                            <Box key={dt.day} sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                                                                <Chip label={dt.day.slice(0, 3)} size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "#0f172a", color: "white" }} />
                                                                <Typography variant="caption" fontWeight={700}>
                                                                    {formatTime12(dt.start_time)} – {formatTime12(dt.end_time)}
                                                                </Typography>
                                                                {dt.duration_minutes && (
                                                                    <Chip label={`${dt.duration_minutes}m`} size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }} />
                                                                )}
                                                                {overlapInfo?.hasOverlap && (
                                                                    <Tooltip
                                                                        arrow
                                                                        title={
                                                                            <Box sx={{ p: 0.5, maxWidth: 260 }}>
                                                                                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#fecaca", fontSize: "0.78rem" }}>
                                                                                    ⚠️ {overlapInfo.count} Classes Assigned at this Same Time
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ color: "grey.200", display: "block", mt: 0.3 }}>
                                                                                    Concurrent classes: {overlapInfo.overlappingSchedules.map((o) => `"${o.title}" (${o.targetLabel || getScheduleTargetLabel(o.schedule)})`).join(", ")}
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ color: "#86efac", display: "block", mt: 0.5, fontStyle: "italic" }}>
                                                                                    ✓ Click to inspect all clashes & enrolled students
                                                                                </Typography>
                                                                            </Box>
                                                                        }
                                                                    >
                                                                        <Chip
                                                                            icon={<WarningAmber sx={{ fontSize: "0.75rem !important", color: "white !important" }} />}
                                                                            label={`${overlapInfo.count} at same time (Click)`}
                                                                            size="small"
                                                                            onClick={() => setConflictModalData(overlapInfo)}
                                                                            sx={{
                                                                                height: 18,
                                                                                fontSize: "0.6rem",
                                                                                fontWeight: 900,
                                                                                bgcolor: "#dc2626",
                                                                                color: "white",
                                                                                cursor: "pointer",
                                                                                boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
                                                                                "&:hover": { bgcolor: "#b91c1c" },
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        );
                                                    })
                                                ) : (
                                                    <Box>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {formatTime12(sched.start_time)} – {formatTime12(sched.end_time)}
                                                            </Typography>
                                                            {(sched.days_of_week || []).map((d) => {
                                                                const overlapInfo = slotOverlapMap?.[`${String(d).toUpperCase()}-${sched.id}`];
                                                                return overlapInfo?.hasOverlap ? (
                                                                    <Tooltip
                                                                        key={d}
                                                                        arrow
                                                                        title={`⚠️ ${overlapInfo.count} classes assigned on ${d} at this time. Click to inspect.`}
                                                                    >
                                                                        <Chip
                                                                            icon={<WarningAmber sx={{ fontSize: "0.75rem !important", color: "white !important" }} />}
                                                                            label={`${d.slice(0, 3)}: ${overlapInfo.count} at same time (Click)`}
                                                                            size="small"
                                                                            onClick={() => setConflictModalData(overlapInfo)}
                                                                            sx={{
                                                                                height: 18,
                                                                                fontSize: "0.6rem",
                                                                                fontWeight: 900,
                                                                                bgcolor: "#dc2626",
                                                                                color: "white",
                                                                                cursor: "pointer",
                                                                                "&:hover": { bgcolor: "#b91c1c" },
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                ) : null;
                                                            })}
                                                        </Box>
                                                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                                                            {(sched.days_of_week || []).map((d) => (
                                                                <Chip key={d} label={d.slice(0, 3)} size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: "#f1f5f9" }} />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", maxWidth: 300 }}>
                                                {sched.assigned_groups_details && sched.assigned_groups_details.length > 0 &&
                                                    sched.assigned_groups_details.map((g) => (
                                                        <Chip
                                                            key={g.id}
                                                            icon={<Workspaces sx={{ fontSize: "0.8rem !important" }} />}
                                                            label={g.name}
                                                            size="small"
                                                            sx={{ fontWeight: 700, bgcolor: "#f1f5f9", height: 22, fontSize: "0.68rem" }}
                                                        />
                                                    ))}
                                                {sched.assigned_students_details && sched.assigned_students_details.length > 0 &&
                                                    sched.assigned_students_details.map((s) => (
                                                        <Chip
                                                            key={s.id}
                                                            icon={<Person sx={{ fontSize: "0.8rem !important", color: "#1d4ed8 !important" }} />}
                                                            label={s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.username || s.email}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                bgcolor: "#eff6ff",
                                                                color: "#1d4ed8",
                                                                border: "1px solid #bfdbfe",
                                                                height: 22,
                                                                fontSize: "0.68rem",
                                                            }}
                                                        />
                                                    ))}
                                                {(!sched.assigned_groups_details || sched.assigned_groups_details.length === 0) &&
                                                 (!sched.assigned_students_details || sched.assigned_students_details.length === 0) && (
                                                    <Chip label="Entire Course / General" size="small" variant="outlined" sx={{ height: 22, fontSize: "0.68rem" }} />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Chip
                                                    label={sched.mode === "PHYSICAL" ? "Physical (Classroom)" : sched.mode}
                                                    size="small"
                                                    color={sched.mode === "PHYSICAL" ? "success" : sched.mode === "ONLINE" ? "primary" : "secondary"}
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, width: "fit-content" }}
                                                />
                                                {sched.venue_or_link && (
                                                    sched.venue_or_link.startsWith("http") ? (
                                                        <Button
                                                            size="small"
                                                            href={sched.venue_or_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            endIcon={<OpenInNew sx={{ fontSize: "0.75rem !important" }} />}
                                                            sx={{ textTransform: "none", fontSize: "0.75rem", p: 0, justifyContent: "flex-start" }}
                                                        >
                                                            Meeting Link
                                                        </Button>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">📍 {sched.venue_or_link}</Typography>
                                                    )
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{sched.instructor_name || "—"}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => openEdit(sched)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(sched)}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Mobile-Optimized List Cards (Shown on mobile screens) */}
                    <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
                        {filtered.map((sched) => (
                            <Paper
                                key={sched.id}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    borderLeft: `6px solid ${sched.color_tag || "#2563eb"}`,
                                }}
                            >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5, gap: 1 }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.3 }}>
                                            {sched.title}
                                        </Typography>
                                        {sched.course_name && (
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                                Course: {sched.course_name}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Chip
                                        label={sched.mode === "PHYSICAL" ? "Physical" : sched.mode}
                                        size="small"
                                        color={sched.mode === "PHYSICAL" ? "success" : "primary"}
                                        variant="outlined"
                                        sx={{ fontWeight: 800, height: 22 }}
                                    />
                                </Box>

                                {/* Per-day timings */}
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                                        Schedule:
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                        {sched.day_times && sched.day_times.length > 0 ? (
                                            sched.day_times.map((dt) => {
                                                const overlapInfo = slotOverlapMap?.[`${String(dt.day).toUpperCase()}-${sched.id}`];
                                                return (
                                                    <Box key={dt.day} sx={{ display: "flex", alignItems: "center", gap: 0.6, bgcolor: "#f8fafc", px: 1, py: 0.5, borderRadius: 1.5, border: "1px solid", borderColor: "grey.200", flexWrap: "wrap" }}>
                                                        <Chip label={dt.day.slice(0, 3)} size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "#0f172a", color: "white" }} />
                                                        <Typography variant="caption" fontWeight={700}>
                                                            {formatTime12(dt.start_time)} – {formatTime12(dt.end_time)}
                                                        </Typography>
                                                        {overlapInfo?.hasOverlap && (
                                                            <Chip
                                                                icon={<WarningAmber sx={{ fontSize: "0.75rem !important", color: "white !important" }} />}
                                                                label={`${overlapInfo.count} at same time (Click)`}
                                                                size="small"
                                                                onClick={() => setConflictModalData(overlapInfo)}
                                                                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 900, bgcolor: "#dc2626", color: "white", cursor: "pointer", "&:hover": { bgcolor: "#b91c1c" } }}
                                                            />
                                                        )}
                                                    </Box>
                                                );
                                            })
                                        ) : (
                                            <Typography variant="caption" fontWeight={700}>
                                                {formatTime12(sched.start_time)} – {formatTime12(sched.end_time)} · {(sched.days_of_week || []).map((d) => d.slice(0, 3)).join(", ")}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Target Groups / Students */}
                                {((sched.assigned_groups_details && sched.assigned_groups_details.length > 0) || (sched.assigned_students_details && sched.assigned_students_details.length > 0)) && (
                                    <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.4}>
                                            Target:
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {sched.assigned_groups_details?.map((g) => (
                                                <Chip key={g.id} icon={<Workspaces sx={{ fontSize: "0.75rem !important" }} />} label={g.name} size="small" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem", bgcolor: "#f1f5f9" }} />
                                            ))}
                                            {sched.assigned_students_details?.map((s) => (
                                                <Chip
                                                    key={s.id}
                                                    icon={<Person sx={{ fontSize: "0.75rem !important", color: "#1d4ed8 !important" }} />}
                                                    label={s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.username || s.email}
                                                    size="small"
                                                    sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem", bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {sched.instructor_name && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                        👨‍🏫 Instructor: <strong>{sched.instructor_name}</strong>
                                    </Typography>
                                )}

                                {sched.venue_or_link && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                        📍 Venue: <strong>{sched.venue_or_link}</strong>
                                    </Typography>
                                )}

                                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1, borderTop: "1px solid", borderColor: "grey.100" }}>
                                    <Button size="small" startIcon={<Edit />} onClick={() => openEdit(sched)} sx={{ fontWeight: 700 }}>
                                        Edit
                                    </Button>
                                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(sched)} sx={{ fontWeight: 700 }}>
                                        Delete
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* CREATE / EDIT SCHEDULE MODAL */}
            <Dialog
                open={dialogOpen}
                onClose={(e, r) => { if (r === "backdropClick") return; setDialogOpen(false); }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {editingSchedule ? "Edit Lecture Schedule" : "Schedule New Lecture"}
                    <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "white" }} size="small">
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 3 }}>
                    <Stack spacing={3.5}>
                        {/* 1. Basic Details */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
                                1. CLASS DETAILS & TOPIC
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="Lecture / Class Title"
                                    required
                                    fullWidth
                                    size="small"
                                    placeholder="e.g. React State Management & Hooks, Python OOP & Classes"
                                    value={formData.title}
                                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                                />
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        select
                                        label="Course (Optional)"
                                        fullWidth
                                        size="small"
                                        value={formData.course}
                                        onChange={(e) => setFormData((p) => ({ ...p, course: e.target.value }))}
                                    >
                                        <MenuItem value="">No specific course / General</MenuItem>
                                        {courses.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        label="Instructor / Tutor Name"
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. Engr. Stephen"
                                        value={formData.instructor_name}
                                        onChange={(e) => setFormData((p) => ({ ...p, instructor_name: e.target.value }))}
                                    />
                                </Stack>
                            </Stack>
                        </Box>

                        {/* 2. Target Assignment (Groups & Students) */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
                                2. TARGET ASSIGNMENT (GROUPS / STUDENTS)
                            </Typography>
                            <Stack spacing={2}>
                                {/* Multi-Group Select */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="groups-multi-label">Assigned Student Group(s) (Optional)</InputLabel>
                                    <Select
                                        labelId="groups-multi-label"
                                        multiple
                                        label="Assigned Student Group(s) (Optional)"
                                        value={formData.assigned_group_ids}
                                        open={groupsSelectOpen}
                                        onOpen={() => setGroupsSelectOpen(true)}
                                        onClose={() => setGroupsSelectOpen(false)}
                                        onChange={(e) => {
                                            const val = typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value;
                                            setFormData((p) => ({ ...p, assigned_group_ids: val }));
                                        }}
                                        renderValue={(selected) => {
                                            if (selected.length === 0) return <em>No specific groups selected</em>;
                                            return (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                    {selected.map((gid) => {
                                                        const g = groups.find((item) => item.id === gid);
                                                        return <Chip key={gid} label={g?.name || `Group #${gid}`} size="small" sx={{ fontWeight: 600 }} />;
                                                    })}
                                                </Box>
                                            );
                                        }}
                                    >
                                        {groups.map((g) => (
                                            <MenuItem key={g.id} value={g.id}>
                                                <Checkbox checked={formData.assigned_group_ids.includes(g.id)} size="small" />
                                                <Typography variant="body2">{g.name} ({g.course_name || "General"})</Typography>
                                            </MenuItem>
                                        ))}
                                        <Box sx={{ p: 1, position: "sticky", bottom: 0, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", zIndex: 2 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => setGroupsSelectOpen(false)}
                                                sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                                            >
                                                Add / Confirm Groups ({formData.assigned_group_ids.length})
                                            </Button>
                                        </Box>
                                    </Select>
                                </FormControl>

                                {/* Multi-Student Select */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="students-multi-label">Direct Individual Student(s) (Optional)</InputLabel>
                                    <Select
                                        labelId="students-multi-label"
                                        multiple
                                        label="Direct Individual Student(s) (Optional)"
                                        value={formData.assigned_student_ids}
                                        open={studentsSelectOpen}
                                        onOpen={() => setStudentsSelectOpen(true)}
                                        onClose={() => setStudentsSelectOpen(false)}
                                        onChange={(e) => {
                                            const val = typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value;
                                            setFormData((p) => ({ ...p, assigned_student_ids: val }));
                                        }}
                                        renderValue={(selected) => {
                                            if (!selected || selected.length === 0) return "Select individual students";
                                            const selectedObjs = students.filter((s) => selected.includes(s.id));
                                            if (selectedObjs.length <= 2) {
                                                return selectedObjs.map((s) => `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email).join(", ");
                                            }
                                            return `${selectedObjs.length} students selected (${selectedObjs.slice(0, 2).map((s) => s.first_name).join(", ")} +${selectedObjs.length - 2} more)`;
                                        }}
                                    >
                                        <Box sx={{ p: 1, position: "sticky", top: 0, bgcolor: "background.paper", zIndex: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Search student name, email..."
                                                value={studentSearchTerm}
                                                onChange={(e) => setStudentSearchTerm(e.target.value)}
                                                onKeyDown={(e) => e.stopPropagation()}
                                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                                            />
                                        </Box>
                                        {students
                                            .filter((s) => !studentSearchTerm || `${s.first_name} ${s.last_name} ${s.email} ${s.username}`.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                                            .map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    <Checkbox checked={formData.assigned_student_ids.includes(s.id)} size="small" />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{s.first_name} {s.last_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        <Box sx={{ p: 1, position: "sticky", bottom: 0, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", zIndex: 2 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => setStudentsSelectOpen(false)}
                                                sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                                            >
                                                Add / Confirm Students ({formData.assigned_student_ids.length})
                                            </Button>
                                        </Box>
                                    </Select>
                                </FormControl>

                                {/* Selected Student Name Chips Preview */}
                                {formData.assigned_student_ids.length > 0 && (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 0.5 }}>
                                        {students
                                            .filter((s) => formData.assigned_student_ids.includes(s.id))
                                            .map((s) => (
                                                <Chip
                                                    key={s.id}
                                                    icon={<Person sx={{ fontSize: "0.85rem !important", color: "#1d4ed8 !important" }} />}
                                                    label={`${s.first_name || ""} ${s.last_name || ""}`.trim() || s.username || s.email}
                                                    size="small"
                                                    onDelete={() => {
                                                        setFormData((p) => ({
                                                            ...p,
                                                            assigned_student_ids: p.assigned_student_ids.filter((id) => id !== s.id),
                                                        }));
                                                    }}
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: "#eff6ff",
                                                        color: "#1d4ed8",
                                                        border: "1px solid #bfdbfe",
                                                    }}
                                                />
                                            ))}
                                    </Box>
                                )}
                            </Stack>
                        </Box>

                        {/* 3. Recurring Days & Per-Day Timings */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
                                3. RECURRING DAYS & TIMETABLE TIMINGS (10:30 AM – 6:30 PM)
                            </Typography>

                            {/* Day Presets */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
                                    QUICK DAY PRESETS
                                </Typography>
                                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 1.5 }}>
                                    {DAY_PRESETS.map((preset) => (
                                        <Chip
                                            key={preset.label}
                                            label={preset.label}
                                            size="small"
                                            clickable
                                            variant="outlined"
                                            onClick={() => applyDayPreset(preset.days)}
                                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                                        />
                                    ))}
                                </Stack>

                                {/* Day Selector Chips */}
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {DAYS_OF_WEEK.map((d) => {
                                        const isSelected = formData.day_times.some((dt) => dt.day === d.key);
                                        return (
                                            <Chip
                                                key={d.key}
                                                label={d.label}
                                                clickable
                                                color={isSelected ? "primary" : "default"}
                                                variant={isSelected ? "filled" : "outlined"}
                                                onClick={() => toggleDay(d.key)}
                                                sx={{ fontWeight: 800 }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Bulk Apply Bar */}
                            {formData.day_times.length > 1 && (
                                <Paper sx={{ p: 2, mb: 2.5, bgcolor: "#f8fafc", border: "1px dashed", borderColor: "grey.300", borderRadius: 2 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <AutoAwesome sx={{ fontSize: 16, color: "primary.main" }} />
                                        <Typography variant="caption" fontWeight={800} color="text.primary">
                                            QUICK-SYNC: APPLY SAME TIME SLOT TO ALL {formData.day_times.length} PICKED DAYS
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 1.5 }}>
                                        {DURATION_OPTIONS.map((opt) => (
                                            <Chip
                                                key={opt.value}
                                                label={opt.label}
                                                size="small"
                                                clickable
                                                color={bulkDuration === opt.value ? "primary" : "default"}
                                                variant={bulkDuration === opt.value ? "filled" : "outlined"}
                                                onClick={() => setBulkDuration(opt.value)}
                                                sx={{ fontWeight: 700 }}
                                            />
                                        ))}
                                    </Stack>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                        {bulkSlots.map((slot) => (
                                            <Button
                                                key={slot.label}
                                                size="small"
                                                variant="outlined"
                                                onClick={() => applyBulkSlotToAll(slot)}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    bgcolor: "white",
                                                    textTransform: "none",
                                                }}
                                            >
                                                Apply {slot.label}
                                            </Button>
                                        ))}
                                    </Box>
                                </Paper>
                            )}

                            {/* PER-DAY TIMING ACCORDIONS / CARDS */}
                            <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={1.5}>
                                CUSTOMIZE TIME FOR EACH PICKED DAY ({formData.day_times.length} selected):
                            </Typography>

                            <Stack spacing={1.5}>
                                {formData.day_times.map((dt) => {
                                    const dayObj = DAYS_OF_WEEK.find((d) => d.key === dt.day) || { label: dt.day };
                                    const daySlots = generateSlotsForDuration(dt.duration_minutes === "CUSTOM" ? 90 : Number(dt.duration_minutes) || 90);

                                    return (
                                        <Paper
                                            key={dt.day}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2.5,
                                                border: "1px solid",
                                                borderColor: "grey.300",
                                                bgcolor: "white",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Chip
                                                        label={dayObj.label}
                                                        size="small"
                                                        sx={{ bgcolor: "#0f172a", color: "white", fontWeight: 800, px: 0.5 }}
                                                    />
                                                    <Typography variant="body2" fontWeight={800} color="primary">
                                                        {formatTime12(dt.start_time)} – {formatTime12(dt.end_time)}
                                                    </Typography>
                                                    <Chip label={`${dt.duration_minutes || 90}m`} size="small" variant="outlined" sx={{ fontWeight: 700, height: 20 }} />
                                                </Box>

                                                {formData.day_times.length > 1 && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<ContentCopy sx={{ fontSize: "0.85rem !important" }} />}
                                                        onClick={() => copyDayTimeToAll(dt.day)}
                                                        sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700 }}
                                                    >
                                                        Copy to other days
                                                    </Button>
                                                )}
                                            </Box>

                                            {/* Duration chips for this day */}
                                            <Box sx={{ mb: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 1 }}>
                                                    Duration:
                                                </Typography>
                                                <Stack direction="row" spacing={0.8} useFlexGap sx={{ flexWrap: "wrap", display: "inline-flex" }}>
                                                    {DURATION_OPTIONS.map((opt) => (
                                                        <Chip
                                                            key={opt.value}
                                                            label={opt.short || opt.label}
                                                            size="small"
                                                            clickable
                                                            color={dt.duration_minutes === opt.value ? "primary" : "default"}
                                                            variant={dt.duration_minutes === opt.value ? "filled" : "outlined"}
                                                            onClick={() => updateDayTiming(dt.day, { duration_minutes: opt.value })}
                                                            sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Box>

                                            {/* Quick Slots for this day */}
                                            {dt.duration_minutes !== "CUSTOM" && (
                                                <Box sx={{ mb: 1.5, p: 1.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.8}>
                                                        Slots ({dt.duration_minutes}m):
                                                    </Typography>
                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                                        {daySlots.map((slot) => {
                                                            const isSelected =
                                                                dt.start_time.startsWith(slot.start_time.slice(0, 5)) &&
                                                                dt.end_time.startsWith(slot.end_time.slice(0, 5));

                                                            return (
                                                                <Button
                                                                    key={slot.label}
                                                                    size="small"
                                                                    variant={isSelected ? "contained" : "outlined"}
                                                                    onClick={() => updateDayTiming(dt.day, { start_time: slot.start_time, end_time: slot.end_time })}
                                                                    sx={{
                                                                        borderRadius: 1.5,
                                                                        fontSize: "0.7rem",
                                                                        fontWeight: 700,
                                                                        bgcolor: isSelected ? "#0f172a" : "white",
                                                                        borderColor: isSelected ? "#0f172a" : "grey.300",
                                                                        "&:hover": { bgcolor: isSelected ? "#1e293b" : "grey.100" },
                                                                        py: 0.2,
                                                                    }}
                                                                >
                                                                    {slot.label}
                                                                </Button>
                                                            );
                                                        })}
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Start and End Time Inputs */}
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                                <TextField
                                                    label="Start Time"
                                                    type="time"
                                                    size="small"
                                                    fullWidth
                                                    value={dt.start_time.slice(0, 5)}
                                                    onChange={(e) => updateDayTiming(dt.day, { start_time: `${e.target.value}:00` })}
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                />
                                                <TextField
                                                    label="End Time"
                                                    type="time"
                                                    size="small"
                                                    fullWidth
                                                    value={dt.end_time.slice(0, 5)}
                                                    onChange={(e) => updateDayTiming(dt.day, { end_time: `${e.target.value}:00` })}
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                />
                                            </Stack>

                                            {/* Real-time Overlap Notice for this Day & Time */}
                                            {(() => {
                                                const existingClashes = schedules.filter((s) => {
                                                    if (editingSchedule && s.id === editingSchedule.id) return false;
                                                    const dayTimes = (s.day_times && Array.isArray(s.day_times) && s.day_times.length > 0)
                                                        ? s.day_times
                                                        : (s.days_of_week || []).map((d) => ({
                                                            day: d,
                                                            start_time: s.start_time || "10:30:00",
                                                            end_time: s.end_time || "12:00:00",
                                                        }));
                                                    return dayTimes.some((otherDt) => {
                                                        if (String(otherDt.day).toUpperCase() !== String(dt.day).toUpperCase()) return false;
                                                        const oSt = timeStringToMinutes(otherDt.start_time);
                                                        const oEt = timeStringToMinutes(otherDt.end_time);
                                                        const curSt = timeStringToMinutes(dt.start_time);
                                                        const curEt = timeStringToMinutes(dt.end_time);
                                                        return curSt < oEt && oSt < curEt;
                                                    });
                                                });

                                                if (existingClashes.length === 0) return null;

                                                return (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "flex-start",
                                                            gap: 1,
                                                            mt: 1.5,
                                                            bgcolor: "#fef2f2",
                                                            border: "1px solid #fecaca",
                                                            p: 1.2,
                                                            borderRadius: 2,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <Chip
                                                            icon={<WarningAmber sx={{ fontSize: "0.85rem !important", color: "white !important" }} />}
                                                            label={`${existingClashes.length + 1} at same time`}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: "0.62rem",
                                                                fontWeight: 900,
                                                                bgcolor: "#dc2626",
                                                                color: "white",
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="caption" color="#991b1b" fontWeight={700} display="block">
                                                                Notice: {existingClashes.length} other {existingClashes.length === 1 ? "class is" : "classes are"} scheduled on {dayObj.label} at this time:
                                                            </Typography>
                                                            <Typography variant="caption" color="#7f1d1d" display="block" sx={{ mt: 0.2 }}>
                                                                {existingClashes.map((c) => `• "${c.title}" (${getScheduleTargetLabel(c)})`).join("  ")}
                                                            </Typography>
                                                            <Typography variant="caption" color="#166534" fontWeight={700} display="block" sx={{ mt: 0.3, fontStyle: "italic" }}>
                                                                ✓ Allowed since Stephotec has multiple tutors.
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                );
                                            })()}
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>

                        {/* 4. Mode, Venue & Color */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
                                4. MODE, VENUE & TIMETABLE BADGE
                            </Typography>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        select
                                        label="Class Mode"
                                        size="small"
                                        fullWidth
                                        value={formData.mode}
                                        onChange={(e) => setFormData((p) => ({ ...p, mode: e.target.value }))}
                                    >
                                        <MenuItem value="PHYSICAL">Physical (Classroom) [Default]</MenuItem>
                                        <MenuItem value="ONLINE">Online (Virtual Link)</MenuItem>
                                        <MenuItem value="HYBRID">Hybrid (Online & In-Person)</MenuItem>
                                    </TextField>
                                    <TextField
                                        label={formData.mode === "ONLINE" ? "Meeting URL (Google Meet / Zoom)" : "Classroom / Lab Venue"}
                                        fullWidth
                                        size="small"
                                        placeholder={formData.mode === "ONLINE" ? "https://meet.google.com/xyz-abc" : "e.g. Lab 1, Main Hall Room B"}
                                        value={formData.venue_or_link}
                                        onChange={(e) => setFormData((p) => ({ ...p, venue_or_link: e.target.value }))}
                                    />
                                </Stack>

                                {/* Color Theme Picker */}
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
                                        CARD COLOR THEME
                                    </Typography>
                                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                                        {COLOR_PRESETS.map((col) => (
                                            <Box
                                                key={col.value}
                                                onClick={() => setFormData((p) => ({ ...p, color_tag: col.value }))}
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "50%",
                                                    bgcolor: col.value,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: formData.color_tag === col.value ? "3px solid #0f172a" : "2px solid transparent",
                                                    transition: "transform 0.15s",
                                                    "&:hover": { transform: "scale(1.15)" },
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>

                                <TextField
                                    label="Notes & Student Preparation (Optional)"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    size="small"
                                    placeholder="e.g. Please bring your laptops with Python installed."
                                    value={formData.notes}
                                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                                        />
                                    }
                                    label={<Typography variant="body2" fontWeight={600}>Schedule is Active</Typography>}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "grey.200" }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                        <Button
                            variant="outlined"
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                                borderColor: "grey.400",
                                color: "#0f172a",
                                "&:hover": { borderColor: "#0f172a", bgcolor: "grey.100" },
                            }}
                        >
                            {saving && savingType === "SAVE_ONLY" ? "Saving..." : editingSchedule ? "Update Only" : "Add Only"}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Email />}
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            sx={{
                                bgcolor: "#2563eb",
                                "&:hover": { bgcolor: "#1d4ed8" },
                                fontWeight: 700,
                                borderRadius: 2,
                                textTransform: "none",
                                px: 2.5,
                            }}
                        >
                            {saving && savingType === "SAVE_EMAIL" ? "Sending..." : editingSchedule ? "Update & Send Email" : "Add & Send Email"}
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* STANDALONE SEND SCHEDULE REMINDER MODAL WITH LIVE PREVIEW & VERIFICATION */}
            <Dialog
                open={reminderOpen}
                onClose={() => setReminderOpen(false)}
                fullWidth
                maxWidth="md"
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
                        },
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <NotificationsActive sx={{ color: "#2563eb" }} />
                        <Typography variant="h6" fontWeight={800}>
                            Send Lecture Schedule Reminder
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReminderOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 2.5 }}>
                    <Stack spacing={2.5}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Select a target group, student, or class to inspect their assigned schedule(s) before sending email reminders.
                        </Alert>

                        {/* 1. Target Type */}
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={1} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                                1. Select Reminder Target
                            </Typography>
                            <ToggleButtonGroup
                                exclusive
                                value={reminderTargetType}
                                onChange={(e, val) => {
                                    if (val) {
                                        setReminderTargetType(val);
                                        setReminderSearchQuery("");
                                        if (val === "GROUP" && !reminderGroupId && groups.length > 0) {
                                            setReminderGroupId(groups[0].id);
                                        }
                                        if (val === "STUDENTS" && !reminderStudentId && students.length > 0) {
                                            setReminderStudentId(students[0].id);
                                        }
                                        if (val === "SCHEDULE" && !reminderScheduleId && schedules.length > 0) {
                                            setReminderScheduleId(schedules[0].id);
                                        }
                                        if (val === "COURSE" && !reminderCourseId && courses.length > 0) {
                                            setReminderCourseId(courses[0].id);
                                        }
                                    }
                                }}
                                fullWidth
                                size="small"
                                sx={{
                                    "& .MuiToggleButton-root": {
                                        fontWeight: 700,
                                        textTransform: "none",
                                        fontSize: "0.8rem",
                                        py: 0.8,
                                    },
                                    "& .Mui-selected": {
                                        bgcolor: "#2563eb !important",
                                        color: "#ffffff !important",
                                    },
                                }}
                            >
                                <ToggleButton value="GROUP">By Study Group</ToggleButton>
                                <ToggleButton value="STUDENTS">By Specific Student</ToggleButton>
                                <ToggleButton value="SCHEDULE">By Class / Schedule</ToggleButton>
                                <ToggleButton value="COURSE">By Course</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* 2. Target Specific Selection with Search Bar */}
                        {reminderTargetType === "GROUP" && (
                            <Stack spacing={1.2}>
                                <TextField
                                    size="small"
                                    placeholder="Search study group by name..."
                                    fullWidth
                                    value={reminderSearchQuery}
                                    onChange={(e) => setReminderSearchQuery(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                                <TextField
                                    select
                                    label="Choose Study Group *"
                                    size="small"
                                    fullWidth
                                    value={reminderGroupId}
                                    onChange={(e) => setReminderGroupId(e.target.value)}
                                >
                                    {filteredGroups.length === 0 ? (
                                        <MenuItem disabled value="">
                                            No study groups match "{reminderSearchQuery}"
                                        </MenuItem>
                                    ) : (
                                        filteredGroups.map((g) => (
                                            <MenuItem key={g.id} value={g.id}>
                                                {g.name} ({g.member_count ?? g.members_count ?? g.members_detail?.length ?? 0} members)
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Stack>
                        )}

                        {reminderTargetType === "STUDENTS" && (
                            <Stack spacing={1.2}>
                                <TextField
                                    size="small"
                                    placeholder="Search student by name, student ID, or email..."
                                    fullWidth
                                    value={reminderSearchQuery}
                                    onChange={(e) => setReminderSearchQuery(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                                <TextField
                                    select
                                    label="Choose Student *"
                                    size="small"
                                    fullWidth
                                    value={reminderStudentId}
                                    onChange={(e) => setReminderStudentId(e.target.value)}
                                >
                                    {filteredStudents.length === 0 ? (
                                        <MenuItem disabled value="">
                                            No students match "{reminderSearchQuery}"
                                        </MenuItem>
                                    ) : (
                                        filteredStudents.map((st) => (
                                            <MenuItem key={st.id} value={st.id}>
                                                {st.first_name} {st.last_name} ({st.username})
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Stack>
                        )}

                        {reminderTargetType === "SCHEDULE" && (
                            <Stack spacing={1.2}>
                                <TextField
                                    size="small"
                                    placeholder="Search class schedule by title, course, or day..."
                                    fullWidth
                                    value={reminderSearchQuery}
                                    onChange={(e) => setReminderSearchQuery(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                                <TextField
                                    select
                                    label="Choose Lecture Schedule / Class *"
                                    size="small"
                                    fullWidth
                                    value={reminderScheduleId}
                                    onChange={(e) => setReminderScheduleId(e.target.value)}
                                >
                                    {filteredSchedules.length === 0 ? (
                                        <MenuItem disabled value="">
                                            No lecture schedules match "{reminderSearchQuery}"
                                        </MenuItem>
                                    ) : (
                                        filteredSchedules.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.color_tag || "#2563eb" }} />
                                                    <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary">({(s.days_of_week || []).join(", ")})</Typography>
                                                </Box>
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Stack>
                        )}

                        {reminderTargetType === "COURSE" && (
                            <Stack spacing={1.2}>
                                <TextField
                                    size="small"
                                    placeholder="Search course by name or code..."
                                    fullWidth
                                    value={reminderSearchQuery}
                                    onChange={(e) => setReminderSearchQuery(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: "text.secondary" }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                                <TextField
                                    select
                                    label="Choose Course *"
                                    size="small"
                                    fullWidth
                                    value={reminderCourseId}
                                    onChange={(e) => setReminderCourseId(e.target.value)}
                                >
                                    {filteredCourses.length === 0 ? (
                                        <MenuItem disabled value="">
                                            No courses match "{reminderSearchQuery}"
                                        </MenuItem>
                                    ) : (
                                        filteredCourses.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {c.name}
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Stack>
                        )}

                        {/* 3. VERIFY MATCHING SCHEDULES (LIVE PREVIEW & SELECTION) */}
                        <Box sx={{ mt: 0.5 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Matching Lecture Schedule(s) ({reminderSelectedScheduleIds.length}/{matchingReminderSchedules.length} selected)
                                </Typography>
                                {matchingReminderSchedules.length > 1 && (
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small"
                                            onClick={() => setReminderSelectedScheduleIds(matchingReminderSchedules.map((s) => s.id))}
                                            sx={{ fontSize: "0.7rem", p: 0, textTransform: "none", minWidth: "auto" }}
                                        >
                                            Select All
                                        </Button>
                                        <Typography variant="caption" color="grey.400">|</Typography>
                                        <Button
                                            size="small"
                                            onClick={() => setReminderSelectedScheduleIds([])}
                                            sx={{ fontSize: "0.7rem", p: 0, textTransform: "none", minWidth: "auto" }}
                                        >
                                            Clear All
                                        </Button>
                                    </Stack>
                                )}
                            </Box>

                            {matchingReminderSchedules.length > 0 ? (
                                <Stack spacing={1.5} sx={{ maxHeight: 260, overflowY: "auto", pr: 0.5 }}>
                                    {matchingReminderSchedules.map((sched) => {
                                        const isChecked = reminderSelectedScheduleIds.includes(sched.id);
                                        const daysList = sched.days_of_week || [];
                                        const daysStr = daysList.map((d) => d.slice(0, 3)).join(", ");
                                        const cardColor = sched.color_tag || "#2563eb";

                                        return (
                                            <Paper
                                                key={sched.id}
                                                variant="outlined"
                                                onClick={() => {
                                                    setReminderSelectedScheduleIds((prev) =>
                                                        isChecked ? prev.filter((id) => id !== sched.id) : [...prev, sched.id]
                                                    );
                                                }}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    cursor: "pointer",
                                                    border: isChecked ? "2px solid #2563eb" : "1px solid",
                                                    borderColor: isChecked ? "#2563eb" : "grey.200",
                                                    borderLeft: `5px solid ${cardColor}`,
                                                    bgcolor: isChecked ? "#f0fdf4" : "#fafafa",
                                                    transition: "all 0.15s ease",
                                                    "&:hover": { borderColor: "#2563eb", bgcolor: "#f8fafc" },
                                                }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                                                    <Checkbox
                                                        checked={isChecked}
                                                        size="small"
                                                        sx={{ p: 0.2, mt: 0.2, color: "#2563eb", "&.Mui-checked": { color: "#16a34a" } }}
                                                    />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                                                                {sched.title}
                                                            </Typography>
                                                            <Chip
                                                                label={sched.mode || "PHYSICAL"}
                                                                size="small"
                                                                color={sched.mode === "ONLINE" ? "primary" : "success"}
                                                                variant="outlined"
                                                                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800 }}
                                                            />
                                                        </Box>

                                                        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap", fontSize: "0.75rem", color: "text.secondary" }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                                <AccessTime sx={{ fontSize: 13, color: "#2563eb" }} />
                                                                <Typography variant="caption" fontWeight={700} color="text.primary">
                                                                    {daysStr || "Scheduled Days"}: {formatTime12(sched.start_time)} – {formatTime12(sched.end_time)}
                                                                </Typography>
                                                            </Box>

                                                            {sched.course_name && (
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                                    <School sx={{ fontSize: 13 }} />
                                                                    <Typography variant="caption">{sched.course_name}</Typography>
                                                                </Box>
                                                            )}

                                                            {sched.instructor_name && (
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                                    <Person sx={{ fontSize: 13 }} />
                                                                    <Typography variant="caption">{sched.instructor_name}</Typography>
                                                                </Box>
                                                            )}

                                                            {sched.venue_or_link && (
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                                    <LocationOn sx={{ fontSize: 13 }} />
                                                                    <Typography variant="caption" sx={{ wordBreak: "break-all" }}>{sched.venue_or_link}</Typography>
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            ) : (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    <Typography variant="body2" fontWeight={700}>
                                        No lecture schedules found for this selection!
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        There are currently no timetable schedules assigned to this {reminderTargetType === "GROUP" ? "study group" : reminderTargetType === "STUDENTS" ? "student" : reminderTargetType === "COURSE" ? "course" : "selection"}. Please create or assign a schedule first.
                                    </Typography>
                                </Alert>
                            )}
                        </Box>

                        {/* Optional Custom Note */}
                        <TextField
                            label="Custom Notice / Announcement Note (Optional)"
                            multiline
                            rows={2.5}
                            size="small"
                            fullWidth
                            placeholder="e.g. Reminder: Tomorrow's lecture will begin at 10:30 AM in Room 4. Please bring your laptops and completed assignment."
                            value={reminderCustomNote}
                            onChange={(e) => setReminderCustomNote(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
                    <Button onClick={() => setReminderOpen(false)} sx={{ textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={handleSendReminder}
                        disabled={reminderSending || reminderSelectedScheduleIds.length === 0 || matchingReminderSchedules.length === 0}
                        sx={{
                            bgcolor: "#2563eb",
                            "&:hover": { bgcolor: "#1d4ed8" },
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: "none",
                            px: 3,
                        }}
                    >
                        {reminderSending
                            ? "Dispatching Reminders..."
                            : `Send Reminder Emails (${reminderSelectedScheduleIds.length} Schedule${reminderSelectedScheduleIds.length === 1 ? "" : "s"})`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Concurrent Schedule & Clashes Breakdown Modal */}
            <ConcurrentScheduleModal
                open={Boolean(conflictModalData)}
                onClose={() => setConflictModalData(null)}
                conflictData={conflictModalData}
                onEditSchedule={openEdit}
            />
        </Box>
    );
}
