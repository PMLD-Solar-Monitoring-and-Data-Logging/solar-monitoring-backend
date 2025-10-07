import { Chart, registerables } from "chart.js";
import "chart.js/auto";

export default defineNuxtPlugin((nuxtApp) => {
    Chart.register(...registerables);
});
