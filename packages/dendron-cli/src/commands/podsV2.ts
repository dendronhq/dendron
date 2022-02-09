import {
  DendronError,
  DEngineClient,
  NoteProps,
  NoteUtils,
  RespV3,
  URI,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  ConfigFileUtils,
  PodExportScope,
  PodUtils,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { setupEngine, SetupEngineCLIOpts, SetupEngineResp } from "./utils";

export type PodCLIOpts = {
  podConfig: URI;
  config?: string[];
  configValues?: any;
  vault?: string;
  fname?: string;
  hierarchy?: string;
  podId?: string;
};

export type PodCommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;

export type PodCommandOpts<T = any> = PodCLIOpts & {
  config: T;
  payload: NoteProps[];
} & SetupEngineResp &
  SetupEngineCLIOpts;

export function setupPodArgs(args: yargs.Argv) {
  args.option("config", {
    describe:
      "pass in config instead of reading from file. format is Key={key},Value={value}. If provided, this will override the value saved in the config file",
    array: true,
  });
  args.config(
    "podConfig",
    "*.yaml configuration file for pod",
    function (configPath) {
      const path = URI.parse(configPath);
      const configValues = ConfigFileUtils.getConfigByFPath({
        fPath: path.fsPath,
      });
      if (_.isUndefined(configValues)) {
        throw new DendronError({
          message: `unable to find configuratin file at ${path.fsPath}`,
        });
      }
      return { configValues };
    }
  );
  args.option("fname", {
    describe: "full name of the note you want to export",
    type: "string",
  });
  args.option("hierarchy", {
    describe: "hierarchy you want to export",
    type: "string",
  });
  args.option("podId", {
    describe: "unique ID for your custom pod configuration.",
    type: "string",
  });
}

export async function enrichPodArgs(
  args: PodCommandCLIOpts
): Promise<RespV3<PodCommandOpts>> {
  const { config } = args;
  let { configValues } = args;
  const engineArgs = await setupEngine(args);
  const wsRoot = engineArgs.wsRoot;
  const podsDir = PodUtils.getPodDir({ wsRoot });

  // if podId is provided, get configValues from the config.{podId}.yml
  if (args.podId) {
    const podConfigPath = path.join(
      podsDir,
      "custom",
      `config.${args.podId}.yml`
    );
    try {
      const resp = ConfigFileUtils.getConfigByFPath({
        fPath: podConfigPath,
      });
      if (_.isUndefined(resp)) {
        return {
          error: new DendronError({
            status: "no-custom-config",
            message: `no pod config found. Please create a pod config at ${podConfigPath}`,
          }),
        };
      }
      configValues = {
        ...resp,
      };
    } catch (err) {
      return {
        error: err as DendronError,
      };
    }
  }

  // if provided, overwrite the configValues
  if (config) {
    config.map((conf) => {
      const [k, v] = conf.split(",");
      const key = k.split("=")[1];
      const value = v.split("=")[1];
      configValues[key] = value;
    });
  }
  console.log("args", configValues);

  // If the config has a connectionId, read the sevice connection config file.
  if (configValues.connectionId) {
    const serviceConnectionPath = path.join(
      podsDir,
      "service-connections",
      `svcconfig.${configValues.connectionId}.yml`
    );
    try {
      const resp = ConfigFileUtils.getConfigByFPath({
        fPath: serviceConnectionPath,
      });
      if (_.isUndefined(resp)) {
        return {
          error: new DendronError({
            status: "no-service-config",
            message: `no service config found. Please create a service connection config at ${serviceConnectionPath}`,
          }),
        };
      }
      configValues = {
        ...configValues,
        ...resp,
      };
    } catch (err) {
      return {
        error: err as DendronError,
      };
    }
  }

  let payload: NoteProps[];
  const { engine } = engineArgs;
  // get payload for selected export scope
  switch (configValues.exportScope) {
    case PodExportScope.Workspace:
      payload = getWorkspaceProps(engine);
      break;
    case PodExportScope.Vault:
      payload = getVaultProps(engine, args.vault);
      break;
    case PodExportScope.Note:
      payload = getNoteProps(engine, args.vault, args.fname);
      break;
    case PodExportScope.Hierarchy:
      payload = getHierarchyProps(engine, args.hierarchy);
      break;
    default:
      throw new DendronError({
        message:
          "the CLI doesn't support the provided export scope. please run this export pod using the Dendon plugin",
      });
  }
  return {
    data: {
      ...args,
      ...engineArgs,
      config: configValues,
      payload,
    },
  };
}

const getWorkspaceProps = (engine: DEngineClient): NoteProps[] => {
  return Object.values(engine.notes).filter((notes) => notes.stub !== true);
};

const getVaultProps = (
  engine: DEngineClient,
  vaultName?: string
): NoteProps[] => {
  if (!vaultName) {
    throw new DendronError({ message: "Please provide vault name" });
  }
  const vault = VaultUtils.getVaultByNameOrThrow({
    vaults: engine.vaults,
    vname: vaultName,
  });
  return Object.values(engine.notes).filter(
    (note) => note.stub !== true && VaultUtils.isEqualV2(note.vault, vault)
  );
};

const getNoteProps = (
  engine: DEngineClient,
  vaultName?: string,
  fname?: string
): NoteProps[] => {
  if (!vaultName) {
    throw new DendronError({ message: "Please provide vault name" });
  }
  if (!fname) {
    throw new DendronError({ message: "Please provide fname of note" });
  }
  const vault = VaultUtils.getVaultByNameOrThrow({
    vaults: engine.vaults,
    vname: vaultName,
  });
  const note = NoteUtils.getNoteByFnameFromEngine({ fname, vault, engine });
  if (!note) throw new DendronError({ message: "Did not find Note" });
  return [note];
};

const getHierarchyProps = (
  engine: DEngineClient,
  hierarchy?: string
): NoteProps[] => {
  if (!hierarchy) {
    throw new DendronError({ message: "Please provide hierarchy" });
  }
  return Object.values(engine.notes).filter(
    (value) => value.fname.startsWith(hierarchy) && value.stub !== true
  );
};
