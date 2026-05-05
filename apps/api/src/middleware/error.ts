import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = typeof error.status === "number" ? error.status : 500;

  res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
    requestId: crypto.randomUUID()
  });
};
