import {
  DendronError,
  DEngineClientV2,
  DVault,
  NotePropsV2,
  NoteUtilsV2,
  PodConfig,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { createLogger, DLogger, resolvePath } from "@dendronhq/common-server";
import _ from "lodash";
import { URI } from "vscode-uri";
import { PodKind } from "./types";

export type PodOpts<T> = {
  engine: DEngineClientV2;
  config: T;
} & WorkspaceOpts;

// === Publish Pod

export type PublishPodExecuteOpts<T extends PublishPodConfig = any> = PodOpts<
  T
>;

export type PublishPodPlantOpts<
  T extends PublishPodConfig = any
> = PublishPodExecuteOpts<T> & { note: NotePropsV2 };

export type PublishPodConfig = {
  /**
   *  Name of file to publish
   */
  fname: string;
  /**
   * Name of vault
   */
  vaultName: string;
  /**
   * Where to write output to
   */
  dest: string | "stdout";
};

export abstract class PublishPod<T extends PublishPodConfig = any> {
  static kind = "publish" as PodKind;

  get config(): PodConfig[] {
    return [
      {
        key: "fname",
        description: "name of src file",
        type: "string" as const,
      },
      {
        key: "vaultName",
        description: "name of src vault",
        type: "string" as const,
      },
      {
        key: "dest",
        description: "where to export to",
        type: "string" as const,
      },
    ];
  }

  async execute(opts: PublishPodExecuteOpts<T>) {
    const { config, engine } = opts;
    const { fname, vaultName } = config;
    if (_.isUndefined(vaultName)) {
      throw new DendronError({ msg: "no vaultName" });
    }
    if (_.isUndefined(fname)) {
      throw new DendronError({ msg: "no fname" });
    }

    const vault = VaultUtils.getVaultByNameOrThrow({
      vaults: engine.vaultsv3,
      vname: vaultName,
    });
    const note = NoteUtilsV2.getNoteByFnameV5({
      fname,
      notes: engine.notes,
      vault: vault!,
      wsRoot: engine.wsRoot,
    });
    if (!note) {
      throw Error("no note found");
    }
    return this.plant({ ...opts, note });
  }

  abstract plant(opts: PublishPodPlantOpts<T>): Promise<string>;
}

// === Import Pod

export type ImportPodConfig = {
  /**
   * Where to import from
   */
  src: string;
  /**
   * Name of vault
   */
  vaultName: string;
  concatenate?: boolean;
  destName?: string;
  ignore?: boolean;
  frontmatter?: any;
  fnameAsId?: boolean;
};
export type ImportPodExecuteOpts<
  T extends ImportPodConfig = ImportPodConfig
> = PodOpts<T>;

export type ImportPodPlantOpts<
  T extends ImportPodConfig = ImportPodConfig
> = Omit<ImportPodExecuteOpts<T>, "src"> & { src: URI; vault: DVault };

export abstract class ImportPod<T extends ImportPodConfig = ImportPodConfig> {
  public L: DLogger;
  static kind = "import" as PodKind;
  get config(): PodConfig[] {
    return [
      {
        key: "src",
        description: "Where to import from",
        type: "string" as const,
        required: true,
      },
      {
        key: "vaultName",
        description: "name of vault to import into",
        type: "string" as const,
        required: true,
      },
      {
        key: "concatenate",
        description: "whether to concatenate everything into one note",
        type: "boolean",
      },
      {
        key: "frontmatter",
        description: "frontmatter to add to each note",
        type: "object",
      },
      {
        key: "fnameAsId",
        description: "use the file name as the id",
        type: "boolean",
      },
      {
        key: "destName",
        description: "If concatenate is set, name of destination path",
        type: "string" as const,
      },
    ];
  }
  constructor() {
    this.L = createLogger("ImportPod");
  }

  validate(config: Partial<T>) {
    const { src, vaultName, concatenate } = _.defaults(config, {
      concatenate: false,
    });
    const configJSON = JSON.stringify(config);
    if (_.isUndefined(src)) {
      throw new DendronError({
        msg: `no src specified. config: ${configJSON}`,
      });
    }
    if (_.isUndefined(vaultName)) {
      throw new DendronError({ msg: "no vaultName specified" });
    }
    if (concatenate && _.isUndefined(config?.destName)) {
      throw new DendronError({
        msg: "destName must be specified if concatenate is enabled",
      });
    }
  }

  async execute(opts: ImportPodExecuteOpts<T>) {
    const { config, engine } = opts;
    this.validate(config);
    const { src, vaultName } = _.defaults(config, {
      concatenate: false,
    });

    // validate config
    const vault = VaultUtils.getVaultByNameOrThrow({
      vaults: engine.vaultsv3,
      vname: vaultName,
    });
    const srcURL = URI.file(resolvePath(src, engine.wsRoot));
    return await this.plant({ ...opts, src: srcURL, vault });
  }
  abstract plant(opts: ImportPodPlantOpts<T>): Promise<NotePropsV2[]>;
}

// === Export Pod

export type ExportPodConfig = {
  /**
   * Where to import from
   */
  dest: string;
  includeBody?: boolean;
  includeStubs?: boolean;
  ignore?: string[];
};
export type ExportPodExecuteOpts<
  T extends ExportPodConfig = ExportPodConfig
> = PodOpts<T>;

export type ExportPodPlantOpts<
  T extends ExportPodConfig = ExportPodConfig
> = Omit<ExportPodExecuteOpts<T>, "dest"> & {
  dest: URI;
  vaults: DVault[];
  notes: NotePropsV2[];
};

export abstract class ExportPod<
  T extends ExportPodConfig = ExportPodConfig,
  TData = any
> {
  public L: DLogger;
  static kind = "export" as PodKind;
  get config(): PodConfig[] {
    return [
      {
        key: "dest",
        description: "Where to export to",
        type: "string" as const,
        required: true,
      },
      {
        key: "includeBody",
        description: "should body be included",
        default: true,
        type: "boolean",
      },
      {
        key: "includeStubs",
        description: "should stubs be included",
        type: "boolean",
      },
    ];
  }
  constructor() {
    this.L = createLogger("ExportPod");
  }

  validate(config: Partial<T>) {
    const { dest } = config;
    const configJSON = JSON.stringify(config);
    if (_.isUndefined(dest)) {
      throw new DendronError({
        msg: `no dest specified. config: ${configJSON}`,
      });
    }
  }

  /**
   * Checks for some pre-sets
   * - if not `includeBody`, then fetch notes without body
   * - if not `includeStubs`, then ignore stub nodes
   */
  preareNotesForExport({
    config,
    notes,
  }: {
    config: ExportPodConfig;
    notes: NotePropsV2[];
  }) {
    const { includeBody } = _.defaults(config, { includeBody: true });
    if (!config.includeStubs) {
      notes = _.reject(notes, { stub: true });
    }
    if (!includeBody) {
      notes = notes.map((ent) => ({ ...ent, body: "" }));
    }
    return notes;
  }

  async execute(opts: ExportPodExecuteOpts<T>) {
    const { config, engine } = opts;
    this.validate(config);
    const { dest } = config;

    // validate config
    const destURL = URI.file(resolvePath(dest, engine.wsRoot));

    // parse notes into NoteProps
    const notes = this.preareNotesForExport({
      config,
      notes: _.values(engine.notes),
    });

    return await this.plant({ ...opts, dest: destURL, notes });
  }
  abstract plant(
    opts: ExportPodPlantOpts<T>
  ): Promise<{ notes: NotePropsV2[]; data?: TData }>;
}
