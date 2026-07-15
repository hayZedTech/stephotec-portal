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

export const getStudentCourses = async (studentId, params = {}) => {
    const { data } = await api.get(
        `/admin/students/${studentId}/courses/`,
        { params }
    );
    return normalizeListResponse(data);
};

export const getStudentCourse = async (studentId, courseId) => {
    const { data } = await api.get(
        `/admin/students/${studentId}/courses/${courseId}/`
    );
    return data;
};

export const createStudentCourse = async (studentId, payload) => {
    const { data } = await api.post(
        `/admin/students/${studentId}/courses/`,
        payload
    );
    return data;
};

export const updateStudentCourse = async (studentId, courseId, payload) => {
    const { data } = await api.patch(
        `/admin/students/${studentId}/courses/${courseId}/`,
        payload
    );
    return data;
};

export const deleteStudentCourse = async (studentId, courseId) => {
    const { data } = await api.delete(
        `/admin/students/${studentId}/courses/${courseId}/`
    );
    return data;
};
