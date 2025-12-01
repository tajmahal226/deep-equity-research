// src/utils/error.ts

import toast from "react-hot-toast";

/**
 * Custom error class for application-specific errors.
 */
export class AppError extends Error {
  /**
   * Creates a new AppError instance.
   *
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global error handler.
 * Displays a toast notification and logs the error to the console.
 *
 * @param error - The error to handle.
 */
export function handleError(error: unknown) {
  if (error instanceof AppError) {
    toast.error(error.message);
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("An unknown error occurred.");
  }

  console.error(error);
}
