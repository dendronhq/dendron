import process from "process";

import { launch } from "./index";
const port = process.env.PORT || 3000;
const logPath = process.env.LOG_DST_DIR;
launch({ port: port as number, logPath });
