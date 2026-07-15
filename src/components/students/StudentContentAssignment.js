import { useEffect, useState } from "react";
import {
    Box,
    CircularProgress,
    TextField,
    MenuItem,
    Button,
} from "@mui/material";
import { errorToast, successToast } from "@/lib/toast";
import { confirmAction } from "@/utils/confirmAction";
import {
    getStudentLearningContent,
    getStudentAssignments,
    getStudentCertificates,
    getStudentHandouts,
    unassignLearningContent,
    unassignAssignment,
    unassignCertificate,
    unassignHandout,
} from "@/services/studentAssignments";

export default function StudentContentAssignment({
    studentId,
    courseId,
    contentType,
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        if (courseId) {
            loadItems();
        }
    }, [studentId, courseId, contentType]);

    const loadItems = async () => {
        if (!courseId) return;
        try {
            setLoading(true);
            let data = [];

            if (contentType === "Learning Content") {
                data = await getStudentLearningContent(studentId, courseId);
            } else if (contentType === "Assignments") {
                data = await getStudentAssignments(studentId, courseId);
            } else if (contentType === "Certificates") {
                data = await getStudentCertificates(studentId);
            } else if (contentType === "Handouts") {
                data = await getStudentHandouts(studentId);
            }

            setItems(Array.isArray(data) ? data : []);

            const courseObjects = data
                .map(item => item.course_name ? { name: item.course_name } : null)
                .filter((course, index, self) => course && self.findIndex(c => c?.name === course?.name) === index);
            setCourses(courseObjects);
        } catch (error) {
            errorToast(error, `Failed to load ${contentType}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async (item) => {
        const title = item.learning_content_title || item.assignment_title || item.certificate_title || item.handout_title;
        const confirmed = await confirmAction(`Remove "${title}"?`);
        if (!confirmed) return;

        try {
            if (contentType === "Learning Content") {
                await unassignLearningContent(item.id);
            } else if (contentType === "Assignments") {
                await unassignAssignment(item.id);
            } else if (contentType === "Certificates") {
                await unassignCertificate(item.id);
            } else if (contentType === "Handouts") {
                await unassignHandout(item.id);
            }
            successToast(`${title} removed successfully`);
            loadItems();
        } catch (error) {
            errorToast(error, `Failed to remove ${title}`);
        }
    };

    const filteredItems = items.filter(item => {
        const title = item.learning_content_title || item.assignment_title || item.certificate_title || item.handout_title;
        const matchesSearch = title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = !filterCourse || item.course_name === filterCourse;
        return matchesSearch && matchesCourse;
    });

    return (
        <Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                />
                {courses.length > 0 && (
                    <TextField
                        select
                        size="small"
                        label="Filter by Course"
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="">All Courses</MenuItem>
                        {courses.map((course, idx) => (
                            <MenuItem key={idx} value={course.name}>
                                {course.name}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : filteredItems.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                    {filteredItems.map(item => {
                        const title = item.learning_content_title || item.assignment_title || item.certificate_title || item.handout_title;
                        return (
                            <Box
                                key={item.id}
                                sx={{
                                    p: 2,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 1,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Box>
                                    <div style={{ fontWeight: 500 }}>
                                        {title}
                                    </div>
                                    {item.course_name && (
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                                            {item.course_name}
                                        </div>
                                    )}
                                </Box>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                    <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                                        Assigned on {new Date(item.assigned_at).toLocaleDateString()}
                                    </div>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleUnassign(item)}
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            ) : (
                <p style={{ color: "#6b7280", textAlign: "center", py: 2 }}>No items assigned</p>
            )}
        </Box>
    );
}
