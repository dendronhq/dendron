import { launchv2 } from "@dendronhq/api-server";
import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import execa, { ExecaChildProcess } from "execa";
import _ from "lodash";
import path from "path";

type ServerArgs = {
  logPath: string;
  port?: number;
  nextServerUrl?: string;
  nextStaticRoot?: string;
};

type SERVER_ENV = {
  NEXT_SERVER_URL?: string;
  NEXT_STATIC_ROOT?: string;
  ENGINE_SERVER_PORT?: string;
  LOG_PATH: string;
};

/**
 * Attach to a server process to kill it when the current process exits
 * @param subprocess 
 */
export function cleanServerProcess(subprocess: ExecaChildProcess) {
  const handleExit = () => {
    console.log("kill process");
    try { 
      process.kill(subprocess.pid);
    } catch(err){
      // this means process was already killed
      if (err.code !== 'ESRCH') {
        throw err;
      }
    }
  };
  process.on("exit", handleExit);
  process.on("SIGINT", handleExit);
  // catches "kill pid" (for example: nodemon restart)
  process.on("SIGUSR1", handleExit);
  process.on("SIGUSR2", handleExit);

  //catches uncaught exceptions
  process.on("uncaughtException", handleExit);

}

export function prepareServerArgs() {
  const { NEXT_SERVER_URL, NEXT_STATIC_ROOT, ENGINE_SERVER_PORT, LOG_PATH } =
    process.env;
  if (
    _.some(["LOG_PATH"], (k) => {
      return _.isUndefined(process.env[k]);
    })
  ) {
    throw new DendronError({
      message: "no value found for env variable",
      status: ERROR_STATUS.INVALID_CONFIG,
    });
  }
  const logPath: string = LOG_PATH!;
  let port: number | undefined;
  if (ENGINE_SERVER_PORT) {
    port = parseInt(ENGINE_SERVER_PORT, 10);
  }
  const nextServerUrl = NEXT_SERVER_URL;
  const nextStaticRoot = NEXT_STATIC_ROOT;
  return {
    port,
    logPath,
    nextServerUrl,
    nextStaticRoot,
  };
}

/**
 * Launch engine server 
 * @param 
 * @returns 
 */
export async function startServerNode({
  logPath,
  nextServerUrl,
  nextStaticRoot,
  port,
}: ServerArgs) {
  const logger = createLogger("/tmdendron.server", "/tmp/bond.log", { lvl: "info"});
  logger.info("launch")
  const { port: finalPort } = await launchv2({
    port,
    logPath: path.join(logPath, "dendron.server.log"),
    nextServerUrl,
    nextStaticRoot,
  });
  logger.info("post-launch")
	if (!process.send)  {
		throw new DendronError({message: "expect a child process"});
	}
	process.send(`${finalPort}`)
  return {port: finalPort};
}

export async function execServerNode({
  logPath,
  nextServerUrl,
  nextStaticRoot,
  port,
}: ServerArgs): Promise<{port: number, subprocess: ExecaChildProcess}> {
  return new Promise((resolve) => {
    const file = path.join(__dirname, "server.js");
    const subprocess = execa.node(file, {
      env: {
        LOG_PATH: logPath,
        ENGINE_SERVER_PORT: port,
        NEXT_SERVER_URL: nextServerUrl,
        NEXT_STATIC_ROOT: nextStaticRoot,
      } as SERVER_ENV,
    });
    subprocess.on("close", (code) => {
      console.log(`close: ${code}`);
    });
    subprocess.on("disconnect", () => {
      console.log("disconnect");
    });
    subprocess.on("exit", (code) => {
      console.log(`exit: ${code}`);
      //resolve({port: -1, subprocess});
    });
    subprocess.on("error", (err) => {
      console.log("error: ", err);
    });
    subprocess.on("message", (message) => {
			const port = parseInt(message as string, 10)
			resolve({port, subprocess});
    });
    cleanServerProcess(subprocess)
  });
}