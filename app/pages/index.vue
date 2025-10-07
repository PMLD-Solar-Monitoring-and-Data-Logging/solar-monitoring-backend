<script setup>
import { onMounted, ref } from "vue";
import { Bar } from "vue-chartjs";

// Sample data - in real app this would come from API
const totalProduction = ref(84.2);
const currentPower = ref(5.2);
const efficiency = ref(98.5);
const todayRevenue = ref(127.45);

// Chart data for power generation
const powerData = ref([
    { time: "00:00", power: 0 },
    { time: "06:00", power: 0.5 },
    { time: "08:00", power: 2.1 },
    { time: "10:00", power: 4.2 },
    { time: "12:00", power: 5.8 },
    { time: "14:00", power: 5.2 },
    { time: "16:00", power: 3.9 },
    { time: "18:00", power: 1.8 },
    { time: "20:00", power: 0.2 },
    { time: "22:00", power: 0 },
]);

// Panel status data
const panels = ref([
    {
        id: 1,
        name: "Panel A1",
        status: "active",
        power: 0.43,
        efficiency: 98.2,
        temperature: 45,
    },
    {
        id: 2,
        name: "Panel A2",
        status: "active",
        power: 0.41,
        efficiency: 97.8,
        temperature: 46,
    },
    {
        id: 3,
        name: "Panel A3",
        status: "active",
        power: 0.44,
        efficiency: 98.5,
        temperature: 44,
    },
    {
        id: 4,
        name: "Panel B1",
        status: "active",
        power: 0.42,
        efficiency: 98.1,
        temperature: 45,
    },
    {
        id: 5,
        name: "Panel B2",
        status: "warning",
        power: 0.35,
        efficiency: 85.2,
        temperature: 52,
    },
    {
        id: 6,
        name: "Panel B3",
        status: "active",
        power: 0.43,
        efficiency: 98.3,
        temperature: 44,
    },
    {
        id: 7,
        name: "Panel C1",
        status: "active",
        power: 0.45,
        efficiency: 99.1,
        temperature: 43,
    },
    {
        id: 8,
        name: "Panel C2",
        status: "active",
        power: 0.42,
        efficiency: 97.9,
        temperature: 46,
    },
    {
        id: 9,
        name: "Panel C3",
        status: "offline",
        power: 0.0,
        efficiency: 0,
        temperature: 25,
    },
    {
        id: 10,
        name: "Panel D1",
        status: "active",
        power: 0.44,
        efficiency: 98.7,
        temperature: 44,
    },
    {
        id: 11,
        name: "Panel D2",
        status: "active",
        power: 0.43,
        efficiency: 98.4,
        temperature: 45,
    },
    {
        id: 12,
        name: "Panel D3",
        status: "active",
        power: 0.41,
        efficiency: 97.6,
        temperature: 47,
    },
]);

// Recent alerts
const alerts = ref([
    {
        id: 1,
        type: "warning",
        message: "Panel B2 temperature above normal",
        time: "2 minutes ago",
    },
    {
        id: 2,
        type: "error",
        message: "Panel C3 offline - connection lost",
        time: "15 minutes ago",
    },
    {
        id: 3,
        type: "info",
        message: "Maintenance scheduled for Panel A1",
        time: "1 hour ago",
    },
    {
        id: 4,
        type: "success",
        message: "All panels producing optimal power",
        time: "2 hours ago",
    },
]);

