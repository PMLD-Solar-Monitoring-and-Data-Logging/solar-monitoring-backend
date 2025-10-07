<script setup>
import { onMounted, ref } from "vue";

// Dashboard state
const sidebarOpen = ref(false);
const currentTime = ref(new Date());

// Update time every second
onMounted(() => {
    setInterval(() => {
        currentTime.value = new Date();
    }, 1000);
});

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
};

// Get the current page
const route = useRoute();
function isActive(href) {
    return route.path === href;
}

// Navigation items
const navigationItems = [
    {
        name: "Dashboard",
        href: "/",
        icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
];
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Main Content -->
        <!-- Top Header -->
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between px-4 py-3 h-16">

                <!-- Page Title -->
                <div class="flex-1 lg:flex-none lg:ml-0 ml-4">
                    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                        Solar Panel Dashboard
                    </h1>
                </div>

                <!-- Header Right Section -->
                <div class="flex items-center space-x-4">
                    <!-- Current Time -->
                    <div class="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                        {{ currentTime.toLocaleTimeString() }}
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 p-6">
            <slot />
        </main>
    </div>
</template>

<style scoped>
/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}

/* Dark mode scrollbar */
.dark ::-webkit-scrollbar-track {
    background: #374151;
}

.dark ::-webkit-scrollbar-thumb {
    background: #6b7280;
}

.dark ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}
</style>
