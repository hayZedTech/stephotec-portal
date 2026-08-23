"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Chip,
    Stack,
    Button,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    AccessTime,
    VideoCameraFront,
    LocationOn,
    Person,
    Edit,
    Delete,
    School,
    Workspaces,
    OpenInNew,
    CalendarToday,
    ViewWeek,
    PlayCircleFilled,
    Star,
    CheckCircle,
    WarningAmber,
} from "@mui/icons-material";
import { DAYS_OF_WEEK, formatTime12, getScheduleOverlaps } from "@/utils/scheduleUtils";
import ConcurrentScheduleModal from "@/components/schedule/ConcurrentScheduleModal";

export default function WeeklyTimetableGrid({ schedules = [], isAdmin = false, onEdit, onDelete }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    // Modal state for viewing concurrent schedule clashes & enrolled students
    const [conflictModalData, setConflictModalData] = useState(null);

    // Real-time ticking clock so timetable transitions the exact moment lecture ends
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 10000); // Check every 10 seconds for real-time reactivity
        return () => clearInterval(timer);
    }, []);

    const DAYS_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDayIndex = now.getDay();
    const currentDayName = DAYS_ORDER[currentDayIndex];

    // Compute overlapping schedules & time concurrency map for admin
    const { slotOverlapMap } = useMemo(() => getScheduleOverlaps(schedules), [schedules]);

    // Group schedules by day with per-day timing overrides
    const getSchedulesForDay = (dayKey) => {
        return schedules
            .filter((s) => {
                const inDays = (s.days_of_week || []).map((d) => String(d).toUpperCase()).includes(dayKey);
                const inDayTimes = (s.day_times || []).some((dt) => String(dt.day).toUpperCase() === dayKey);
                return inDays || inDayTimes;
            })
            .map((s) => {
                const dayTiming = (s.day_times || []).find((dt) => String(dt.day).toUpperCase() === dayKey);
                return {
                    ...s,
                    effective_start_time: dayTiming?.start_time || s.start_time,
                    effective_end_time: dayTiming?.end_time || s.end_time,
                    effective_duration: dayTiming?.duration_minutes || s.duration_minutes,
                };
            })
            .sort((a, b) => (a.effective_start_time || "").localeCompare(b.effective_start_time || ""));
    };

    // Calculate real-time active / next schedule across the week
    const activeScheduleInfo = useMemo(() => {
        const occurrences = [];
        const [cH, cM, cS] = [now.getHours(), now.getMinutes(), now.getSeconds()];
        const curSecs = cH * 3600 + cM * 60 + cS;

        schedules.forEach((s) => {
            const dayTimes = (s.day_times && Array.isArray(s.day_times) && s.day_times.length > 0)
                ? s.day_times
                : (s.days_of_week || []).map((d) => ({
                    day: d,
                    start_time: s.start_time || "10:30:00",
                    end_time: s.end_time || "12:00:00",
                    duration_minutes: s.duration_minutes || 90,
                }));

            dayTimes.forEach((dt) => {
                const dayKey = String(dt.day).toUpperCase();
                const dayIdx = DAYS_ORDER.indexOf(dayKey);
                if (dayIdx === -1) return;

                const st = String(dt.start_time || s.start_time || "10:30:00").slice(0, 8);
                const et = String(dt.end_time || s.end_time || "12:00:00").slice(0, 8);

                const [stH, stM] = st.split(":").map(Number);
                const [etH, etM] = et.split(":").map(Number);
                const startSecs = (stH || 0) * 3600 + (stM || 0) * 60;
                const endSecs = (etH || 0) * 3600 + (etM || 0) * 60;

                const diffDays = (dayIdx - currentDayIndex + 7) % 7;
                let status = "UPCOMING";
                let secondsUntilNext = 0;

                if (diffDays === 0) {
                    if (curSecs >= startSecs && curSecs < endSecs) {
                        status = "IN_PROGRESS";
                        secondsUntilNext = 0; // Live class takes highest priority
                    } else if (curSecs < startSecs) {
                        status = "UPCOMING_TODAY";
                        secondsUntilNext = startSecs - curSecs;
                    } else {
                        // Class has passed for today -> shifts to next week
                        status = "PASSED_TODAY";
                        secondsUntilNext = 7 * 86400 + (startSecs - curSecs);
                    }
                } else {
                    status = "UPCOMING_FUTURE";
                    secondsUntilNext = diffDays * 86400 + (startSecs - curSecs);
                }

                occurrences.push({
                    scheduleId: s.id,
                    dayKey,
                    start_time: st,
                    end_time: et,
                    duration_minutes: dt.duration_minutes || s.duration_minutes || 90,
                    status,
                    secondsUntilNext,
                    schedule: s,
                });
            });
        });

        if (occurrences.length === 0) {
            return {
                activeDayKey: currentDayName,
                activeScheduleId: null,
                activeStatus: null,
                slotStatusMap: {},
            };
        }

        const slotStatusMap = {};
        occurrences.forEach((occ) => {
            slotStatusMap[`${occ.dayKey}-${occ.scheduleId}`] = occ.status;
        });

        // Sort by priority (0 seconds = LIVE, then earliest upcoming)
        occurrences.sort((a, b) => a.secondsUntilNext - b.secondsUntilNext);
        const top = occurrences[0];

        return {
            activeDayKey: top.dayKey,
            activeScheduleId: top.scheduleId,
            activeStatus: top.status,
            slotStatusMap,
            topOccurrence: top,
        };
    }, [schedules, now, currentDayIndex, currentDayName]);

    // Calculate active days that have at least 1 class
    const activeDays = useMemo(() => {
        return DAYS_OF_WEEK.filter((d) => getSchedulesForDay(d.key).length > 0);
    }, [schedules]);

    // On student portal (isAdmin === false), show ONLY active days with classes! On admin, show all 7 days.
    const relevantDays = useMemo(() => {
        if (isAdmin) return DAYS_OF_WEEK;
        return activeDays.length > 0 ? activeDays : [];
    }, [isAdmin, activeDays]);

    // Default tab
    const [selectedDayTab, setSelectedDayTab] = useState("ALL");

    // If student has no active days at all
    if (!isAdmin && activeDays.length === 0) {
        return (
            <Paper sx={{ p: { xs: 4, md: 8 }, textAlign: "center", borderRadius: 3, bgcolor: "#f8fafc", border: "1px dashed", borderColor: "grey.300" }}>
                <CalendarToday sx={{ fontSize: { xs: 36, md: 48 }, color: "text.disabled", mb: 1.5 }} />
                <Typography variant="h6" fontWeight={800} color="text.secondary" sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
                    No scheduled lectures yet
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                    Your upcoming classes will appear here once assigned by your tutor or administrator.
                </Typography>
            </Paper>
        );
    }

    const daysToRender =
        selectedDayTab === "ALL"
            ? relevantDays
            : relevantDays.filter((d) => d.key === selectedDayTab);

    return (
        <Box>
            {/* Day Selector Navigation Bar - Touch-Friendly Swipe Bar on Mobile */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 1, sm: 1.25 },
                    mb: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "grey.200",
                    bgcolor: "white",
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                <Stack direction="row" spacing={0.8} sx={{ minWidth: "max-content", alignItems: "center" }}>
                    <Button
                        size="small"
                        variant={selectedDayTab === "ALL" ? "contained" : "outlined"}
                        onClick={() => setSelectedDayTab("ALL")}
                        startIcon={<ViewWeek sx={{ fontSize: "1.1rem" }} />}
                        sx={{
                            flexShrink: 0,
                            borderRadius: 2,
                            fontWeight: 800,
                            fontSize: { xs: "0.75rem", sm: "0.82rem" },
                            py: { xs: 0.6, sm: 0.8 },
                            px: { xs: 1.2, sm: 1.8 },
                            textTransform: "none",
                            bgcolor: selectedDayTab === "ALL" ? "#0f172a" : "transparent",
                            borderColor: selectedDayTab === "ALL" ? "#0f172a" : "grey.300",
                            color: selectedDayTab === "ALL" ? "white" : "text.primary",
                            "&:hover": { bgcolor: selectedDayTab === "ALL" ? "#1e293b" : "grey.100" },
                        }}
                    >
                        {isAdmin ? "Full Week" : `All Classes (${relevantDays.length}d)`}
                    </Button>

                    {relevantDays.map((d) => {
                        const count = getSchedulesForDay(d.key).length;
                        const isToday = d.key === currentDayName;
                        const isActiveDay = d.key === activeScheduleInfo.activeDayKey;
                        const isSelected = selectedDayTab === d.key;

                        return (
                            <Button
                                key={d.key}
                                size="small"
                                variant={isSelected ? "contained" : "outlined"}
                                onClick={() => setSelectedDayTab(d.key)}
                                sx={{
                                    flexShrink: 0,
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    fontSize: { xs: "0.75rem", sm: "0.82rem" },
                                    py: { xs: 0.6, sm: 0.8 },
                                    px: { xs: 1, sm: 1.5 },
                                    textTransform: "none",
                                    bgcolor: isSelected ? "#0f172a" : isActiveDay ? "#ecfdf5" : isToday ? "#f8fafc" : "transparent",
                                    borderColor: isSelected ? "#0f172a" : isActiveDay ? "#86efac" : isToday ? "grey.300" : "grey.200",
                                    color: isSelected ? "white" : isActiveDay ? "#15803d" : "text.secondary",
                                    "&:hover": { bgcolor: isSelected ? "#1e293b" : isActiveDay ? "#d1fae5" : "grey.100" },
                                    gap: 0.6,
                                }}
                            >
                                <span>{isMobile ? d.short : d.label}</span>
                                {isActiveDay && !isSelected && (
                                    <Chip
                                        label={activeScheduleInfo.activeStatus === "IN_PROGRESS" ? "LIVE NOW" : isToday ? "NEXT UP" : "NEXT SCHEDULE"}
                                        size="small"
                                        sx={{ height: 16, fontSize: "0.55rem", fontWeight: 900, bgcolor: "#15803d", color: "white", px: 0.2 }}
                                    />
                                )}
                                {isToday && !isActiveDay && !isSelected && (
                                    <Chip
                                        label="TODAY"
                                        size="small"
                                        sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: "grey.200", color: "grey.700", px: 0.2 }}
                                    />
                                )}
                                {count > 0 && (
                                    <Chip
                                        label={count}
                                        size="small"
                                        sx={{
                                            height: 18,
                                            minWidth: 18,
                                            fontSize: "0.65rem",
                                            fontWeight: 800,
                                            bgcolor: isSelected ? "rgba(255,255,255,0.2)" : isActiveDay ? "#15803d" : "#e2e8f0",
                                            color: isSelected ? "white" : isActiveDay ? "white" : "#334155",
                                        }}
                                    />
                                )}
                            </Button>
                        );
                    })}
                </Stack>
            </Paper>

            {/* TIMETABLE GRID / CARDS */}
            {selectedDayTab === "ALL" ? (
                /* Multi-Day Layout: Compact responsive grid on mobile, wide columns on desktop */
                relevantDays.length <= 4 ? (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: relevantDays.length === 1 ? "1fr" : "repeat(2, 1fr)",
                                md: `repeat(${relevantDays.length}, 1fr)`,
                            },
                            gap: { xs: 1.5, md: 2.5 },
                        }}
                    >
                        {relevantDays.map((day) => {
                            const daySchedules = getSchedulesForDay(day.key);
                            const isToday = day.key === currentDayName;
                            const isActiveDay = day.key === activeScheduleInfo.activeDayKey;

                            return (
                                <DayColumn
                                    key={day.key}
                                    day={day}
                                    daySchedules={daySchedules}
                                    isToday={isToday}
                                    isActiveDay={isActiveDay}
                                    activeStatus={activeScheduleInfo.activeStatus}
                                    activeScheduleId={activeScheduleInfo.activeScheduleId}
                                    slotStatusMap={activeScheduleInfo.slotStatusMap}
                                    slotOverlapMap={slotOverlapMap}
                                    onViewConflicts={setConflictModalData}
                                    isAdmin={isAdmin}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            );
                        })}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            overflowX: "auto",
                            pb: 1.5,
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2.5 }, minWidth: { xs: relevantDays.length * 220, md: relevantDays.length * 260 } }}>
                            {relevantDays.map((day) => {
                                const daySchedules = getSchedulesForDay(day.key);
                                const isToday = day.key === currentDayName;
                                const isActiveDay = day.key === activeScheduleInfo.activeDayKey;

                                return (
                                    <Box key={day.key} sx={{ flex: "1 1 220px", minWidth: { xs: 220, md: 250 } }}>
                                        <DayColumn
                                            day={day}
                                            daySchedules={daySchedules}
                                            isToday={isToday}
                                            isActiveDay={isActiveDay}
                                            activeStatus={activeScheduleInfo.activeStatus}
                                            activeScheduleId={activeScheduleInfo.activeScheduleId}
                                            slotStatusMap={activeScheduleInfo.slotStatusMap}
                                            slotOverlapMap={slotOverlapMap}
                                            onViewConflicts={setConflictModalData}
                                            isAdmin={isAdmin}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )
            ) : (
                /* Focused Single Day View */
                <Box>
                    {daysToRender.map((day) => {
                        const daySchedules = getSchedulesForDay(day.key);
                        const isToday = day.key === currentDayName;
                        const isActiveDay = day.key === activeScheduleInfo.activeDayKey;

                        return (
                            <Box key={day.key}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1rem", sm: "1.15rem" } }}>
                                        {day.label}
                                    </Typography>
                                    {isActiveDay && (
                                        <Chip
                                            label={activeScheduleInfo.activeStatus === "IN_PROGRESS" ? "LIVE CLASS NOW" : isToday ? "Next Class Today" : "Next Schedule"}
                                            size="small"
                                            color="success"
                                            sx={{ fontWeight: 800, height: 20, fontSize: "0.65rem" }}
                                        />
                                    )}
                                    {isToday && !isActiveDay && (
                                        <Chip label="Today (All classes completed)" size="small" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
                                    )}
                                    <Chip label={`${daySchedules.length} class${daySchedules.length === 1 ? "" : "es"}`} size="small" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
                                </Box>

                                {daySchedules.length === 0 ? (
                                    <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3, bgcolor: "#f8fafc", border: "1px dashed", borderColor: "grey.300" }}>
                                        <CalendarToday sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" fontWeight={700}>
                                            No classes scheduled for {day.label}
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                                            gap: { xs: 1.25, sm: 2 },
                                        }}
                                    >
                                        {daySchedules.map((sched) => {
                                            const slotKey = `${day.key}-${sched.id}`;
                                            const cardStatus = activeScheduleInfo.slotStatusMap?.[slotKey];
                                            const isCardActive = isActiveDay && sched.id === activeScheduleInfo.activeScheduleId;

                                            return (
                                                <ScheduleCard
                                                    key={slotKey}
                                                    sched={sched}
                                                    dayKey={day.key}
                                                    isCardActive={isCardActive}
                                                    cardStatus={cardStatus}
                                                    slotOverlapMap={slotOverlapMap}
                                                    onViewConflicts={setConflictModalData}
                                                    isAdmin={isAdmin}
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* Concurrent Schedule / Conflicts Modal */}
            {isAdmin && (
                <ConcurrentScheduleModal
                    open={Boolean(conflictModalData)}
                    onClose={() => setConflictModalData(null)}
                    conflictData={conflictModalData}
                    onEditSchedule={onEdit}
                />
            )}
        </Box>
    );
}

/**
 * Single Day Column for Grid View with real-time active schedule highlighting
 */
function DayColumn({
    day,
    daySchedules,
    isToday,
    isActiveDay,
    activeStatus,
    activeScheduleId,
    slotStatusMap = {},
    slotOverlapMap = {},
    onViewConflicts,
    isAdmin,
    onEdit,
    onDelete,
}) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 2.5,
                bgcolor: isActiveDay ? "#f0fdf4" : "#f8fafc",
                border: "1px solid",
                borderColor: isActiveDay ? "#86efac" : "grey.200",
                boxShadow: isActiveDay ? "0 4px 20px rgba(22, 128, 61, 0.10)" : "none",
                overflow: "hidden",
                minHeight: { xs: "auto", md: 440 },
                transition: "all 0.3s ease",
            }}
        >
            {/* Day Column Header */}
            <Box
                sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1, sm: 1.25 },
                    bgcolor: isActiveDay ? "#15803d" : "#0f172a",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "bgcolor 0.3s ease",
                }}
            >
                <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: 0.3, fontSize: { xs: "0.82rem", sm: "0.88rem" } }}>
                    {day.label}
                </Typography>
                {isActiveDay ? (
                    <Chip
                        label={activeStatus === "IN_PROGRESS" ? "LIVE NOW" : isToday ? "NEXT UP" : "NEXT SCHEDULE"}
                        size="small"
                        sx={{
                            height: 18,
                            fontSize: "0.58rem",
                            fontWeight: 900,
                            bgcolor: "white",
                            color: "#15803d",
                        }}
                    />
                ) : isToday ? (
                    <Chip
                        label="TODAY"
                        size="small"
                        sx={{
                            height: 18,
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            bgcolor: "rgba(255,255,255,0.15)",
                            color: "grey.300",
                        }}
                    />
                ) : (
                    <Typography variant="caption" sx={{ color: "grey.400", fontWeight: 700, fontSize: "0.7rem" }}>
                        {daySchedules.length} {daySchedules.length === 1 ? "class" : "classes"}
                    </Typography>
                )}
            </Box>

            {/* Class Cards for this Day */}
            <Box sx={{ p: { xs: 1, sm: 1.25 }, flex: 1, display: "flex", flexDirection: "column", gap: { xs: 1, sm: 1.5 } }}>
                {daySchedules.length === 0 ? (
                    <Box sx={{ py: { xs: 3, md: 5 }, textAlign: "center" }}>
                        <CalendarToday sx={{ fontSize: 24, color: "text.disabled", opacity: 0.4, mb: 0.5 }} />
                        <Typography variant="caption" color="text.disabled" display="block">
                            No classes
                        </Typography>
                    </Box>
                ) : (
                    daySchedules.map((sched) => {
                        const slotKey = `${day.key}-${sched.id}`;
                        const cardStatus = slotStatusMap?.[slotKey];
                        const isCardActive = isActiveDay && sched.id === activeScheduleId;

                        return (
                            <ScheduleCard
                                key={slotKey}
                                sched={sched}
                                dayKey={day.key}
                                isCardActive={isCardActive}
                                cardStatus={cardStatus}
                                slotOverlapMap={slotOverlapMap}
                                onViewConflicts={onViewConflicts}
                                isAdmin={isAdmin}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        );
                    })
                )}
            </Box>
        </Box>
    );
}

