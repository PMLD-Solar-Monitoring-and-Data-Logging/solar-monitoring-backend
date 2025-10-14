import axios from "axios";
const deviceId = process.env.TB_DEVICE_ID;

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, "authorization") || "";
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody(event);
    try {
        const url = `/plugins/telemetry/DEVICE/${deviceId}/attributes/SHARED_SCOPE`;
        const data = { relay: body.relay };
        await axios.post(url, data, {
            baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
            headers: { Authorization: authHeader },
        });
        return { success: true, message: "Device attributes updated successfully" };
    } catch (error: any) {
        console.error("Error updating device attributes:", error.response?.data.message || error.message);
        throw createError({ statusCode: 500, statusMessage: "Failed to update device attributes" });
    }
});
