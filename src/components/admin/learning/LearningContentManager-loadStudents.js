    const loadStudents = async () => {
        try {
            setLoadingStudents(true);
            const courseId = viewingContent?.course;
            const res = await api.get(`/admin/students/?courses__course_id=${courseId}`);
            const studentsList = res.data.results || res.data || [];
            setStudents(studentsList);
            setSelectedAvailableStudents(new Set());
            setSelectedAssignedStudents(new Set());
            
            // Load already assigned students
            if (viewingContent?.id) {
                try {
                    const assignedRes = await api.get(`/learning/student-learning-content/?learning_content=${viewingContent.id}`);
                    const assigned = assignedRes.data.results || assignedRes.data || [];
                    const assignedStudentIds = new Set();
                    assigned.forEach(a => {
                        assignedStudentIds.add(a.student_id);
                    });
                    setAssignedStudents(assignedStudentIds);
                } catch (err) {
                    console.error("Failed to load assigned students:", err);
                    setAssignedStudents(new Set());
                }
            }
        } catch (error) {
            console.error("Failed to load students:", error);
            errorToast(error, "Failed to load students");
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };
