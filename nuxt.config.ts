// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: process.env.NODE_ENV === "development" },
    modules: ["@nuxt/image", "@nuxt/ui", "@sidebase/nuxt-auth"],
    css: ["@/assets/css/main.css"],
    auth: {
        provider: {
            type: "local",
            endpoints: {
                signIn: { path: "/login", method: "post" },
                signOut: { path: "/logout", method: "get" },
                getSession: { path: "/profile", method: "get" },
            },
            token: {
                signInResponseTokenPointer: "/token",
                type: "Bearer",
                cookieName: "auth.token",
                headerName: "Authorization",
                maxAgeInSeconds: 1800,
                sameSiteAttribute: "lax",
                secureCookieAttribute: false,
                httpOnlyCookieAttribute: false,
            },
            session: {
                dataType: {
                    email: "string",
                    firstName: "string",
                    lastName: "string",
                    name: "string",
                },
            },
        },
    },
    ignore: [".docker/**", "docker-compose.yml", "README.md", "LICENSE", ".bot/**"],
});
