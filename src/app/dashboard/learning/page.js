"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/axios";
import { errorToast, successToast } from "@/lib/toast";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Paper,
    Chip,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { School, Download, Visibility, PlayCircle, Description } from "@mui/icons-material";

export default function LearningPage() {
    const { user } = useAuth();
    const [contents, setContents] = useState([]);
    const [filteredContents, setFilteredContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContent, setSelectedContent] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterCourse, setFilterCourse] = useState("");

    useEffect(() => {
        loadContent();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [contents, searchTerm, filterType, filterCourse]);

    const loadContent = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const res = await api.get("/learning/student-learning-content/student_content/", {
                params: {
                    student_id: user.id,
                    course_id: user.courses?.[0]?.course?.id || "",
                },
            });
            console.log("Learning content response:", res.data);
            const data = res.data.results || res.data || [];
            // Use the enriched response directly
            const transformed = Array.isArray(data) ? data.map(item => ({
                id: item.learning_content,
                title: item.learning_content_title,
                description: item.description || "",
                content_type: item.content_type || "",
                file: item.file || null,
                video_url: item.video_url || null,
                course: {
                    id: item.course_id,
                    name: item.course_name
                },
                assigned_at: item.assigned_at,
                completed_at: item.completed_at
            })) : [];
            setContents(transformed);
        } catch (error) {
            console.error("Failed to load content:", error);
            errorToast(error, "Failed to load learning content");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = contents;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(term) ||
                    item.description.toLowerCase().includes(term)
            );
        }

        if (filterType) {
            filtered = filtered.filter((item) => item.content_type === filterType);
        }

        if (filterCourse) {
            filtered = filtered.filter((item) => item.course === parseInt(filterCourse));
        }

        setFilteredContents(filtered);
    };

    const getContentIcon = (type) => {
        switch (type) {
            case "VIDEO":
                return <PlayCircle sx={{ fontSize: 24, color: "#ef4444" }} />;
            case "DOCUMENT":
                return <Description sx={{ fontSize: 24, color: "#3b82f6" }} />;
            case "ARTICLE":
                return <Description sx={{ fontSize: 24, color: "#8b5cf6" }} />;
            case "RESOURCE":
                return <Download sx={{ fontSize: 24, color: "#10b981" }} />;
            default:
                return <School sx={{ fontSize: 24, color: "#6b7280" }} />;
        }
    };

    const handleViewContent = (content) => {
        setSelectedContent(content);
        setViewOpen(true);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    const courses = user?.courses || [];
    const videoContents = filteredContents.filter((c) => c.content_type === "VIDEO");
    const documentContents = filteredContents.filter((c) => c.content_type === "DOCUMENT");
    const articleContents = filteredContents.filter((c) => c.content_type === "ARTICLE");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Typography variant="h4" fontWeight={700}>
                    Learning Materials
                </Typography>
                <Typography color="text.secondary">
                    Access your assigned learning content and resources.
                </Typography>
            </div>

            {/* Filters */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Search by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Content Type</InputLabel>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                label="Content Type"
                            >
                                <MenuItem value="">All Types</MenuItem>
                                <MenuItem value="VIDEO">Videos</MenuItem>
                                <MenuItem value="DOCUMENT">Documents</MenuItem>
                                <MenuItem value="ARTICLE">Articles</MenuItem>
                                <MenuItem value="RESOURCE">Resources</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                label="Course"
                            >
                                <MenuItem value="">All Courses</MenuItem>
                                {courses.map((course) => (
                                    <MenuItem key={course.id} value={course.course.id}>
                                        {course.course.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Paper>

            {/* Stats */}
            <Grid container spacing={3}>
                <Grid key="total" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#2563eb">
                            {filteredContents.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Total Materials
                        </Typography>
                    </Paper>
                </Grid>

                <Grid key="videos" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#ef4444">
                            {videoContents.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Videos
                        </Typography>
                    </Paper>
                </Grid>

                <Grid key="documents" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#3b82f6">
                            {documentContents.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Documents
                        </Typography>
                    </Paper>
                </Grid>

                <Grid key="articles" xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "grey.200",
                            p: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={700} color="#10b981">
                            {articleContents.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Articles
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Content Grid */}
            {filteredContents.length > 0 ? (
                <Grid container spacing={3}>
                    {filteredContents.map((content) => (
                        <Grid xs={12} sm={6} md={4} key={content.id}>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    height: "100%",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                        transform: "translateY(-4px)",
                                    },
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                        {getContentIcon(content.content_type)}
                                        <Chip
                                            label={content.content_type}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Typography variant="h6" fontWeight={700} mb={1}>
                                        {content.title}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        {content.description || "No description"}
                                    </Typography>

                                    <Stack spacing={1} sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {content.course?.name || "Course"}
                                        </Typography>

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Visibility />}
                                            onClick={() => handleViewContent(content)}
                                        >
                                            View
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "grey.200",
                        p: 4,
                        textAlign: "center",
                    }}
                >
                    <School sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography color="text.secondary">
                        No learning materials assigned yet.
                    </Typography>
                </Paper>
            )}

            {/* Content Details Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Learning Material</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {selectedContent && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Title
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {selectedContent.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Type
                                </Typography>
                                <Chip
                                    label={selectedContent.content_type}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body2">
                                    {selectedContent.description || "—"}
                                </Typography>
                            </Box>

                            {selectedContent.video_url && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Video URL
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="a"
                                        href={selectedContent.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ color: "primary.main", textDecoration: "none", wordBreak: "break-all" }}
                                    >
                                        {selectedContent.video_url}
                                    </Typography>
                                </Box>
                            )}

                            {selectedContent.file && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        File
                                    </Typography>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Download />}
                                        href={selectedContent.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ mt: 0.5 }}
                                    >
                                        Download
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
