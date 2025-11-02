import getRelayStatus from "../plugins/relay";

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, "authorization");
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: "Authorization header missing" });
    }
    try {
        return await getRelayStatus(authHeader);
    } catch (error: any) {
        console.error("Error fetching relay attributes:", error.response?.data.message || error.message);
        throw createError({ statusCode: 500, statusMessage: "Failed to fetch device attributes" });
    }
});
