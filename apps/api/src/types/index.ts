import type { Request } from "express";

export type Role = "admin" | "manager" | "staff" | "viewer";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthRequest = Request & {
  user?: AuthUser;
};

export type SortOrder = "asc" | "desc";

export type ListQuery = {
  page: number;
  limit: number;
  offset: number;
  search: string;
  sort: string;
  order: SortOrder;
};
