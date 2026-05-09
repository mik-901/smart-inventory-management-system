import type { Request } from "express";
import type { ListQuery, SortOrder } from "../types/index.js";

export function parseListQuery(req: Request, defaultSort = "created_at"): ListQuery {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const order = String(req.query.order ?? "desc").toLowerCase() === "asc" ? "asc" : ("desc" as SortOrder);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search: String(req.query.search ?? req.query.q ?? "").trim(),
    sort: String(req.query.sort ?? defaultSort),
    order
  };
}

export function sqlSort(requested: string, order: SortOrder, allowed: Record<string, string>, fallback: string) {
  const column = allowed[requested] ?? allowed[fallback] ?? fallback;
  return `${column} ${order}`;
}
