export default defineNuxtPlugin((nuxtApp) => {
    const auth = useAuth();

    const api = $fetch.create({
        onRequest({ request, options, error }) {
            if (auth.status.value === "authenticated") {
                // note that this relies on ofetch >= 1.4.0 - you may need to refresh your lockfile
                options.headers.set("Authorization", auth.token.value || "");
            }
        },
        async onResponseError({ response }) {
            if (response.status === 401) {
                await nuxtApp.runWithContext(() => navigateTo("/login"));
            }
        },
    });

    // Expose to useNuxtApp().$api
    return {
        provide: {
            api,
        },
    };
});
