import {
  DendronError,
  DEngineClient,
  ERROR_SEVERITY,
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
  podConfig?: URI;
  inlineConfig?: string[];
  configValues?: { [key: string]: any };
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
  args.option("inlineConfig", {
    describe:
      "pass in config instead of reading from file. format is Key={key},Value={value}. If provided, this will override the value saved in the config file",
    array: true,
  });
  args.config("podConfig", "*.yml configuration file for pod", (configPath) => {
    const path = URI.parse(configPath);
    const configValues = ConfigFileUtils.getConfigByFPath({
      fPath: path.fsPath,
    });
    if (_.isUndefined(configValues)) {
      throw new DendronError({
        message: `unable to find configuration file at ${path.fsPath}`,
      });
    }
    return { configValues };
  });
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
  const { inlineConfig } = args;
  let { configValues = {} } = args;
  const engineArgs = await setupEngine(args);
  const wsRoot = engineArgs.wsRoot;
  const podsDir = PodUtils.getPodDir({ wsRoot });

  // return if no config is given
  if (!args.podId && !args.podConfig && !args.inlineConfig) {
    return {
      error: new DendronError({
        severity: ERROR_SEVERITY.FATAL,
        message: `no pod config found. Please provide a pod config or inline config`,
      }),
    };
  }

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
            severity: ERROR_SEVERITY.FATAL,
            status: "no-custom-config",
            message: `no pod config found for this podId. Please create a pod config at ${podConfigPath}`,
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
  if (inlineConfig) {
    inlineConfig.map((conf) => {
      const [k, v] = conf.split(",");
      const key = k.split("=")[1];
      const value = v.split("=")[1];
      configValues[key] = value;
    });
  }

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
            message: `no service config found for this connectionId. Please create a service connection config at ${serviceConnectionPath}`,
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
      payload = getPropsForWorkspaceScope(engine);
      break;
    case PodExportScope.Vault:
      payload = getPropsForVaultScope({ engine, vaultName: args.vault });
      break;
    case PodExportScope.Note:
      payload = getPropsForNoteScope({
        engine,
        vaultName: args.vault,
        fname: args.fname,
      });
      break;
    case PodExportScope.Hierarchy:
      payload = getHierarchyProps({
        engine,
        hierarchy: args.hierarchy,
        vaultName: args.vault,
      });
      break;
    default:
      throw new DendronError({
        message: `the CLI doesn't support the provided export scope: ${configValues.exportScope}. please run this export pod using the Dendon plugin`,
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
/**
 *
 * @param engine
 * @returns all notes in workspace
 */
const getPropsForWorkspaceScope = (engine: DEngineClient): NoteProps[] => {
  return Object.values(engine.notes).filter((notes) => notes.stub !== true);
};

/**
 *
 * @returns all notes in the vault
 */
const getPropsForVaultScope = (opts: {
  engine: DEngineClient;
  vaultName?: string;
}): NoteProps[] => {
  const { engine, vaultName } = opts;
  const vault = checkVaultArgs({ engine, vaultName });
  return Object.values(engine.notes).filter(
    (note) => note.stub !== true && VaultUtils.isEqualV2(note.vault, vault)
  );
};

const getPropsForNoteScope = (opts: {
  engine: DEngineClient;
  vaultName?: string;
  fname?: string;
}): NoteProps[] => {
  const { engine, fname, vaultName } = opts;
  const vault = checkVaultArgs({ engine, vaultName });

  if (!fname) {
    throw new DendronError({
      message: "Please provide fname of note in --fname arg",
    });
  }
  const note = NoteUtils.getNoteByFnameFromEngine({ fname, vault, engine });
  if (!note)
    throw new DendronError({
      message: `Cannot find note with fname ${fname} in vault ${vault}`,
    });
  return [note];
};

// returns notes within a hierarchy (for a specefic vault)
const getHierarchyProps = (opts: {
  engine: DEngineClient;
  hierarchy?: string;
  vaultName?: string;
}): NoteProps[] => {
  const { engine, hierarchy, vaultName } = opts;
  if (!hierarchy) {
    throw new DendronError({
      message: "Please provide hierarchy in --hierarchy arg",
    });
  }
  const vault = checkVaultArgs({ engine, vaultName });
  return Object.values(engine.notes).filter(
    (value) =>
      value.fname.startsWith(hierarchy) &&
      value.stub !== true &&
      VaultUtils.isEqualV2(value.vault, vault)
  );
};

/**
 * This method check --vault argument. For a single vault workspace, if --vault not provided,
 * returns the vault from workspace.
 * For multi-vault workspace, if no --vault is given, returns an error, else returns selected vault
 */
const checkVaultArgs = (opts: {
  engine: DEngineClient;
  vaultName?: string;
}) => {
  const { engine, vaultName } = opts;
  const { vaults } = engine;
  if (_.size(vaults) > 1 && !vaultName) {
    throw new DendronError({
      message: "Please provide vault name in --vault arg",
    });
  } else {
    return vaultName
      ? VaultUtils.getVaultByNameOrThrow({ vaults, vname: vaultName })
      : vaults[0];
  }
};
