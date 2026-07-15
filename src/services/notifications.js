import api from "@/lib/axios";

export const getStudentNotifications = async () => {
    try {
        const { data } = await api.get("/notifications/student_notifications/");
        return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
    }
};

export const getUnreadCount = async () => {
    try {
        const { data } = await api.get("/notifications/unread_count/");
        return data.unread_count || 0;
    } catch (error) {
        console.error("Failed to fetch unread count:", error);
        return 0;
    }
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        await api.post(`/notifications/${notificationId}/mark_as_read/`);
        return true;
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return false;
    }
};
