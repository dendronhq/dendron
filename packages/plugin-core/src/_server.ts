import { launchv2 } from "@dendronhq/api-server";
import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import execa from "execa";
import { ExecaChildProcess } from "execa";
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

export async function startServer({
  logPath,
  nextServerUrl,
  nextStaticRoot,
  port,
}: ServerArgs) {
  const { port: finalPort } = await launchv2({
    port,
    logPath: path.join(logPath, "dendron.server.log"),
    nextServerUrl,
    nextStaticRoot,
  });
	if (!process.send)  {
		throw new DendronError({message: "expect a chilid process"});
	}
	process.send(`${finalPort}`)
  return {port: finalPort};
}

export async function execServer({
  logPath,
  nextServerUrl,
  nextStaticRoot,
  port,
}: ServerArgs): Promise<{port: number, subprocess: ExecaChildProcess}> {
  return new Promise((resolve, reject) => {
    const file = path.join(__dirname, "server.js");
    const subprocess = execa.node("node", [file], {
      env: {
        LOG_PATH: logPath,
        ENGINE_SERVER_PORT: port,
        NEXT_SERVER_URL: nextServerUrl,
        NEXT_STATIC_ROOT: nextStaticRoot,
      } as SERVER_ENV,
      detached: true,
      forceKillAfterTimeout: false
    });
    subprocess.on("close", (code) => {
      console.log("close");
    });
    subprocess.on("disconnect", () => {
      console.log("disconnect");
    });
    subprocess.on("exit", (code) => {
      console.log("exit");
    });
    subprocess.on("error", (err) => {
      console.log("error");
    });
    subprocess.on("message", (message) => {
			const port = parseInt(message as string, 10)
			resolve({port, subprocess});
    });
  });

  // .then(({ stdout, stderr,  }) => {
  //   if (!_.isEmpty(stderr)) {
  //     throw new DendronError({
  //       payload: stderr,
  //       message: "error starting server",
  //     });
  //   }
  //   return parseInt(stdout, 10);
  // });
}
