import axios from "axios";

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, "authorization");
    if (!authHeader) {
        return createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
        return createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    try {
        const { data, status } = await axios.get("/auth/user", {
            baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (status !== 200) {
            return createError({ statusCode: 401, statusMessage: "Unauthorized" });
        }
        return data;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return createError({ statusCode: 500, statusMessage: "Internal Server Error" });
    }
});
