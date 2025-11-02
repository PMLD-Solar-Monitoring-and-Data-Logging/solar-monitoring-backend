import axios from "axios";
import moment from "moment-timezone";
const deviceId = process.env.TB_DEVICE_ID;

export default async function exportData(authHeader: string, startTs?: number, endTs?: number, intervalMs: number = 0) {
    if (!authHeader) {
        throw new Error("Unauthorized");
    } else if (typeof authHeader !== "string") {
        return null;
    }

    // Get query parameters for custom date range (optional)
    startTs = startTs || Date.now() - 24 * 60 * 60 * 1000; // default: last 24 hours
    endTs = endTs || Date.now();

    // Fetch telemetry data from ThingsBoard
    const { data, status } = await axios.get(`/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`, {
        baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
        headers: { Authorization: authHeader || "" },
        params: {
            keys: "voltage,current,light,temperature",
            startTs,
            endTs,
            interval: intervalMs,
            agg: "AVG",
            useStrictDataTypes: false,
        },
    });

    if (status !== 200) {
        throw new Error("Failed to fetch device telemetry");
    }

    // Transform data to CSV format
    return convertToCSV(data);
}

interface LogData {
    timestamp: string;
    voltage: number | "";
    current: number | "";
    light: number | "";
    temperature: number | "";
}

/**
 * Convert ThingsBoard telemetry data to CSV format
 */
function convertToCSV(data: any): string {
    // Collect all unique timestamps from all sensor types
    const timestampMap = new Map<number, { [key: string]: any }>();

    // Process each sensor type
    ["voltage", "current", "light", "temperature"].forEach((sensorType) => {
        if (data[sensorType] && Array.isArray(data[sensorType])) {
            data[sensorType].forEach((entry: any) => {
                if (!timestampMap.has(entry.ts)) {
                    timestampMap.set(entry.ts, {
                        ts: entry.ts,
                        timestamp: moment(entry.ts).format("YYYY-MM-DD HH:mm:ss"),
                        voltage: "",
                        current: "",
                        light: "",
                        temperature: "",
                    });
                }
                const entryValue =
                    typeof entry.value === "number"
                        ? entry.value.toFixed(3)
                        : !isNaN(parseFloat(entry.value))
                        ? parseFloat(entry.value).toFixed(3)
                        : entry.value;

                timestampMap.get(entry.ts)![sensorType] = entryValue;
            });
        }
    });

    // Sort by timestamp (oldest to newest)
    const sortedData = Array.from(timestampMap.values()).sort((a, b) => a.ts - b.ts);

    // Create CSV header
    const headers = ["Timestamp", "Voltage (V)", "Current (A)", "Light (lux)", "Temperature (°C)"];
    const csvRows = [headers.map((header) => `"${header}"`).join(",")];

    // Add data rows
    sortedData.forEach((row) => {
        const csvRow = [`"${row.timestamp}"`, `"${row.voltage}"`, `"${row.current}"`, `"${row.light}"`, `"${row.temperature}"`].join(",");
        csvRows.push(csvRow);
    });

    return csvRows.join("\n");
}
