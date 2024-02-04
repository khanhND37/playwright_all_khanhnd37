import * as winston from "winston";
import "winston-daily-rotate-file";

/**
 * OcgLogger logs and rotates log files
 */
export class OcgLogger {
  logger: winston.Logger;
  private static instance: OcgLogger;

  private constructor() {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          stderrLevels: ["error"],
        }),
        new winston.transports.DailyRotateFile({
          dirname: "logs",
          filename: "app-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "10m",
          maxFiles: "10d",
        }),
      ],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          if (stack !== undefined) {
            return `[${timestamp}] ${level}: ${stack}`;
          } else {
            return `[${timestamp}] ${level}: ${message}`;
          }
        })
      ),
    });
  }
  /**
   * Get logger static object
   * @returns logger static object
   */
  public static get() {
    if (!OcgLogger.instance) {
      OcgLogger.instance = new OcgLogger();
    }
    return OcgLogger.instance.logger;
  }
}
