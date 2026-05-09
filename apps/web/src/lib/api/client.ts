import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ACCESS_TOKEN_KEY = "smart_inv_access_token";
const REFRESH_TOKEN_KEY = "smart_inv_refresh_token";
const USER_KEY = "smart_inv_user";

type Query = Record<string, string | number | boolean | null | undefined>;

function getToken(key: string) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function setToken(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}

function unwrap<T>(payload: any): T {
  return (payload?.data ?? payload) as T;
}

export const axiosClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" }
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken() {
  refreshPromise ??= (async () => {
    const refreshToken = getToken(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const data = unwrap<any>(response.data);
    setToken(ACCESS_TOKEN_KEY, data.accessToken);
    setToken(REFRESH_TOKEN_KEY, data.refreshToken);
    if (data.user && typeof window !== "undefined") localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return true;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && (await refreshAccessToken())) {
      original._retry = true;
      return axiosClient(original);
    }
    const message = error.response?.data?.message ?? error.response?.data?.error ?? error.message;
    if (typeof window !== "undefined") toast.error(message);
    return Promise.reject(new Error(message));
  }
);

export const apiClient = {
  get: async <T>(path: string, query?: Query) => unwrap<T>((await axiosClient.get(path, { params: query })).data),
  post: async <T>(path: string, body?: unknown) => unwrap<T>((await axiosClient.post(path, body)).data),
  put: async <T>(path: string, body?: unknown) => unwrap<T>((await axiosClient.put(path, body)).data),
  patch: async <T>(path: string, body?: unknown) => unwrap<T>((await axiosClient.patch(path, body)).data),
  delete: async <T>(path: string) => unwrap<T>((await axiosClient.delete(path)).data)
};

export async function getApi<T>(path: string, query?: Query) {
  return apiClient.get<T>(path, query);
}

export function reportExportUrl(type: string, format: "csv" | "xlsx" = "csv") {
  const url = new URL(`/api/reports/export/${type}`, API_URL);
  url.searchParams.set("format", format);
  return url.toString();
}
