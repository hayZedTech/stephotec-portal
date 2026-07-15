import api from "@/lib/axios";

export async function getAuditLogs(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        if (filters.action) params.append("action", filters.action);

        const { data } = await api.get(
            `/audit/logs/?${params.toString()}`
        );
        
        return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        throw error;
    }
}
