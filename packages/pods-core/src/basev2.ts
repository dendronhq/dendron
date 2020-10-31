import { DendronError, DEngineClientV2, DVault } from "@dendronhq/common-all";
import _ from "lodash";
import { createLogger, DLogger, resolvePath } from "@dendronhq/common-server";
import { URI } from "vscode-uri";

export abstract class BasePod {
  public L: DLogger;
  constructor() {
    this.L = createLogger("PodLogger");
  }

  abstract config: PodConfig[];

  getPodPath({
    fpath,
    wsRoot,
    pathKey,
  }: {
    fpath?: string;
    wsRoot: string;
    pathKey: string;
  }) {
    let destPath: string | undefined = fpath;
    if (_.isUndefined(destPath)) {
      const maybeDest = _.find(this.config, { key: pathKey });
      if (_.isUndefined(maybeDest) || _.isUndefined(maybeDest.default)) {
        throw new DendronError({ msg: "no dest specified" });
      }
      destPath = maybeDest.default as string;
    }
    return URI.file(resolvePath(destPath, wsRoot));
  }
}

export type PodConfig = {
  key: string;
  description: string;
  type: "string" | "number" | "boolean";
  default?: any;
};

// BASE
export type PodCleanOpts<TConfig> = {
  config: TConfig;
  wsRoot: string;
};

// EXPORT
export type ExportPodRawConfig = {
  dest?: string;
};
export type ExportPodCleanConfig = {
  dest: URI;
};
export type ExportPodPlantOpts<TConfig> = {
  wsRoot: string;
  vaults: DVault[];
  engine: DEngineClientV2;
  config: TConfig;
};
export type ExportPodExecuteOpts<TConfig extends ExportPodRawConfig> = {
  config: TConfig;
  engine: DEngineClientV2;
  wsRoot: string;
  vaults: DVault[];
};

// IMPORT
export type ImportPodRawConfig = {
  src?: string;
};
export type ImportPodCleanConfig = {
  src: URI;
};
export type ImportPodPlantOpts<TConfig> = {
  wsRoot: string;
  vaults: DVault[];
  engine: DEngineClientV2;
  config: TConfig;
};
export type ImportPodExecuteOpts<TConfig extends ImportPodRawConfig> = {
  config: TConfig;
  engine: DEngineClientV2;
  wsRoot: string;
  vaults: DVault[];
};

export abstract class ExportPod<
  TConfigRaw extends ExportPodRawConfig,
  TConfigClean extends ExportPodCleanConfig,
  TOutput = any
> {
  abstract clean(
    opts: PodCleanOpts<Partial<TConfigRaw>>
  ): Promise<TConfigClean>;
  abstract plant(opts: ExportPodPlantOpts<TConfigClean>): Promise<any>;

  async execute(opts: ExportPodExecuteOpts<TConfigRaw>): Promise<TOutput> {
    const { config, engine, wsRoot, vaults } = opts;
    await engine.init();
    const cleanConfig = await this.clean({ config, wsRoot });
    return this.plant({ config: cleanConfig, wsRoot, vaults, engine });
  }
}

export abstract class ImportPod<
  TConfigRaw extends ImportPodRawConfig,
  TConfigClean extends ImportPodCleanConfig
> extends BasePod {
  abstract config: PodConfig[];
  abstract clean(
    opts: PodCleanOpts<Partial<TConfigRaw>>
  ): Promise<TConfigClean>;
  abstract plant(opts: ImportPodPlantOpts<TConfigClean>): Promise<any>;

  async execute(opts: ImportPodExecuteOpts<TConfigRaw>) {
    const { config, engine, wsRoot, vaults } = opts;
    await engine.init();
    const cleanConfig = await this.clean({ config, wsRoot });
    return this.plant({ config: cleanConfig, wsRoot, vaults, engine });
  }
}
