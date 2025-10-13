import getCurrentData from "../plugins/current";
const deviceId = process.env.TB_DEVICE_ID;
// [GET] /api/plugins/telemetry/DEVICE/<device_id>/values/timeseries?keys=voltage%2Ccurrent&startTs=1759865100272&endTs=1759865130272&interval=0&useStrictDataTypes=false

export default defineEventHandler(async (event) => {
    try {
        const authHeader = getHeader(event, "authorization") || "";
        if (!authHeader) {
            throw createError({ statusCode: 401, statusMessage: "Authorization header missing" });
        }
        
        return getCurrentData(authHeader);
    } catch (error: any) {
        console.error("Error fetching device attributes:", error.response?.data.message || error.message);
        throw createError({ statusCode: 500, statusMessage: "Failed to fetch device attributes" });
    }
});
