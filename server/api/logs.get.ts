import axios from "axios";
import moment from "moment-timezone";
const deviceId = process.env.TB_DEVICE_ID;
// [GET] /api/plugins/telemetry/DEVICE/<device_id>/values/timeseries?keys=voltage%2Ccurrent&startTs=1759865100272&endTs=1759865130272&interval=0&useStrictDataTypes=false

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, "authorization") || "";
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
    
    try {
        // Get query parameters for custom date range (optional)
        const query = getQuery(event);
        const startTs = query.startTs ? Number(query.startTs) : moment().subtract(5, "minutes").valueOf(); // default: last 5 minutes
        const endTs = query.endTs ? Number(query.endTs) : moment().valueOf(); // default: now
        const interval = query.interval ? Number(query.interval) : 1000 * 60 * 60; // default: 1H

        const { data, status } = await axios.get(`/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`, {
            baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
            headers: { Authorization: authHeader },
            params: {
                keys: "voltage,current,light,temperature", // comma-separated list of attribute keys
                startTs, // use parameter or default
                endTs, // use parameter or default
                interval, // interval in ms
                agg: "AVG", // aggregation type: AVG, MIN, MAX, SUM, COUNT, NONE
                useStrictDataTypes: false,
            },
        });
        if (status !== 200) {
            throw new Error("Failed to fetch device attributes");
        }
        return data;
    } catch (error: any) {
        console.error("Error fetching logs:", error.response?.data.message || error.message);
        throw createError({ statusCode: 500, statusMessage: "Failed to fetch device attributes" });
    }
});
