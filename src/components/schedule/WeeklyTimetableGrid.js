"use client";

import { useState, useMemo } from "react";
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
} from "@mui/icons-material";
import { DAYS_OF_WEEK, formatTime12 } from "@/utils/scheduleUtils";

export default function WeeklyTimetableGrid({ schedules = [], isAdmin = false, onEdit, onDelete }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const todayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][todayIndex];

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
                        const isToday = d.key === todayName;
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
                                    bgcolor: isSelected ? "#0f172a" : isToday ? "#ecfdf5" : "transparent",
                                    borderColor: isSelected ? "#0f172a" : isToday ? "#86efac" : "grey.300",
                                    color: isSelected ? "white" : isToday ? "#15803d" : "text.secondary",
                                    "&:hover": { bgcolor: isSelected ? "#1e293b" : isToday ? "#d1fae5" : "grey.100" },
                                    gap: 0.6,
                                }}
                            >
                                <span>{isMobile ? d.short : d.label}</span>
                                {isToday && !isSelected && (
                                    <Chip
                                        label="TODAY"
                                        size="small"
                                        sx={{ height: 16, fontSize: "0.58rem", fontWeight: 900, bgcolor: "#15803d", color: "white", px: 0.2 }}
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
                                            bgcolor: isSelected ? "rgba(255,255,255,0.2)" : isToday ? "#15803d" : "#e2e8f0",
                                            color: isSelected ? "white" : isToday ? "white" : "#334155",
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
                            const isToday = day.key === todayName;

                            return (
                                <DayColumn
                                    key={day.key}
                                    day={day}
                                    daySchedules={daySchedules}
                                    isToday={isToday}
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
                                const isToday = day.key === todayName;

                                return (
                                    <Box key={day.key} sx={{ flex: "1 1 220px", minWidth: { xs: 220, md: 250 } }}>
                                        <DayColumn
                                            day={day}
                                            daySchedules={daySchedules}
                                            isToday={isToday}
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
                        const isToday = day.key === todayName;

                        return (
                            <Box key={day.key}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1rem", sm: "1.15rem" } }}>
                                        {day.label}
                                    </Typography>
                                    {isToday && (
                                        <Chip label="Today" size="small" color="success" sx={{ fontWeight: 800, height: 20, fontSize: "0.65rem" }} />
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
                                        {daySchedules.map((sched) => (
                                            <ScheduleCard
                                                key={`${day.key}-${sched.id}`}
                                                sched={sched}
                                                isAdmin={isAdmin}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

/**
 * Single Day Column for Grid View with tight compact heights on mobile
 */
function DayColumn({ day, daySchedules, isToday, isAdmin, onEdit, onDelete }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 2.5,
                bgcolor: isToday ? "#f0fdf4" : "#f8fafc",
                border: "1px solid",
                borderColor: isToday ? "#86efac" : "grey.200",
                overflow: "hidden",
                minHeight: { xs: "auto", md: 440 }, // Tight auto height on mobile, comfortable on desktop
            }}
        >
            {/* Day Column Header */}
            <Box
                sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1, sm: 1.25 },
                    bgcolor: isToday ? "#15803d" : "#0f172a",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: 0.3, fontSize: { xs: "0.82rem", sm: "0.88rem" } }}>
                    {day.label}
                </Typography>
                {isToday ? (
                    <Chip
                        label="TODAY"
                        size="small"
                        sx={{
                            height: 18,
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            bgcolor: "white",
                            color: "#15803d",
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
                    daySchedules.map((sched) => (
                        <ScheduleCard
                            key={`${day.key}-${sched.id}`}
                            sched={sched}
                            isAdmin={isAdmin}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </Box>
        </Box>
    );
}

/**
 * Reusable Class Card with compact padding & zero text cutoffs
 */
function ScheduleCard({ sched, isAdmin, onEdit, onDelete }) {
    const cardColor = sched.color_tag || "#2563eb";

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.200",
                borderLeft: `4px solid ${cardColor}`,
                bgcolor: "white",
                transition: "transform 0.15s, box-shadow 0.15s",
                "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    transform: "translateY(-1px)",
                },
            }}
        >
            <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, "&:last-child": { pb: { xs: 1.25, sm: 1.5 } } }}>
                {/* Time & Duration Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.8, mb: 0.8 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "text.primary" }}>
                        <AccessTime sx={{ fontSize: 14, color: cardColor, flexShrink: 0 }} />
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, lineHeight: 1.2 }}>
                            {formatTime12(sched.effective_start_time)} – {formatTime12(sched.effective_end_time)}
                        </Typography>
                    </Box>
                    {sched.effective_duration && (
                        <Chip
                            label={`${sched.effective_duration}m`}
                            size="small"
                            sx={{ height: 18, fontSize: "0.62rem", fontWeight: 800, bgcolor: "#f1f5f9", flexShrink: 0 }}
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
                                bgcolor: "#0f172a",
                                "&:hover": { bgcolor: "#1e293b" },
                                px: 1,
                                textTransform: "none",
                            }}
                        >
                            Join
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
