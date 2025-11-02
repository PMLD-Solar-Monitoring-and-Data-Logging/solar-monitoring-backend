import getCurrentData from "../plugins/current";
// [GET] /api/plugins/telemetry/DEVICE/<device_id>/values/timeseries?keys=voltage%2Ccurrent&startTs=1759865100272&endTs=1759865130272&interval=0&useStrictDataTypes=false

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, "authorization") || "";
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: "Authorization header missing" });
    }
    
    try {
        return getCurrentData(authHeader);
    } catch (error: any) {
        console.error("Error fetching current attributes:", error.response?.data.message || error.message);
        throw createError({ statusCode: 500, statusMessage: "Failed to fetch device attributes" });
    }
});
