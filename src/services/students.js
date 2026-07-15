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

const normalizeGender = (gender) => {
    if (gender === "Male") return "MALE";
    if (gender === "Female") return "FEMALE";
    if (gender === "Other") return "OTHER";
    return gender;
};

const normalizeStudent = (student) => {
    return {
        ...student,
        gender: normalizeGender(student.gender),
    };
};

export const getStudents = async (params = {}) => {
    const { data } = await api.get("/admin/students/", {
        params,
    });

    const students = normalizeListResponse(data);
    return students.map(normalizeStudent);
};

export const getStudent = async (id) => {
    const { data } = await api.get(`/admin/students/${id}/`);
    return normalizeStudent(data);
};

export const createStudent = async (payload) => {
    const { data } = await api.post("/admin/students/", payload);
    return normalizeStudent(data);
};

export const updateStudent = async (id, payload) => {
    const { data } = await api.patch(
        `/admin/students/${id}/`,
        payload
    );

    return normalizeStudent(data);
};

export const deleteStudent = async (id) => {
    const { data } = await api.delete(
        `/admin/students/${id}/`
    );

    return data;
};

export const bulkDeleteStudents = async (ids) => {
    const { data } = await api.post(
        "/admin/students/bulk_delete/",
        {
            ids,
        }
    );

    return data;
};

export const toggleIndustrialTraining = async (
    id,
    value
) => {
    const { data } = await api.patch(
        `/admin/students/${id}/`,
        {
            is_industrial_training: value,
        }
    );

    return normalizeStudent(data);
};
