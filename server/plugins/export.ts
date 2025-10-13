import axios from "axios";
import moment from "moment-timezone";
const deviceId = process.env.TB_DEVICE_ID;

export default async function exportData(authHeader: string, startTs?: number, endTs?: number) {
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
            interval: 0,
            agg: "NONE", // Get all data points, no aggregation
            useStrictDataTypes: false,
        },
    });

    if (status !== 200) {
        throw new Error("Failed to fetch device telemetry");
    }

    // Transform data to CSV format
    return convertToCSV(data);
}

/**
 * Convert ThingsBoard telemetry data to CSV format
 */
function convertToCSV(data: any): string {
    // Collect all unique timestamps from all sensor types
    const timestampMap = new Map<number, any>();

    // Process each sensor type
    ["voltage", "current", "light", "temperature"].forEach((sensorType) => {
        if (data[sensorType] && Array.isArray(data[sensorType])) {
            data[sensorType].forEach((entry: any) => {
                if (!timestampMap.has(entry.ts)) {
                    timestampMap.set(entry.ts, {
                        timestamp: moment(entry.ts).format('YYYY-MM-DD HH:mm:ss'),
                        voltage: "",
                        current: "",
                        light: "",
                        temperature: "",
                    });
                }
                timestampMap.get(entry.ts)![sensorType] = entry.value;
            });
        }
    });

    // Sort by timestamp (oldest to newest)
    const sortedData = Array.from(timestampMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Create CSV header
    const headers = ["Timestamp", "Date/Time", "Voltage (V)", "Current (A)", "Light (lux)", "Temperature (°C)"];
    const csvRows = [headers.join(",")];

    // Add data rows
    sortedData.forEach((row) => {
        const csvRow = [row.timestamp, row.date, row.voltage, row.current, row.light, row.temperature].join(",");
        csvRows.push(csvRow);
    });

    return csvRows.join("\n");
}
