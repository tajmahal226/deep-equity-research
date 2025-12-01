/**
 * Simple logger that only outputs to console in non-production environments.
 */
export const logger = {
  /**
   * Logs a message to the console.
   *
   * @param args - Arguments to log.
   */
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  /**
   * Logs a warning to the console.
   *
   * @param args - Arguments to log.
   */
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
};
