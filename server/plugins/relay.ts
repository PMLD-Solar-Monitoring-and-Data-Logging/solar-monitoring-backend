import axios from "axios";
const deviceId = process.env.TB_DEVICE_ID;

export default async function getRelayStatus(authToken: string) {
    const { data, status } = await axios.get(`/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SHARED_SCOPE`, {
        baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
        headers: { Authorization: authToken },
        params: { keys: "relay" }, // comma-separated list of attribute keys
    });
    if (status !== 200) {
        throw new Error("Failed to fetch device attributes");
    }
    return data[0];
}
