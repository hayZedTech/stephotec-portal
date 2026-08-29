import api from "@/lib/axios";
import { fetchWithCache, invalidateCache } from "@/utils/cache";

export const getCourses = async (params = {}) => {
    const isDefaultFetch = !params || Object.keys(params).length === 0;
    if (isDefaultFetch) {
        return fetchWithCache("courses_all", async () => {
            const { data } = await api.get("/courses/", { params });
            return Array.isArray(data) ? data : data.results || [];
        }, 60000);
    }

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
    invalidateCache("courses");
    return data;
};

export const updateCourse = async (id, payload) => {
    const { data } = await api.put(`/courses/${id}/`, payload);
    invalidateCache("courses");
    return data;
};

export const patchCourse = async (id, payload) => {
    const { data } = await api.patch(`/courses/${id}/`, payload);
    invalidateCache("courses");
    return data;
};

export const deleteCourse = async (id) => {
    const { data } = await api.delete(`/courses/${id}/`);
    invalidateCache("courses");
    return data;
};