import api from "@/lib/axios";

const normalizeListResponse = (data) => {
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data?.results)) {
        return data.results;
    }
    return [];
};

export const getStudentLearningContent = async (studentId, courseId) => {
    const { data } = await api.get(
        `/learning/student-learning-content/student_content/?student_id=${studentId}&course_id=${courseId}`
    );
    return normalizeListResponse(data);
};

export const getStudentAssignments = async (studentId, courseId) => {
    const { data } = await api.get(
        `/learning/student-assignments/student_assignments/?student_id=${studentId}&course_id=${courseId}`
    );
    return normalizeListResponse(data);
};

export const getStudentCertificates = async (studentId) => {
    const { data } = await api.get(
        `/learning/student-certificates/?student_id=${studentId}`
    );
    return normalizeListResponse(data);
};

export const getStudentHandouts = async (studentId) => {
    const { data } = await api.get(
        `/learning/student-handouts/?student_id=${studentId}`
    );
    return normalizeListResponse(data);
};

export const assignLearningContentToStudents = async (learningContentId, studentIds) => {
    const { data } = await api.post(
        `/learning/learning-content/${learningContentId}/assign_to_students/`,
        { student_ids: studentIds }
    );
    return data;
};

export const assignAssignmentsToStudents = async (assignmentId, studentIds) => {
    const { data } = await api.post(
        `/learning/assignments/${assignmentId}/assign_to_students/`,
        { student_ids: studentIds }
    );
    return data;
};

export const assignCertificatesToStudents = async (certificateId, studentIds) => {
    const { data } = await api.post(
        `/learning/certificates/${certificateId}/assign_to_students/`,
        { student_ids: studentIds }
    );
    return data;
};

export const assignHandoutsToStudents = async (handoutId, studentIds) => {
    const { data } = await api.post(
        `/learning/handouts/${handoutId}/assign_to_students/`,
        { student_ids: studentIds }
    );
    return data;
};

export const unassignLearningContent = async (contentId) => {
    const { data } = await api.delete(
        `/learning/student-learning-content/${contentId}/`
    );
    return data;
};

export const unassignAssignment = async (assignmentId) => {
    const { data } = await api.delete(
        `/learning/student-assignments/${assignmentId}/`
    );
    return data;
};

export const unassignCertificate = async (certificateId) => {
    const { data } = await api.delete(
        `/learning/student-certificates/${certificateId}/`
    );
    return data;
};

export const unassignHandout = async (handoutId) => {
    const { data } = await api.delete(
        `/learning/student-handouts/${handoutId}/`
    );
    return data;
};
