import axios from "axios";

export type LocalAPIResponse<T = unknown> = T & { success: boolean };

const api = axios.create({ baseURL: "/api" });

export const updateAuthorizationHeader = (jwt: string): void => {
  api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
};

export const deleteAuthorizationHeader = (): void => {
  api.defaults.headers.common["Authorization"] = "";
};

export default api;
