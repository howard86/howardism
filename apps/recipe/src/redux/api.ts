import axios from "axios";

export type LocalAPIResponse<T = unknown> = T & { success: boolean };

const api = axios.create({ baseURL: "/api" });

export default api;
