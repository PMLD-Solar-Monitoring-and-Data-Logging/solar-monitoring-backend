import exportData from "../plugins/export";

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, "authorization");
    if (!authHeader) {
        throw createError({
            statusCode: 401,
            statusMessage: "Authorization header missing",
        });
    }

    try {
        // Get query parameters for custom date range (optional)
        const query = getQuery(event);
        const startTs = query.startTs ? Number(query.startTs) : Date.now() - 24 * 60 * 60 * 1000; // default: last 24 hours
        const endTs = query.endTs ? Number(query.endTs) : Date.now();

        // Transform data to CSV format
        const csvData = exportData(authHeader, startTs, endTs);

        // Set response headers for CSV download
        setHeader(event, "Content-Type", "text/csv");
        setHeader(event, "Content-Disposition", `attachment; filename="solar-logs-${Date.now()}.csv"`);

        return csvData;
    } catch (error: any) {
        console.error("Error exporting logs:", error.response?.data?.message || error.message);
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to export logs to CSV",
        });
    }
});
