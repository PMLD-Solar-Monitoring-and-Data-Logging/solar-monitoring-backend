<script setup>
import { initFlowbite } from "flowbite";
import moment from "moment-timezone";
import { computed, onMounted, ref } from "vue";
import { Line } from "vue-chartjs";

const auth = useAuth();
if (auth.status.value !== "authenticated") {
    await auth.signIn({}, { redirect: false });
}

// Real-time data from API
const relayStatus = ref(false);
const logsData = ref(null);
const isUpdatingRelay = ref(false);

// Current sensor values
const currentData = ref({ voltage: 0, current: 0, light: 0, temperature: 0 });
const currentVoltage = computed(() => (currentData.value.voltage || 0).toFixed(1));
const currentCurrent = computed(() => (currentData.value.current || 0).toFixed(1));
const currentLight = computed(() => (currentData.value.light || 0).toFixed(0));
const currentTemperature = computed(() => (currentData.value.temperature || 0).toFixed(1));
const currentPower = computed(() => {
    return (currentData.value.voltage * currentData.value.current) / 1000; // Convert to kW
});

// Fetch data from API
const fetchData = async () => {
    try {
        const relayData = await useAPI('/api/relay');
        if (relayData) {
            relayStatus.value = relayData.value;
        }

        const currentSensorData = await useAPI('/api/current');
        if (currentSensorData) {
            currentData.value = currentSensorData;
        }

        // If date range is set, use it for fetching logs
        let logsUrl = '/api/logs';
        if (startDate.value && endDate.value) {
            const startTs = moment(`${startDate.value.date}T${startDate.value.time}`).valueOf();
            const endTime = endDateChanged.value ? endDate.value.time : moment().format('HH:mm');
            const endTs = moment(`${endDate.value.date}T${endTime}`).valueOf();
            const intv = intervalOptions[interval.value] || intervalOptions['1H'];
            logsUrl = `/api/logs?startTs=${startTs}&endTs=${endTs}&interval=${intv}`;
        }

        const logs = await useAPI(logsUrl);
        if (logs) {
            logsData.value = logs;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// Toggle relay
const toggleRelay = async () => {
    isUpdatingRelay.value = true;
    try {
        const newStatus = !relayStatus.value;
        await useAPI('/api/relay', {
            method: 'POST',
            body: { relay: newStatus }
        });
        relayStatus.value = newStatus;
    } catch (error) {
        console.error('Error toggling relay:', error);
    } finally {
        isUpdatingRelay.value = false;
    }
};

// Export logs to CSV
const isExporting = ref(false);
const startDate = ref({
    date: moment().subtract(1, 'h').format('YYYY-MM-DD'),
    time: moment().subtract(1, 'h').format('HH:mm'),
});
const endDate = ref({
    date: moment().format('YYYY-MM-DD'),
    time: moment().format('HH:mm'),
});
const endDateChanged = ref(false);
watch(endDate, () => {
    endDateChanged.value = true;
}, { deep: true });

const intervalOptions = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '30m': 1800000,
    '1H': 3600000,
    '12H': 43200000,
    '24H': 86400000,
    '7d': 604800000,
    '30d': 2592000000,
};
const interval = ref('5m');
watch(interval, () => fetchData());

const exportToCSV = async () => {
    isExporting.value = true;
    try {
        // Convert datetime-local values to timestamps using moment()
        const startTs = moment(`${startDate.value.date}T${startDate.value.time}`).valueOf();
        const endTs = moment(`${endDate.value.date}T${endDate.value.time}`).valueOf();
        const intervalMs = intervalOptions[interval.value] || intervalOptions['5m'];

        // Create a temporary link element to trigger download
        const res = await useAPI(`/api/export?startTs=${startTs}&endTs=${endTs}&interval=${intervalMs}`, { responseType: 'blob' });
        // download the blob
        const url = window.URL.createObjectURL(new Blob([res]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `solar-logs-${moment().format('YYYY-MM-DD')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting data:', error);
    } finally {
        isExporting.value = false;
    }
};

// Initialize data
let fetchInterval;
onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('export')) {
        await exportToCSV();
    }

    initFlowbite();
    await fetchData();
    // Refresh data every 5 seconds
    fetchInterval = setInterval(fetchData, 5000);
});

onBeforeUnmount(() => {
    clearInterval(fetchInterval);
});

// Chart data preparation
const voltageChartData = computed(() => {
    if (!logsData.value?.voltage) return { labels: [], datasets: [] };

    const sortedData = [...logsData.value.voltage].sort((a, b) => a.ts - b.ts);
    return {
        labels: sortedData.map(d => moment(d.ts).format('MMM DD HH:mm')),
        datasets: [{
            label: 'Voltage (V)',
            data: sortedData.map(d => parseFloat(d.value)),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };
});

const currentChartData = computed(() => {
    if (!logsData.value?.current) return { labels: [], datasets: [] };

    const sortedData = [...logsData.value.current].sort((a, b) => a.ts - b.ts);
    return {
        labels: sortedData.map(d => moment(d.ts).format('MMM DD HH:mm')),
        datasets: [{
            label: 'Current (A)',
            data: sortedData.map(d => parseFloat(d.value)),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };
});

const lightChartData = computed(() => {
    if (!logsData.value?.light) return { labels: [], datasets: [] };

    const sortedData = [...logsData.value.light].sort((a, b) => a.ts - b.ts);
    return {
        labels: sortedData.map(d => moment(d.ts).format('MMM DD HH:mm')),
        datasets: [{
            label: 'Light (lux)',
            data: sortedData.map(d => parseFloat(d.value)),
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };
});

const temperatureChartData = computed(() => {
    if (!logsData.value?.temperature) return { labels: [], datasets: [] };

    const sortedData = [...logsData.value.temperature].sort((a, b) => a.ts - b.ts);
    return {
        labels: sortedData.map(d => moment(d.ts).format('MMM DD HH:mm')),
        datasets: [{
            label: 'Temperature (°C)',
            data: sortedData.map(d => parseFloat(d.value)),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

// Adjusted reactivity for startDatePicker to match the new variable format
const handleStartDateChange = (date) => {
    startDate.value.date = moment(date).format('YYYY-MM-DD');
};
// Adjusted reactivity for endDatePicker to match the new variable format
const handleEndDateChange = (date) => {
    endDate.value.date = moment(date).format('YYYY-MM-DD');
};

// Add event listeners for date and time pickers
onMounted(() => {
    const startDatePickerElement = document.getElementById('startDatePicker');
    if (startDatePickerElement) {
        startDatePickerElement.addEventListener('changeDate', (event) => {
            handleStartDateChange(event.detail.date);
        });
    }

    const endDatePickerElement = document.getElementById('endDatePicker');
    if (endDatePickerElement) {
        endDatePickerElement.addEventListener('changeDate', (event) => {
            handleEndDateChange(event.detail.date);
        });
    }
});
</script>

<template>
    <div class="space-y-6">
        <!-- Dashboard Header -->
        <div class="flex flex-col space-y-4">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Solar Monitoring Dashboard
                    </h2>
                    <p class="text-gray-600 dark:text-gray-400">
                        Real-time monitoring of solar panel sensors and relay control
                    </p>
                </div>
            </div>

            <!-- Date Range Picker and Actions -->
            <div class="flex flex-col lg:flex-row gap-3 items-start lg:items-end lg:justify-end">
                <!-- Date Range Inputs -->
                <div class="flex flex-col gap-2 sm:flex-row">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date & Time
                        </label>


                        <!-- Modal toggle -->
                        <button type="button" data-modal-target="startDateModal" data-modal-toggle="startDateModal"
                            class="h-9.5 text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                            <svg class="w4 h-4 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24"
                                height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path fill-rule="evenodd"
                                    d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                                    clip-rule="evenodd" />
                            </svg>
                            {{ startDate.date }} {{ startDate.time }}
                        </button>

                        <!-- Main modal -->
                        <div id="startDateModal" tabindex="-1" aria-hidden="true"
                            class="hidden overflow-y-auto overflow-x-hidden fixed z-50 justify-center items-center">
                            <div class="relative max-w-xl bg-white rounded-lg shadow-sm dark:bg-gray-700">
                                <!-- Modal header -->
                                <div
                                    class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                        Start Date & Time
                                    </h3>
                                    <button type="button"
                                        class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                        data-modal-hide="startDateModal">
                                        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                                            fill="none" viewBox="0 0 14 14">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                                stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                        </svg>
                                        <span class="sr-only">Close modal</span>
                                    </button>
                                </div>
                                <!-- Modal body -->
                                <div class="p-4 md:p-5 space-y-4">
                                    <div id="startDatePicker" inline-datepicker datepicker-buttons
                                        datepicker-autoselect-today datepicker-format="yyyy-mm-dd"
                                        :data-date="startDate.date"></div>
                                    <label for="time"
                                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select
                                        time:</label>
                                    <div class="relative">
                                        <div
                                            class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                                xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                                viewBox="0 0 24 24">
                                                <path fill-rule="evenodd"
                                                    d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                                                    clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <input type="time" id="startTimePicker"
                                            class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            min="00:00" max="23:59" v-model="startDate.time" required />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date & Time
                        </label>

                        <!-- Modal toggle -->
                        <button type="button" data-modal-target="endDateModal" data-modal-toggle="endDateModal"
                            class="h-9.5 text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                            <svg class="w4 h-4 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24"
                                height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path fill-rule="evenodd"
                                    d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                                    clip-rule="evenodd" />
                            </svg>
                            {{ endDate.date }} {{ endDate.time }}
                        </button>

                        <!-- Main modal -->
                        <div id="endDateModal" tabindex="-1" aria-hidden="true"
                            class="hidden overflow-y-auto overflow-x-hidden fixed z-50 justify-center items-center">
                            <div class="relative max-w-xl bg-white rounded-lg shadow-sm dark:bg-gray-700">
                                <!-- Modal header -->
                                <div
                                    class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                        End Date & Time
                                    </h3>
                                    <button type="button"
                                        class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                        data-modal-hide="endDateModal">
                                        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                                            fill="none" viewBox="0 0 14 14">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                                stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                        </svg>
                                        <span class="sr-only">Close modal</span>
                                    </button>
                                </div>
                                <!-- Modal body -->
                                <div class="p-4 md:p-5 space-y-4">
                                    <div id="endDatePicker" inline-datepicker datepicker-buttons
                                        datepicker-autoselect-today datepicker-format="yyyy-mm-dd"
                                        :data-date="endDate.date"></div>
                                    <label for="time"
                                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select
                                        time:</label>
                                    <div class="relative">
                                        <div
                                            class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                                xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                                viewBox="0 0 24 24">
                                                <path fill-rule="evenodd"
                                                    d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                                                    clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <input type="time" id="endTimePicker"
                                            class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            min="00:00" max="23:59" v-model="endDate.time" required />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Interval
                        </label>


                        <button id="dropdownIntervalBtn" data-dropdown-toggle="dropdownInterval"
                            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            type="button">{{ interval }}<svg class="w-2.5 h-2.5 ms-3" aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                    stroke-width="2" d="m1 1 4 4 4-4" />
                            </svg>
                        </button>

                        <!-- Dropdown menu -->
                        <div id="dropdownInterval"
                            class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700">
                            <ul class="py-2 text-sm text-gray-700 dark:text-gray-200"
                                aria-labelledby="dropdownIntervalBtn">
                                <li v-for="(value, key) in intervalOptions" :key="key" @click="interval = key">
                                    <a href="#"
                                        class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{{
                                            key }}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                    <button @click="exportToCSV" :disabled="isExporting"
                        class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg v-if="!isExporting" class="w-4 h-4 mr-2" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <svg v-else class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        Export
                    </button>
                    <button @click="fetchData"
                        class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>
        </div>

        <!-- Relay Control -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Relay Control
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Control the relay switch
                    </p>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ relayStatus ? 'ON' : 'OFF' }}
                    </span>
                    <button @click="toggleRelay" :disabled="isUpdatingRelay"
                        class="relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        :class="relayStatus ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'">
                        <span
                            class="inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform"
                            :class="relayStatus ? 'translate-x-11' : 'translate-x-1'">
                            <svg v-if="isUpdatingRelay" class="animate-spin h-8 w-8 p-1.5 text-gray-500"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Sensor Gauges -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Voltage Gauge -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Voltage</h3>
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <div class="relative">
                    <div class="flex items-baseline">
                        <span class="text-4xl font-bold text-gray-900 dark:text-white">{{ currentVoltage }}</span>
                        <span class="ml-2 text-lg text-gray-600 dark:text-gray-400">V</span>
                    </div>
                    <div class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            :style="{ width: `${Math.min((currentVoltage / 24) * 100, 100)}%` }"></div>
                    </div>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Max: 24V</p>
                </div>
            </div>

            <!-- Current Gauge -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Current</h3>
                    <div
                        class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <div class="relative">
                    <div class="flex items-baseline">
                        <span class="text-4xl font-bold text-gray-900 dark:text-white">{{ currentCurrent }}</span>
                        <span class="ml-2 text-lg text-gray-600 dark:text-gray-400">A</span>
                    </div>
                    <div class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div class="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                            :style="{ width: `${Math.min((currentCurrent / 10) * 100, 100)}%` }"></div>
                    </div>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Max: 10A</p>
                </div>
            </div>

            <!-- Light Gauge -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Light Intensity</h3>
                    <div
                        class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                        </svg>
                    </div>
                </div>
                <div class="relative">
                    <div class="flex items-baseline">
                        <span class="text-4xl font-bold text-gray-900 dark:text-white">{{ currentLight }}</span>
                        <span class="ml-2 text-lg text-gray-600 dark:text-gray-400">lux</span>
                    </div>
                    <div class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div class="bg-yellow-600 h-2.5 rounded-full transition-all duration-500"
                            :style="{ width: `${Math.min((currentLight / 10000) * 100, 100)}%` }"></div>
                    </div>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Max: 10,000 lux</p>
                </div>
            </div>

            <!-- Temperature Gauge -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Temperature</h3>
                    <div class="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                d="M10 2a1 1 0 00-1 1v8.586l-2.293-2.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 11.586V3a1 1 0 00-1-1z" />
                        </svg>
                    </div>
                </div>
                <div class="relative">
                    <div class="flex items-baseline">
                        <span class="text-4xl font-bold text-gray-900 dark:text-white">{{ currentTemperature }}</span>
                        <span class="ml-2 text-lg text-gray-600 dark:text-gray-400">°C</span>
                    </div>
                    <div class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div class="bg-red-600 h-2.5 rounded-full transition-all duration-500"
                            :style="{ width: `${Math.min((currentTemperature / 50) * 100, 100)}%` }"></div>
                    </div>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Max: 50°C</p>
                </div>
            </div>
        </div>

        <!-- Power Calculation -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-medium opacity-90 mb-1">
                        Current Power Output
                    </h3>
                    <div class="flex items-baseline">
                        <span class="text-5xl font-bold">{{ currentPower.toFixed(3) }}</span>
                        <span class="ml-3 text-2xl font-medium">kW</span>
                    </div>
                    <p class="mt-2 text-sm opacity-80">
                        Calculated from Voltage × Current
                    </p>
                </div>
                <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Voltage Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Voltage History
                </h3>
                <div class="h-64">
                    <Line v-if="voltageChartData.labels.length" :data="voltageChartData" :options="chartOptions" />
                    <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        No data available
                    </div>
                </div>
            </div>

            <!-- Current Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Current History
                </h3>
                <div class="h-64">
                    <Line v-if="currentChartData.labels.length" :data="currentChartData" :options="chartOptions" />
                    <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        No data available
                    </div>
                </div>
            </div>

            <!-- Light Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Light Intensity History
                </h3>
                <div class="h-64">
                    <Line v-if="lightChartData.labels.length" :data="lightChartData" :options="chartOptions" />
                    <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        No data available
                    </div>
                </div>
            </div>

            <!-- Temperature Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Temperature History
                </h3>
                <div class="h-64">
                    <Line v-if="temperatureChartData.labels.length" :data="temperatureChartData"
                        :options="chartOptions" />
                    <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        No data available
                    </div>
                </div>
            </div>
        </div>

        <!-- Timeseries Data Table -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Historical Data
            </h3>
            <div class="relative overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3">Timestamp</th>
                            <th scope="col" class="px-6 py-3">Voltage (V)</th>
                            <th scope="col" class="px-6 py-3">Current (A)</th>
                            <th scope="col" class="px-6 py-3">Light (lux)</th>
                            <th scope="col" class="px-6 py-3">Temperature (°C)</th>
                            <th scope="col" class="px-6 py-3">Power (kW)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!logsData?.voltage?.length"
                            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td colspan="6" class="px-6 py-4 text-center">No data available</td>
                        </tr>
                        <tr v-else v-for="(voltage, index) in logsData.voltage" :key="voltage.ts"
                            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td class="px-6 py-4">{{ moment(voltage.ts).format('YYYY-MM-DD HH:mm:ss') }}</td>
                            <td class="px-6 py-4">{{ parseFloat(voltage.value).toFixed(1) }}</td>
                            <td class="px-6 py-4">{{ logsData.current[index] ?
                                parseFloat(logsData.current[index].value).toFixed(1) : '-' }}</td>
                            <td class="px-6 py-4">{{ logsData.light[index] ?
                                parseFloat(logsData.light[index].value).toFixed(0) : '-' }}</td>
                            <td class="px-6 py-4">{{ logsData.temperature[index] ?
                                parseFloat(logsData.temperature[index].value).toFixed(1) : '-' }}</td>
                            <td class="px-6 py-4">{{ ((parseFloat(voltage.value) * (logsData.current[index] ?
                                parseFloat(logsData.current[index].value) : 0)) / 1000).toFixed(3) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Smooth transitions for all interactive elements */
button,
.transition-all {
    transition: all 0.3s ease;
}

/* Smooth animation for loading spinner */
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

/* Custom gauge animations */
@keyframes fillBar {
    from {
        width: 0;
    }
}

.bg-blue-600,
.bg-green-600,
.bg-yellow-600,
.bg-red-600 {
    animation: fillBar 0.5s ease-out;
}
</style>
