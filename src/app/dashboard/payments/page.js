"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
    Box, Paper, Typography, Chip, CircularProgress, LinearProgress,
    Divider, Tabs, Tab,
} from "@mui/material";
import { Payment, CheckCircle, HourglassEmpty, ReportProblemOutlined } from "@mui/icons-material";
import api from "@/lib/axios";
import { errorToast } from "@/lib/toast";

const STATUS_META = {
    PAID:    { color: "success", text: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle },
    PARTIAL: { color: "warning", text: "#d97706", bg: "#fffbeb", Icon: HourglassEmpty },
    UNPAID:  { color: "error",   text: "#dc2626", bg: "#fef2f2", Icon: ReportProblemOutlined },
};

function fmt(val) {
    return Number(val || 0).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });
}

function InfoRow({ label, value, valueColor }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: "1px solid", borderColor: "grey.100" }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: valueColor || "text.primary" }}>{value}</Typography>
        </Box>
    );
}

function CoursePaymentDetail({ payment }) {
    const meta = STATUS_META[payment.status] || STATUS_META.UNPAID;
    const pct = payment.course_fee > 0 ? Math.min(100, Math.round((payment.amount_paid / payment.course_fee) * 100)) : 0;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            {/* Status banner */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, borderRadius: 2, bgcolor: meta.bg, border: "1px solid", borderColor: meta.text + "33" }}>
                <meta.Icon sx={{ fontSize: 18, color: meta.text }} />
                <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: meta.text }}>
                        {payment.status === "PAID" ? "Fully Paid" : payment.status === "PARTIAL" ? "Partially Paid" : "Payment Pending"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Enrollment ID: {payment.enrollment_id}
                    </Typography>
                </Box>
                <Chip label={payment.status} color={meta.color} size="small" sx={{ ml: "auto" }} />
            </Box>

            {/* Amount cards */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: { xs: 1, sm: 2 } }}>
                {[
                    { label: "Course Fee", value: fmt(payment.course_fee), color: "#2563eb", bg: "#eff6ff" },
                    { label: "Amount Paid", value: fmt(payment.amount_paid), color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Outstanding", value: fmt(payment.outstanding), color: "#dc2626", bg: "#fef2f2" },
                ].map((item) => (
                    <Paper key={item.label} elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, textAlign: "center", bgcolor: item.bg, border: "1px solid", borderColor: item.color + "33" }}>
                        <Typography variant="body2" fontWeight={800} sx={{ color: item.color, fontSize: { xs: "0.75rem", sm: "1rem" } }}>{item.value}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>{item.label}</Typography>
                    </Paper>
                ))}
            </Box>

            {/* Progress */}
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>Payment Progress</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: meta.text }}>{pct}%</Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 12, borderRadius: 6, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { bgcolor: meta.text, borderRadius: 6 } }}
                />
            </Box>

            <Divider />

            {/* Details */}
            <Box>
                <InfoRow label="Course" value={payment.course_name} />
                <InfoRow label="Enrollment ID" value={payment.enrollment_id} />
                <InfoRow label="Last Updated" value={new Date(payment.last_updated).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} />
            </Box>

            {/* Notes */}
            {payment.notes && (
                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Notes from Admin</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{payment.notes}</Typography>
                </Box>
            )}
        </Box>
    );
}

export default function StudentPaymentsPage() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/payments/my/");
            setPayments(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            errorToast(err, "Failed to load payment details");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>My Payments</Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    View your course fee payment status and history.
                </Typography>
            </Box>

            {payments.length === 0 ? (
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", p: 6, textAlign: "center" }}>
                    <Payment sx={{ fontSize: 48, color: "grey.300", mb: 1 }} />
                    <Typography color="text.secondary">No payment records found.</Typography>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: { xs: 2, sm: 4 }, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                    {/* Tabs — one per course */}
                    <Box sx={{ borderBottom: "1px solid", borderColor: "grey.200", px: { xs: 1, sm: 2 } }}>
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                "& .MuiTab-root": {
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    minHeight: { xs: 44, sm: 52 },
                                    textTransform: "none",
                                    fontWeight: 500,
                                    px: { xs: 1.5, sm: 2 },
                                },
                            }}
                        >
                            {payments.map((p) => (
                                <Tab
                                    key={p.id}
                                    label={
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                            <span>{p.course_name}</span>
                                            {p.is_primary && (
                                                <Chip label="Primary" size="small" color="primary" sx={{ height: 16, fontSize: "0.6rem" }} />
                                            )}
                                            <Chip
                                                label={p.status}
                                                size="small"
                                                color={(STATUS_META[p.status] || STATUS_META.UNPAID).color}
                                                variant="outlined"
                                                sx={{ height: 16, fontSize: "0.6rem" }}
                                            />
                                        </Box>
                                    }
                                />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Tab content */}
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        {payments.map((p, i) => tab === i && <CoursePaymentDetail key={p.id} payment={p} />)}
                    </Box>
                </Paper>
            )}
        </Box>
    );
}
