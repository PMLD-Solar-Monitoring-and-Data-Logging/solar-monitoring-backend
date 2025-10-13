import axios from "axios";

export default async function getAccessToken(): Promise<{ token: string; refreshToken: string }> {
    const body = { username: process.env.TB_USERNAME, password: process.env.TB_PASSWORD };
    const { data } = await axios.post("/auth/login", body, {
        baseURL: process.env.TB_BASE_URL || "http://localhost:8080/api",
        headers: { "Content-Type": "application/json" },
    });
    return data;
}
