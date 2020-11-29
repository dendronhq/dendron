import process from "process";
const { launch } = require("./index");
const port = process.env.PORT || 3000;
const logPath = process.env.LOG_DST;
launch({ port: port as number, logPath });
