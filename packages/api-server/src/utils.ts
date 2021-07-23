import {
  DendronError,
  DEngine,
  ERROR_SEVERITY,
  ERROR_STATUS,
  stringifyError
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import execa, { ExecaChildProcess } from "execa";
import _ from "lodash";
import path from "path";
import { launchv2 } from ".";
import { MemoryStore } from "./store/memoryStore";

export function getWSKey(uri: string) {
  return _.trimEnd(uri, "/").toLowerCase();
}

export async function putWS({
  ws,
  engine,
}: {
  ws: string;
  engine: DendronEngineV2;
}) {
  MemoryStore.instance().put(`ws:${getWSKey(ws)}`, engine);
}

export async function getWS({ ws }: { ws: string }) {
  const engine = await MemoryStore.instance().get<DEngine>(
    `ws:${getWSKey(ws)}`
  );
  if (!engine) {
    throw `No Engine: ${ws}`;
  }
  return engine;
}

type ServerArgs = {
  scriptPath: string;
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

export enum SubProcessExitType {
  EXIT = "exit",
  SIGINT = "SIGINT",
  SIGURS1 = "SIGUSR1",
  SIGURS2 = "SIGUSR2",
  UNCAUGHT_EXCEPTION = "uncaughtException"
}
export class ServerUtils {
  static onProcessExit({
    subprocess,
    cb,
  }: {
    subprocess: ExecaChildProcess;
    cb: (exitType: SubProcessExitType, args?: any) => any;
  }) {
    subprocess.on("exit", () => cb(SubProcessExitType.EXIT));
    subprocess.on("SIGINT", cb(SubProcessExitType.SIGINT));
    // catches "kill pid" (for example: nodemon restart)
    subprocess.on("SIGUSR1", cb(SubProcessExitType.SIGURS1));
    subprocess.on("SIGUSR2", cb(SubProcessExitType.SIGURS2));

    //catches uncaught exceptions
    subprocess.on("uncaughtException", cb(SubProcessExitType.UNCAUGHT_EXCEPTION));
  }

  /**
   * Attach to a server process to kill it when the current process exits
   * @param subprocess
   */
  static cleanServerProcess(subprocess: ExecaChildProcess) {
    const handleExit = () => {
      console.log("kill process");
      try {
        process.kill(subprocess.pid);
      } catch (err) {
        // this means process was already killed
        if (err.code !== "ESRCH") {
          throw err;
        }
      }
    };
    ServerUtils.onProcessExit({ subprocess, cb: handleExit });
  }

  static prepareServerArgs() {
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
  static async startServerNode({
    logPath,
    nextServerUrl,
    nextStaticRoot,
    port,
  }: Omit<ServerArgs, "scriptPath">) {
    const { port: finalPort } = await launchv2({
      port,
      logPath: path.join(logPath, "dendron.server.log"),
      nextServerUrl,
      nextStaticRoot,
    });
    if (!process.send) {
      throw new DendronError({ message: "expect a child process" });
    }
    process.send(`${finalPort}`);
    return { port: finalPort };
  }

  /**
   * Create a subprocess with a running instance of the engine server
   * @returns
   */
  static async execServerNode({
    scriptPath,
    logPath,
    nextServerUrl,
    nextStaticRoot,
    port,
  }: ServerArgs): Promise<{ port: number; subprocess: ExecaChildProcess }> {
    const logger = createLogger("execServer", path.join(logPath, "dendron.log"));
    return new Promise((resolve, reject) => {
      logger.info({state: "enter"})
      const subprocess = execa.node(scriptPath, {
        env: {
          LOG_PATH: logPath,
          ENGINE_SERVER_PORT: port,
          NEXT_SERVER_URL: nextServerUrl,
          NEXT_STATIC_ROOT: nextStaticRoot,
        } as SERVER_ENV,
      });
      logger.info({state: "post:exec.node"})
      subprocess.on("close", (code) => {
        logger.error({state: "close"})
        reject(new DendronError({message: "close", payload: {code}}));
      });
      subprocess.on("disconnect", () => {
        logger.error({state: "disconnect"})
        reject(new DendronError({message: "disconnect"}));
      });
      subprocess.on("exit", (code) => {
        logger.error({state: "exit"})
        reject(new DendronError({message: "exit", payload: {code}}));
      });
      subprocess.on("error", (err) => {
        logger.error({state: "error", payload: err})
        reject(new DendronError({message: "error", payload: stringifyError(err)}));
      });
      subprocess.on("message", (message) => {
        logger.info({state: "message", message})
        const port = parseInt(message as string, 10);
        if (port <= 0) {
          reject({
            error: new DendronError({
              message: "port is smaller than 0",
              severity: ERROR_SEVERITY.FATAL,
            })
          });
        }
        resolve({ port, subprocess });
      });
      this.cleanServerProcess(subprocess);
    });
  }
}
export enum ProcessReturnType {
  ERROR = "error",
}
