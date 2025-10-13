import axios from "axios";
const deviceId = process.env.TB_DEVICE_ID;

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    try {
        const response = await axios.post(
            `/plugins/telemetry/DEVICE/${deviceId}/attributes/SHARED_SCOPE`,
            { relay: body.relay },
            {
                baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
                headers: { Authorization: getHeader(event, "authorization") || "" },
            }
        );
        console.log("Device attributes updated successfully:", response.data);
        return { success: true, message: "Device attributes updated successfully" };
    } catch (error: any) {
        console.error("Error updating device attributes:", error.response?.data.message || error.message);
        throw createError({ statusCode: 500, statusMessage: "Failed to update device attributes" });
    }
});
