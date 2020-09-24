"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { File, Console } = winston_1.transports;
const logger = winston_1.createLogger({
    level: "info",
});
if (process.env.NODE_ENV === "production") {
    const fileFormat = winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json());
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
}
else {
    const errorStackFormat = winston_1.format((info) => {
        if (info.stack) {
            console.log(info.stack);
            return false;
        }
        return info;
    });
    const consoleTransport = new Console({
        format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple(), errorStackFormat()),
    });
    logger.add(consoleTransport);
}
exports.default = logger;
//# sourceMappingURL=Logger.js.map