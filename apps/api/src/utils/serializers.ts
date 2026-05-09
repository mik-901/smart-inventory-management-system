export function toNumber(value: unknown) {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toInteger(value: unknown) {
  return Math.trunc(toNumber(value));
}

export function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function normalizeRole(role: string) {
  const value = role.toLowerCase();
  if (value === "super_admin") return "admin";
  if (value === "warehouse_staff") return "staff";
  if (value === "manager" || value === "staff" || value === "viewer" || value === "admin") return value;
  return "viewer";
}