const getStatusColor = (status) => {
    switch (status) {
        case "active":
            return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
        case "warning":
            return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
        case "offline":
            return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
        default:
            return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
};

const getAlertColor = (type) => {
    switch (type) {
        case "success":
            return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
        case "warning":
            return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
        case "error":
            return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
        case "info":
            return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
        default:
            return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
};

// Simulate real-time data updates
onMounted(() => {
    setInterval(() => {
        // Update current power with small variations
        const variation = (Math.random() - 0.5) * 0.2;
        currentPower.value = Math.max(
            0,
            Math.min(6, currentPower.value + variation)
        );

        // Update efficiency
        efficiency.value = Math.max(
            95,
            Math.min(100, efficiency.value + (Math.random() - 0.5) * 0.5)
        );
    }, 3000);
});
</script>

<template>
    <div class="space-y-6">
        <!-- Dashboard Header -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Dashboard Overview
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                    Monitor your solar panel performance in real-time
                </p>
            </div>
            <div class="mt-4 lg:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                <div id="date-range-picker" date-rangepicker class="flex flex-col md:flex-row space-y-3 md:space-y-0 items-center">
                    <div class="relative w-full md:w-auto">
                        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                            </svg>
                        </div>
                        <input id="datepicker-range-start" name="start" type="text"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Select date start">
                    </div>
                    <span class="mx-4 hidden md:block text-gray-500">to</span>
                    <div class="relative w-full md:w-auto">
                        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                            </svg>
                        </div>
                        <input id="datepicker-range-end" name="end" type="text"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Select date end">
                    </div>
                </div>

                <button
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Report
                </button>
                <button
                    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                </button>
            </div>
        </div>

        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Production -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Production
                        </p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ totalProduction.toFixed(1) }} kWh
                        </p>
                        <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                            ↗ +12.5% from yesterday
                        </p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Current Power -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Current Power
                        </p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ currentPower.toFixed(1) }} kW
                        </p>
                        <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Peak: 5.8 kW today
                        </p>
                    </div>
                    <div
                        class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Efficiency -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            System Efficiency
                        </p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ efficiency.toFixed(1) }}%
                        </p>
                        <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                            Excellent performance
                        </p>
                    </div>
                    <div
                        class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Today's Revenue -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Today's Revenue
                        </p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">
                            ${{ todayRevenue.toFixed(2) }}
                        </p>
                        <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                            ↗ +8.2% from average
                        </p>
                    </div>
                    <div
                        class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts and Panel Status Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Power Generation Chart -->
            <div
                class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        Power Generation Today
                    </h3>
                    <div class="flex space-x-2">
                        <button
                            class="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/20 dark:text-blue-300">
                            Today
                        </button>
                        <button
                            class="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-700">
                            Week
                        </button>
                        <button
                            class="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-700">
                            Month
                        </button>
                    </div>
                </div>

                <!-- Simple Chart Visualization -->
                <div class="relative h-64">
                    <div class="absolute inset-0 flex items-end justify-between px-2">
                        <Bar :data="{
                            labels: powerData.map(d => d.time),
                            datasets: [{
                                label: 'Power (kW)',
                                data: powerData.map(d => d.power),
                                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                borderRadius: 4,
                            }]
                        }" :options="{ responsive: true, maintainAspectRatio: false }" class="h-full w-full" />
                    </div>
                </div>
            </div>

            <!-- Recent Alerts -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Alerts
                </h3>
                <div class="space-y-4">
                    <div v-for="alert in alerts" :key="alert.id" class="flex items-start space-x-3">
                        <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2" :class="getAlertColor(alert.type)">
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {{ alert.message }}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                {{ alert.time }}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    class="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                    View all alerts →
                </button>
            </div>
        </div>

        <!-- Panel Status Grid -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Panel Status Overview
                </h3>
                <div class="flex items-center space-x-4 text-sm">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span class="text-gray-600 dark:text-gray-400">Active (10)</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span class="text-gray-600 dark:text-gray-400">Warning (1)</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span class="text-gray-600 dark:text-gray-400">Offline (1)</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div v-for="panel in panels" :key="panel.id"
                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-medium text-gray-900 dark:text-white">
                            {{ panel.name }}
                        </h4>
                        <span class="px-2 py-1 text-xs font-medium rounded-full capitalize"
                            :class="getStatusColor(panel.status)">
                            {{ panel.status }}
                        </span>
                    </div>

                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Power:</span>
                            <span class="font-medium text-gray-900 dark:text-white">{{ panel.power.toFixed(2) }}
                                kW</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Efficiency:</span>
                            <span class="font-medium text-gray-900 dark:text-white">{{ panel.efficiency.toFixed(1)
                                }}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Temp:</span>
                            <span class="font-medium text-gray-900 dark:text-white">{{ panel.temperature }}°C</span>
                        </div>
                    </div>

                    <!-- Mini efficiency bar -->
                    <div class="mt-3">
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="h-2 rounded-full transition-all duration-300" :class="panel.efficiency > 95
                                ? 'bg-green-500'
                                : panel.efficiency > 85
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                " :style="{ width: `${panel.efficiency}%` }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Custom animations */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Hover effects for interactive elements */
.hover\:shadow-md:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
