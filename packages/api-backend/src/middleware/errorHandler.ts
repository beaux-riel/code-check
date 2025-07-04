import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '../types/api';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error caught by middleware:', err);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle different error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
    details = err.details;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    message = err.message;
  } else if (err instanceof InternalServerError) {
    statusCode = 500;
    message = err.message;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    statusCode = 400;
    message = 'Database operation failed';
    details = err.message;
  } else if (err.name === 'ZodError') {
    // Handle Zod validation errors
    statusCode = 400;
    message = 'Validation error';
    details = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}
