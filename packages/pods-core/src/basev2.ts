import {
  BasePodExecuteOpts,
  DendronError,
  DEngineClientV2,
  DPod,
  DVault,
  NotePropsV2,
  PodConfig,
} from "@dendronhq/common-all";
import _ from "lodash";
import { createLogger, DLogger, resolvePath } from "@dendronhq/common-server";
import { URI } from "vscode-uri";
import fs from "fs-extra";
import { PodKind } from "./types";

export abstract class BasePod<TConfig> implements DPod<TConfig> {
  public L: DLogger;

  constructor() {
    this.L = createLogger("PodLogger");
  }
  abstract config: PodConfig[];
  abstract execute(opts: BasePodExecuteOpts<TConfig>): Promise<any>;

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
// EXPORT

export type ExportPodCleanOpts<TConfig> = {
  config: TConfig & ExportPodCleanConfig;
  wsRoot: string;
};

export type ExportPodRawConfig = {
  dest?: string;
  includeBody?: boolean;
  includeStubs?: boolean;
};
export type ExportPodCleanConfig = {
  dest: URI;
  includeBody: boolean;
  includeStubs: boolean;
};
export type ExportPodPrepareOpts<TConfig extends ExportPodCleanConfig> = {
  engine: DEngineClientV2;
  config: TConfig;
};

export type ExportPodPlantOpts<TConfig> = {
  wsRoot: string;
  vaults: DVault[];
  engine: DEngineClientV2;
  config: TConfig;
};
export type ExportPodExecuteOpts<TConfig> = BasePodExecuteOpts<
  TConfig & ExportPodRawConfig
>;

// IMPORT
export type ImportPodRawConfig = {
  src?: string;
};
export type ImportPodCleanConfig = {
  src: URI;
};
export type ImportPodCleanOpts<TConfig> = {
  config: TConfig & ImportPodCleanConfig;
  wsRoot: string;
};
export type ImportPodPlantOpts<TConfig> = {
  wsRoot: string;
  vaults: DVault[];
  engine: DEngineClientV2;
  config: TConfig;
};
export type ImportPodExecuteOpts<TConfig> = BasePodExecuteOpts<
  TConfig & ImportPodRawConfig
>;

export abstract class ExportPod<
  TConfigRaw extends ExportPodRawConfig,
  TConfigClean extends ExportPodCleanConfig,
  TOutput = any
> extends BasePod<TConfigRaw & ExportPodRawConfig> {
  static kind: PodKind = "export";
  get config(): PodConfig[] {
    return [
      {
        key: "dest",
        description: "where to export to",
        type: "string" as const,
      },
    ];
  }

  abstract clean(opts: ExportPodCleanOpts<TConfigRaw>): Promise<TConfigClean>;

  abstract plant(opts: ExportPodPlantOpts<TConfigClean>): Promise<any>;

  cleanExportConfig({
    wsRoot,
    config,
  }: {
    config: ExportPodRawConfig;
    wsRoot: string;
  }): ExportPodCleanConfig {
    const { includeBody, includeStubs } = _.defaults(config, {
      includeBody: true,
      includeStubs: false,
    });
    let dest = this.getPodPath({ fpath: config.dest, wsRoot, pathKey: "dest" });
    return {
      dest,
      includeBody,
      includeStubs,
    };
  }

  preareNotesForExport({
    config,
    notes,
  }: {
    config: ExportPodCleanConfig;
    notes: NotePropsV2[];
  }) {
    const hideBody = config.includeBody ? false : true;
    if (!config.includeStubs) {
      notes = _.reject(notes, { stub: true });
    }
    if (hideBody) {
      notes = notes.map((ent) => ({ ...ent, body: "" }));
    }
    return notes;
  }

  async execute(opts: ExportPodExecuteOpts<TConfigRaw>): Promise<TOutput> {
    const { config, engine, wsRoot, vaults } = opts;
    const _config = this.cleanExportConfig({ config, wsRoot });
    const cleanConfig = await this.clean({
      config: { ...config, ..._config },
      wsRoot,
    });
    return this.plant({ config: cleanConfig, wsRoot, vaults, engine });
  }
}

export abstract class ImportPod<
  TConfigRaw,
  TConfigClean extends ImportPodCleanConfig
> extends BasePod<TConfigRaw & ImportPodRawConfig> {
  static kind: PodKind = "import";

  get config(): PodConfig[] {
    return [
      {
        key: "src",
        description: "where to import from",
        type: "string" as const,
      },
    ];
  }

  abstract clean(opts: ImportPodCleanOpts<TConfigRaw>): Promise<TConfigClean>;

  abstract plant(opts: ImportPodPlantOpts<TConfigClean>): Promise<any>;

  cleanImportConfig({
    wsRoot,
    config,
  }: {
    config: ImportPodRawConfig;
    wsRoot: string;
  }): ImportPodCleanConfig {
    let src = this.getPodPath({ fpath: config.src, wsRoot, pathKey: "src" });
    if (!fs.existsSync(src.fsPath)) {
      throw new DendronError({
        friendly: `no snapshot found at ${src.fsPath}`,
      });
    }
    return {
      src,
    };
  }

  async execute(opts: ImportPodExecuteOpts<TConfigRaw>) {
    const { config, engine, wsRoot, vaults } = opts;
    const _config = this.cleanImportConfig({ config, wsRoot });
    const cleanConfig = await this.clean({
      config: { ...config, ..._config },
      wsRoot,
    });
    return this.plant({ config: cleanConfig, wsRoot, vaults, engine });
  }
}

export type PublishPodRawConfig = {
  fname: string;
  dest?: string;
};
export type PublishPodCleanConfig = {
  fname: string;
  dest: URI | "stdout";
};
export type PublishPodCleanOpts<TConfig> = {
  config: TConfig & PublishPodCleanConfig;
  wsRoot: string;
};
export type PublishPodPlantOpts = {};

export type PublishPodExecuteOpts<TConfigRaw> = BasePodExecuteOpts<
  TConfigRaw
> & { fname: string };

export abstract class PublishPod<
  TConfigRaw extends PublishPodRawConfig = PublishPodRawConfig,
  TConfigClean extends PublishPodCleanConfig = PublishPodCleanConfig
> extends BasePod<TConfigRaw & PublishPodRawConfig> {
  static kind: PodKind = "publish";

  get config(): PodConfig[] {
    return [
      {
        key: "dest",
        description: "where to export to",
        type: "string" as const,
        default: "stdout",
      },
      {
        key: "fname",
        description: "where to export to",
        type: "string" as const,
      },
    ];
  }

  async clean(opts: PublishPodCleanOpts<TConfigRaw>): Promise<TConfigClean> {
    return opts.config as any;
  }

  abstract plant(opts: BasePodExecuteOpts<TConfigClean>): Promise<any>;

  cleanPublishConfig({
    wsRoot,
    config,
  }: {
    config: PublishPodRawConfig;
    wsRoot: string;
  }): PublishPodCleanConfig {
    let dest: URI | "stdout";
    if (config.dest === "stdout") {
      dest = "stdout" as const;
    } else {
      dest = this.getPodPath({ fpath: config.dest, wsRoot, pathKey: "src" });
      if (!fs.existsSync(dest.fsPath)) {
        throw new DendronError({
          friendly: `no snapshot found at ${dest.fsPath}`,
        });
      }
    }
    return {
      dest,
      fname: config.fname,
    };
  }

  async execute(opts: BasePodExecuteOpts<TConfigRaw>) {
    const { config, engine, wsRoot, vaults } = opts;
    const _config = this.cleanPublishConfig({ config, wsRoot });
    const cleanConfig = await this.clean({
      config: { ...config, ..._config },
      wsRoot,
    });
    return this.plant({ config: cleanConfig, wsRoot, vaults, engine });
  }
}
