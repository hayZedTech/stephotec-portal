"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Stack,
    Chip,
    CircularProgress,
    Button,
    Card,
    CardContent,
    Tabs,
    Tab,
    Divider,
} from "@mui/material";
import {
    AccessTime,
    CalendarMonth,
    VideoCameraFront,
    LocationOn,
    Person,
    School,
    OpenInNew,
    CheckCircle,
    Schedule,
    ViewWeek,
    ListAlt,
    Info,
} from "@mui/icons-material";
import api from "@/lib/axios";
import { errorToast } from "@/lib/toast";
import WeeklyTimetableGrid from "@/components/schedule/WeeklyTimetableGrid";
import { formatTime12 } from "@/utils/scheduleUtils";

export default function StudentSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [nextClass, setNextClass] = useState(null);
    const [todayClasses, setTodayClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("TIMETABLE"); // "TIMETABLE", "TODAY", "LIST"

    useEffect(() => {
        const loadScheduleData = async () => {
            try {
                setLoading(true);
                const [schedRes, nextRes, todayRes] = await Promise.all([
                    api.get("/learning/lecture-schedules/").catch(() => ({ data: [] })),
                    api.get("/learning/lecture-schedules/next-class/").catch(() => ({ data: { next_class: null } })),
                    api.get("/learning/lecture-schedules/today/").catch(() => ({ data: [] })),
                ]);

                setSchedules(Array.isArray(schedRes.data) ? schedRes.data : schedRes.data?.results || []);
                setNextClass(nextRes.data?.next_class || null);
                setTodayClasses(Array.isArray(todayRes.data) ? todayRes.data : todayRes.data?.results || []);
            } catch (err) {
                errorToast(err, "Failed to load your lecture timetable");
            } finally {
                setLoading(false);
            }
        };

        loadScheduleData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800}>
                    My Lecture Schedule & Timetable
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    View your weekly class schedule, meeting links, and classroom venues.
                </Typography>
            </Box>

            {/* NEXT CLASS HERO BANNER */}
            {nextClass ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3 },
                        mb: 4,
                        borderRadius: 3,
                        bgcolor: "#0f172a",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "rgba(255,255,255,0.1)",
                    }}
                >
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { md: "center" }, gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                                <Chip
                                    icon={<Schedule sx={{ fontSize: "1rem !important", color: "#4ade80 !important" }} />}
                                    label={nextClass.next_occurrence?.is_today ? "NEXT CLASS TODAY" : `NEXT CLASS (${nextClass.next_occurrence?.day || "UPCOMING"})`}
                                    size="small"
                                    sx={{
                                        bgcolor: "rgba(74, 222, 128, 0.15)",
                                        color: "#4ade80",
                                        fontWeight: 800,
                                        fontSize: "0.75rem",
                                    }}
                                />
                                {nextClass.duration_minutes && (
                                    <Chip
                                        label={`${nextClass.duration_minutes} mins`}
                                        size="small"
                                        sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, fontSize: "0.7rem" }}
                                    />
                                )}
                            </Stack>

                            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                                {nextClass.title}
                            </Typography>

                            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", color: "grey.300", fontSize: "0.85rem", mb: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <AccessTime fontSize="small" sx={{ color: "#38bdf8" }} />
                                    <Typography variant="body2" fontWeight={700} color="white">
                                        {formatTime12(nextClass.start_time)} – {formatTime12(nextClass.end_time)}
                                    </Typography>
                                </Box>

                                {nextClass.instructor_name && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Person fontSize="small" sx={{ color: "#a78bfa" }} />
                                        <Typography variant="body2" color="grey.300">
                                            {nextClass.instructor_name}
                                        </Typography>
                                    </Box>
                                )}

                                {nextClass.course_name && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <School fontSize="small" sx={{ color: "#fbbf24" }} />
                                        <Typography variant="body2" color="grey.300">
                                            {nextClass.course_name}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>

                            {nextClass.notes && (
                                <Typography variant="caption" sx={{ color: "grey.400", display: "block" }}>
                                    Note: {nextClass.notes}
                                </Typography>
                            )}
                        </Box>

                        {/* Join / Location Action */}
                        <Box sx={{ flexShrink: 0 }}>
                            {nextClass.mode === "ONLINE" && nextClass.venue_or_link ? (
                                <Button
                                    variant="contained"
                                    href={nextClass.venue_or_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<VideoCameraFront />}
                                    endIcon={<OpenInNew />}
                                    sx={{
                                        bgcolor: "#2563eb",
                                        "&:hover": { bgcolor: "#1d4ed8" },
                                        fontWeight: 800,
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 2,
                                    }}
                                >
                                    Join Online Class
                                </Button>
                            ) : nextClass.venue_or_link ? (
                                <Paper sx={{ px: 2, py: 1, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.15)" }}>
                                    <Typography variant="caption" sx={{ color: "grey.400", display: "block" }}>
                                        VENUE / ROOM
                                    </Typography>
                                    <Typography variant="body2" fontWeight={800} color="white">
                                        📍 {nextClass.venue_or_link}
                                    </Typography>
                                </Paper>
                            ) : null}
                        </Box>
                    </Box>
                </Paper>
            ) : null}

            {/* Navigation Tabs - Mobile Responsive & Swipeable */}
            <Paper sx={{ mb: 3, borderRadius: 3, overflow: "hidden" }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                        px: { xs: 0.5, sm: 2 },
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                        "& .MuiTab-root": {
                            minHeight: { xs: 44, sm: 48 },
                            py: { xs: 0.8, sm: 1 },
                            px: { xs: 1.5, sm: 2.5 },
                            fontWeight: 700,
                            fontSize: { xs: "0.8rem", sm: "0.88rem" },
                            whiteSpace: "nowrap",
                            textTransform: "none",
                        },
                    }}
                >
                    <Tab
                        value="TIMETABLE"
                        label="My Weekly Schedule"
                        icon={<ViewWeek fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="TODAY"
                        label={`Today's Classes (${todayClasses.length})`}
                        icon={<CalendarMonth fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="LIST"
                        label="All Classes Overview"
                        icon={<ListAlt fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            </Paper>

            {/* TAB 1: WEEKLY TIMETABLE GRID */}
            {activeTab === "TIMETABLE" && (
                <Box>
                    {schedules.length === 0 ? (
                        <Paper sx={{ p: 8, textAlign: "center", borderRadius: 3 }}>
                            <Schedule sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} color="text.secondary">
                                You have no scheduled lectures yet.
                            </Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                                Your tutor or administrator will assign lectures to your courses and student groups.
                            </Typography>
                        </Paper>
                    ) : (
                        <WeeklyTimetableGrid schedules={schedules} isAdmin={false} />
                    )}
                </Box>
            )}

            {/* TAB 2: TODAY'S CLASSES */}
            {activeTab === "TODAY" && (
                <Box>
                    {todayClasses.length === 0 ? (
                        <Paper sx={{ p: 8, textAlign: "center", borderRadius: 3 }}>
                            <CheckCircle sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} color="text.secondary">
                                No classes scheduled for today!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Enjoy your day or review upcoming materials in the Weekly Timetable.
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {todayClasses.map((sched) => (
                                <Paper
                                    key={sched.id}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        borderLeft: `6px solid ${sched.color_tag || "#2563eb"}`,
                                    }}
                                >
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                                                <Chip
                                                    icon={<AccessTime sx={{ fontSize: "0.85rem !important" }} />}
                                                    label={`${formatTime12(sched.start_time)} – ${formatTime12(sched.end_time)}`}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ fontWeight: 800 }}
                                                />
                                                <Chip
                                                    label={`${sched.duration_minutes || 90} mins`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                                <Chip
                                                    label={sched.mode}
                                                    size="small"
                                                    color={sched.mode === "ONLINE" ? "info" : "secondary"}
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </Stack>

                                            <Typography variant="h6" fontWeight={800}>
                                                {sched.title}
                                            </Typography>

                                            {sched.instructor_name && (
                                                <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>
                                                    Instructor: {sched.instructor_name}
                                                </Typography>
                                            )}

                                            {sched.notes && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    {sched.notes}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Join Button or Venue */}
                                        {sched.mode === "ONLINE" && sched.venue_or_link ? (
                                            <Button
                                                variant="contained"
                                                href={sched.venue_or_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                startIcon={<VideoCameraFront />}
                                                endIcon={<OpenInNew />}
                                                sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, fontWeight: 700, borderRadius: 2 }}
                                            >
                                                Join Lecture
                                            </Button>
                                        ) : sched.venue_or_link ? (
                                            <Paper sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Classroom Venue</Typography>
                                                <Typography variant="body2" fontWeight={800}>📍 {sched.venue_or_link}</Typography>
                                            </Paper>
                                        ) : null}
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* TAB 3: ALL CLASSES LIST OVERVIEW */}
            {activeTab === "LIST" && (
                <Stack spacing={2}>
                    {schedules.map((sched) => (
                        <Paper key={sched.id} sx={{ p: 2.5, borderRadius: 3, borderLeft: `5px solid ${sched.color_tag || "#2563eb"}` }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mb: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={800}>{sched.title}</Typography>
                                        <Chip label={`${sched.duration_minutes || 90} mins`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                    </Box>

                                    {sched.day_times && sched.day_times.length > 0 ? (
                                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                            {sched.day_times.map((dt) => (
                                                <Box key={dt.day} sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "#f8fafc", px: 1, py: 0.5, borderRadius: 1.5, border: "1px solid", borderColor: "grey.200" }}>
                                                    <Chip label={dt.day.slice(0, 3)} size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "#0f172a", color: "white" }} />
                                                    <Typography variant="caption" fontWeight={700}>
                                                        {formatTime12(dt.start_time)} – {formatTime12(dt.end_time)}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                                            ⏰ {formatTime12(sched.start_time)} – {formatTime12(sched.end_time)} · Every {(sched.days_of_week || []).map((d) => d.slice(0, 3)).join(", ")}
                                        </Typography>
                                    )}

                                    {sched.course_name && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Course: {sched.course_name}
                                        </Typography>
                                    )}
                                    {sched.instructor_name && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Instructor: {sched.instructor_name}
                                        </Typography>
                                    )}
                                </Box>

                                {sched.mode === "ONLINE" && sched.venue_or_link && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        href={sched.venue_or_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        startIcon={<VideoCameraFront />}
                                        endIcon={<OpenInNew />}
                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                    >
                                        Meeting Link
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