/**
 * Reusable Class Card with dynamic Live/Next/Passed status indicator
 */
function ScheduleCard({
    sched,
    dayKey,
    isCardActive = false,
    cardStatus,
    slotOverlapMap = {},
    onViewConflicts,
    isAdmin,
    onEdit,
    onDelete,
}) {
    const cardColor = sched.color_tag || "#2563eb";
    const isLive = cardStatus === "IN_PROGRESS";
    const isPassed = cardStatus === "PASSED_TODAY";
    const overlapInfo = slotOverlapMap?.[`${dayKey}-${sched.id}`];

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 2,
                border: isLive
                    ? "2px solid #22c55e"
                    : isCardActive
                    ? "2px solid #16a34a"
                    : "1px solid",
                borderColor: isLive ? "#22c55e" : isCardActive ? "#16a34a" : "grey.200",
                borderLeft: isLive
                    ? "6px solid #22c55e"
                    : isCardActive
                    ? "6px solid #16a34a"
                    : `4px solid ${cardColor}`,
                bgcolor: isLive ? "#f0fdf4" : isCardActive ? "#f0fdf4" : isPassed ? "#fcfcfd" : "white",
                opacity: isPassed ? 0.72 : 1,
                transition: "all 0.2s ease",
                "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    transform: "translateY(-1px)",
                    opacity: 1,
                },
            }}
        >
            <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, "&:last-child": { pb: { xs: 1.25, sm: 1.5 } } }}>
                {/* Live / Next Class / Ended Badge */}
                {isLive && (
                    <Chip
                        icon={<PlayCircleFilled sx={{ fontSize: "0.85rem !important", color: "white !important" }} />}
                        label="CLASS IN PROGRESS NOW"
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: "0.62rem",
                            fontWeight: 900,
                            bgcolor: "#16a34a",
                            color: "white",
                            mb: 0.8,
                            width: "100%",
                            justifyContent: "center",
                        }}
                    />
                )}
                {isCardActive && !isLive && (
                    <Chip
                        icon={<Star sx={{ fontSize: "0.85rem !important", color: "white !important" }} />}
                        label="NEXT UPCOMING CLASS"
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: "0.62rem",
                            fontWeight: 900,
                            bgcolor: "#15803d",
                            color: "white",
                            mb: 0.8,
                            width: "100%",
                            justifyContent: "center",
                        }}
                    />
                )}
                {isPassed && (
                    <Chip
                        icon={<CheckCircle sx={{ fontSize: "0.8rem !important", color: "text.disabled !important" }} />}
                        label="Ended for Today"
                        size="small"
                        variant="outlined"
                        sx={{
                            height: 18,
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            borderColor: "grey.300",
                            color: "text.disabled",
                            mb: 0.8,
                        }}
                    />
                )}

                {/* Overlap / Concurrent Time Slot Red Badge for Admin */}
                {isAdmin && overlapInfo?.hasOverlap && (
                    <Tooltip
                        arrow
                        title={
                            <Box sx={{ p: 0.6, maxWidth: 280 }}>
                                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#fecaca", fontSize: "0.82rem" }}>
                                    ⚠️ {overlapInfo.count} Classes Assigned at this Same Time (Click to inspect)
                                </Typography>
                                <Typography variant="caption" sx={{ color: "grey.300", display: "block", mt: 0.3, mb: 0.6 }}>
                                    {dayKey}: {overlapInfo.timeLabel}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "grey.200", fontWeight: 700, display: "block", mb: 0.3 }}>
                                    Other classes at this time:
                                </Typography>
                                {overlapInfo.overlappingSchedules.map((other, idx) => (
                                    <Box key={idx} sx={{ fontSize: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.15)", pt: 0.5, mt: 0.5 }}>
                                        • <strong>{other.title}</strong>
                                        <div style={{ color: "#cbd5e1", fontSize: "0.7rem" }}>Target: {other.targetLabel || "Entire Course"}</div>
                                    </Box>
                                ))}
                                <Typography variant="caption" sx={{ color: "#86efac", display: "block", mt: 0.8, fontStyle: "italic" }}>
                                    ✓ Click to view full details & enrolled students
                                </Typography>
                            </Box>
                        }
                    >
                        <Chip
                            icon={<WarningAmber sx={{ fontSize: "0.85rem !important", color: "white !important" }} />}
                            label={`${overlapInfo.count} at same time (Click)`}
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onViewConflicts) onViewConflicts(overlapInfo);
                            }}
                            sx={{
                                height: 20,
                                fontSize: "0.62rem",
                                fontWeight: 900,
                                bgcolor: "#dc2626",
                                color: "white",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(220, 38, 38, 0.35)",
                                "&:hover": { bgcolor: "#b91c1c", transform: "scale(1.02)" },
                                mb: 0.8,
                                width: "100%",
                                justifyContent: "center",
                            }}
                        />
                    </Tooltip>
                )}

                {/* Time & Duration Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.8, mb: 0.8 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "text.primary" }}>
                        <AccessTime sx={{ fontSize: 14, color: isLive ? "#16a34a" : isCardActive ? "#15803d" : cardColor, flexShrink: 0 }} />
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, lineHeight: 1.2 }}>
                            {formatTime12(sched.effective_start_time)} – {formatTime12(sched.effective_end_time)}
                        </Typography>
                    </Box>
                    {sched.effective_duration && (
                        <Chip
                            label={`${sched.effective_duration}m`}
                            size="small"
                            sx={{ height: 18, fontSize: "0.62rem", fontWeight: 800, bgcolor: isLive || isCardActive ? "#dcfce7" : "#f1f5f9", flexShrink: 0 }}
                        />
                    )}
                </Box>

                {/* Class Title */}
                <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{
                        fontSize: { xs: "0.85rem", sm: "0.9rem" },
                        lineHeight: 1.3,
                        mb: 0.8,
                        color: "#0f172a",
                        wordBreak: "break-word",
                    }}
                >
                    {sched.title}
                </Typography>

                {/* Details Stack */}
                <Stack spacing={0.5} sx={{ mb: 1 }}>
                    {sched.course_name && (
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                            <School sx={{ fontSize: 13, color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ wordBreak: "break-word", fontSize: "0.72rem" }}>
                                {sched.course_name}
                            </Typography>
                        </Box>
                    )}

                    {/* Target Groups */}
                    {sched.assigned_groups_details && sched.assigned_groups_details.length > 0 && (
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                            <Workspaces sx={{ fontSize: 13, color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
                                {sched.assigned_groups_details.map((g) => (
                                    <Chip
                                        key={g.id}
                                        label={g.name}
                                        size="small"
                                        sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700, bgcolor: "#f8fafc", border: "1px solid", borderColor: "grey.200" }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Target Direct Students (Show Full Student Names) */}
                    {sched.assigned_students_details && sched.assigned_students_details.length > 0 && (
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                            <Person sx={{ fontSize: 13, color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
                                {sched.assigned_students_details.map((st) => (
                                    <Chip
                                        key={st.id}
                                        label={st.full_name || `${st.first_name || ""} ${st.last_name || ""}`.trim() || st.username || st.email}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: "0.6rem",
                                            fontWeight: 700,
                                            bgcolor: "#eff6ff",
                                            color: "#1d4ed8",
                                            border: "1px solid #bfdbfe",
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {sched.instructor_name && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                            <Person sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.72rem" }}>
                                {sched.instructor_name}
                            </Typography>
                        </Box>
                    )}
                </Stack>

                {/* Mode & Venue / Link */}
                <Box
                    sx={{
                        pt: 0.8,
                        borderTop: "1px dashed",
                        borderColor: "grey.200",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 0.8,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        {sched.mode === "PHYSICAL" ? (
                            <Chip
                                icon={<LocationOn sx={{ fontSize: "0.75rem !important" }} />}
                                label="Physical"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800 }}
                            />
                        ) : sched.mode === "ONLINE" ? (
                            <Chip
                                icon={<VideoCameraFront sx={{ fontSize: "0.75rem !important" }} />}
                                label="Online"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800 }}
                            />
                        ) : (
                            <Chip
                                label="Hybrid"
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800 }}
                            />
                        )}
                    </Box>

                    {/* Action or Venue */}
                    {sched.mode === "ONLINE" && sched.venue_or_link ? (
                        <Button
                            size="small"
                            variant="contained"
                            href={sched.venue_or_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNew sx={{ fontSize: "0.7rem !important" }} />}
                            sx={{
                                height: 22,
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                bgcolor: isLive ? "#16a34a" : "#0f172a",
                                "&:hover": { bgcolor: isLive ? "#15803d" : "#1e293b" },
                                px: 1,
                                textTransform: "none",
                            }}
                        >
                            {isLive ? "Join Now" : "Join"}
                        </Button>
                    ) : sched.venue_or_link ? (
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ wordBreak: "break-word", fontSize: "0.7rem" }}>
                            📍 {sched.venue_or_link}
                        </Typography>
                    ) : null}
                </Box>

                {/* Admin Actions */}
                {isAdmin && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, mt: 0.8, pt: 0.6, borderTop: "1px solid", borderColor: "grey.100" }}>
                        <Tooltip title="Edit Class">
                            <IconButton size="small" onClick={() => onEdit?.(sched)} sx={{ p: 0.5 }}>
                                <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Class">
                            <IconButton size="small" color="error" onClick={() => onDelete?.(sched)} sx={{ p: 0.5 }}>
                                <Delete sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
