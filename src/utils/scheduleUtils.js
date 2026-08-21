export const DAYS_OF_WEEK = [
    { key: "MONDAY", label: "Monday", short: "Mon" },
    { key: "TUESDAY", label: "Tuesday", short: "Tue" },
    { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
    { key: "THURSDAY", label: "Thursday", short: "Thu" },
    { key: "FRIDAY", label: "Friday", short: "Fri" },
    { key: "SATURDAY", label: "Saturday", short: "Sat" },
    { key: "SUNDAY", label: "Sunday", short: "Sun" },
];

export const DAY_PRESETS = [
    { label: "Mon / Wed / Fri", days: ["MONDAY", "WEDNESDAY", "FRIDAY"] },
    { label: "Tue / Thu / Sat", days: ["TUESDAY", "THURSDAY", "SATURDAY"] },
    { label: "Weekdays (Mon - Fri)", days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] },
    { label: "Weekends (Sat & Sun)", days: ["SATURDAY", "SUNDAY"] },
    { label: "All 7 Days", days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] },
];

export const DURATION_OPTIONS = [
    { value: 90, label: "1 hr 30 mins (Default)", short: "1h 30m" },
    { value: 45, label: "45 mins", short: "45m" },
    { value: 60, label: "1 hour", short: "1h" },
    { value: 120, label: "2 hours", short: "2h" },
    { value: "CUSTOM", label: "Custom Time", short: "Custom" },
];

export const COLOR_PRESETS = [
    { label: "Blue", value: "#2563eb", bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
    { label: "Indigo", value: "#4f46e5", bg: "#eef2ff", text: "#4338ca", border: "#a5b4fc" },
    { label: "Emerald", value: "#059669", bg: "#ecfdf5", text: "#047857", border: "#6ee7b7" },
    { label: "Amber", value: "#d97706", bg: "#fffbeb", text: "#b45309", border: "#fcd34d" },
    { label: "Violet", value: "#7c3aed", bg: "#f5f3ff", text: "#6d28d9", border: "#c4b5fd" },
    { label: "Rose", value: "#e11d48", bg: "#fff1f2", text: "#be123c", border: "#fda4af" },
    { label: "Cyan", value: "#0891b2", bg: "#ecfeff", text: "#0e7490", border: "#67e8f9" },
    { label: "Slate", value: "#475569", bg: "#f8fafc", text: "#334155", border: "#cbd5e1" },
];

/**
 * Converts minutes from midnight to HH:MM (24h) and 12h label
 */
export function minutesToTimeString(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const pad = (n) => String(n).padStart(2, "0");
    const time24 = `${pad(hrs)}:${pad(mins)}:00`;
    const ampm = hrs >= 12 ? "PM" : "AM";
    const hrs12 = hrs % 12 || 12;
    const label = `${hrs12}:${pad(mins)} ${ampm}`;
    return { time24, label };
}

/**
 * Parses "10:30:00" or "10:30" to minutes from midnight
 */
export function timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    return hrs * 60 + mins;
}

/**
 * Formats "10:30:00" into "10:30 AM"
 */
export function formatTime12(timeStr) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const hrs = parseInt(h, 10);
    const ampm = hrs >= 12 ? "PM" : "AM";
    const hrs12 = hrs % 12 || 12;
    return `${hrs12}:${m} ${ampm}`;
}

/**
 * Generates slot options between 10:30 AM (630 min) and 6:30 PM (1110 min)
 * based on the chosen duration in minutes.
 */
export function generateSlotsForDuration(durationMinutes = 90) {
    const START_MIN = 10 * 60 + 30; // 10:30 AM = 630
    const END_MIN = 18 * 60 + 30;   // 06:30 PM = 1110
    const slots = [];

    let currentStart = START_MIN;
    while (currentStart + durationMinutes <= END_MIN) {
        const currentEnd = currentStart + durationMinutes;
        const startObj = minutesToTimeString(currentStart);
        const endObj = minutesToTimeString(currentEnd);

        slots.push({
            start_time: startObj.time24,
            end_time: endObj.time24,
            label: `${startObj.label} – ${endObj.label}`,
            duration: durationMinutes,
        });

        currentStart = currentEnd;
    }

    // If 90m duration, add late evening slot (05:00 PM – 06:30 PM) if not present
    if (durationMinutes === 90 && currentStart < END_MIN) {
        const lateStart = END_MIN - 90; // 17:00 (5:00 PM)
        if (!slots.some(s => s.start_time.startsWith("17:00"))) {
            const startObj = minutesToTimeString(lateStart);
            const endObj = minutesToTimeString(END_MIN);
            slots.push({
                start_time: startObj.time24,
                end_time: endObj.time24,
                label: `${startObj.label} – ${endObj.label}`,
                duration: durationMinutes,
            });
        }
    }

    return slots;
}
