import axios from "axios";
const deviceId = process.env.TB_DEVICE_ID;

export default async function getCurrentData(authHeader: string) {
    const { data, status } = await axios.get(`/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`, {
        baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
        headers: { Authorization: authHeader },
        params: {
            keys: "voltage,current,light,temperature", // comma-separated list of attribute keys
            useStrictDataTypes: false,
        },
    });
    if (status !== 200) {
        throw new Error("Failed to fetch device attributes");
    }
    const { voltage, current, light, temperature } = data;
    return {
        voltage: voltage ? parseFloat(String(voltage[0]?.value)) : 0,
        current: current ? parseFloat(String(current[0]?.value)) : 0,
        light: light ? parseFloat(String(light[0]?.value)) : 0,
        temperature: temperature ? parseFloat(String(temperature[0]?.value)) : 0,
    };
}
