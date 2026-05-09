import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  status: number;
  errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function asyncHandler<TReq extends Request = Request>(
  handler: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: TReq, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export function ok<T>(res: Response, data: T, message = "OK") {
  return res.json({ success: true, message, data });
}

export function created<T>(res: Response, data: T, message = "Created") {
  return res.status(201).json({ success: true, message, data });
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function paginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  message = "OK"
) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1
    }
  });
}
