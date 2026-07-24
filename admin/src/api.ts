import axios from "axios";

const API_BASE_URL = "/api/v1";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    extension: string;
  };
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post("/auth/login", { email, password });
    return data.data;
  },
};

export const adminApi = {
  stats: async () => {
    const { data } = await api.get("/admin/system/stats");
    return data.data;
  },
  recentCalls: async (limit = 20) => {
    const { data } = await api.get(`/admin/system/recent-calls?limit=${limit}`);
    return data.data;
  },
  listUsers: async (page = 1, search = "") => {
    const { data } = await api.get(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
    return data;
  },
  getUser: async (id: string) => {
    const { data } = await api.get(`/admin/users/${id}`);
    return data.data;
  },
  updateUser: async (id: string, payload: any) => {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data.data;
  },
  listDids: async (page = 1) => {
    const { data } = await api.get(`/admin/dids?page=${page}`);
    return data;
  },
  assignDid: async (didId: string, userId: string) => {
    const { data } = await api.post("/admin/dids/assign", { didId, userId });
    return data.data;
  },
  unassignDid: async (didId: string) => {
    const { data } = await api.post(`/admin/dids/unassign/${didId}`);
    return data.data;
  },
};

export default api;
