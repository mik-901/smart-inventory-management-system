import { apiClient } from "@/lib/api/client";

export type LoginResponse = {
  user: { id: string; name: string; email: string; role: string };
  accessToken: string;
  refreshToken: string;
};

export const authApi = {
  login: (email: string, password: string) => apiClient.post<LoginResponse>("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) => apiClient.post<LoginResponse>("/auth/register", { name, email, password }),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me")
};
