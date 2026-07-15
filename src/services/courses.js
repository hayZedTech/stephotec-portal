import api from "@/lib/axios";

export const getCourses = async (params = {}) => {
    const { data } = await api.get("/courses/", {
        params,
    });

    return Array.isArray(data) ? data : data.results || [];
};

export const getCourse = async (id) => {
    const { data } = await api.get(`/courses/${id}/`);
    return data;
};

export const createCourse = async (payload) => {
    const { data } = await api.post("/courses/", payload);
    return data;
};

export const updateCourse = async (id, payload) => {
    const { data } = await api.put(`/courses/${id}/`, payload);
    return data;
};

export const deleteCourse = async (id) => {
    const { data } = await api.delete(`/courses/${id}/`);
    return data;
};