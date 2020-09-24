/**
 * Setup the winston logger.
 *
 * Documentation: https://github.com/winstonjs/winston
 */

import { createLogger, format, transports } from "winston";

// Import Functions
const { File, Console } = transports;

// Init Logger
const logger = createLogger({
  level: "info",
});

/**
 * For production write to all logs with level `info` and below
 * to `combined.log. Write all logs error (and below) to `error.log`.
 * For development, print to the console.
 */
if (process.env.NODE_ENV === "production") {
  const fileFormat = format.combine(format.timestamp(), format.json());
  const errTransport = new File({
    filename: "./logs/error.log",
    format: fileFormat,
    level: "error",
  });
  const infoTransport = new File({
    filename: "./logs/combined.log",
    format: fileFormat,
  });
  logger.add(errTransport);
  logger.add(infoTransport);
} else {
  const errorStackFormat = format((info) => {
    if (info.stack) {
      // tslint:disable-next-line:no-console
      console.log(info.stack);
      return false;
    }
    return info;
  });
  const consoleTransport = new Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
      errorStackFormat()
    ),
  });
  logger.add(consoleTransport);
}

export default logger;
