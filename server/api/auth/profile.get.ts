import axios from "axios";

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, "authorization");
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const { data, status } = await axios.get("/auth/user", {
        baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (status !== 200) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    return data;
});
