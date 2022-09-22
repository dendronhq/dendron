import {
  DEngineClient,
  DVault,
  minimatch,
  NoteProps,
  stringifyError,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { createLogger, DLogger, resolvePath } from "@dendronhq/common-server";
import { JSONSchemaType } from "ajv";
import { Item } from "klaw";
import _ from "lodash";
import { URI } from "vscode-uri";
import {
  GDocUtilMethods,
  NotionUtilMethods,
  PodKind,
  GithubIssueUtilMethods,
  ConflictHandler,
} from "./types";
import { PodUtils } from "./utils";

export enum PROMPT {
  USERPROMPT = "userPrompt",
}

export type PodOpts<T> = {
  engine: DEngineClient;
  config: T;
  onPrompt?: (arg0?: PROMPT) => Promise<any | undefined>;
  utilityMethods?:
    | GDocUtilMethods
    | NotionUtilMethods
    | GithubIssueUtilMethods
    | ConflictHandler;
} & WorkspaceOpts;

// === Publish Pod

export type PublishPodExecuteOpts<T extends PublishPodConfig = any> =
  PodOpts<T>;

export type PublishPodPlantOpts<T extends PublishPodConfig = any> =
  PublishPodExecuteOpts<T> & { note: NoteProps };

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

export abstract class PublishPod<
  T extends PublishPodConfig = PublishPodConfig
> {
  static kind = "publish" as PodKind;
  public L: DLogger;

  constructor() {
    this.L = createLogger("PublishPod");
  }

  abstract get config(): JSONSchemaType<T>;

  async execute(opts: PublishPodExecuteOpts<T>) {
    const { config, engine } = opts;
    const { fname, vaultName } = config;
    PodUtils.validate<T>(config, this.config);
    this.L.info({ ctx: "execute:enter", fname, vaultName });

    const vault = VaultUtils.getVaultByNameOrThrow({
      vaults: engine.vaults,
      vname: vaultName,
    });
    const note = (await engine.findNotes({ fname, vault }))[0];
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
  frontmatter?: any;
  fnameAsId?: boolean;
};
export type ImportPodExecuteOpts<T extends ImportPodConfig = ImportPodConfig> =
  PodOpts<T>;

export type ImportPodPlantOpts<T extends ImportPodConfig = ImportPodConfig> =
  Omit<ImportPodExecuteOpts<T>, "src"> & { src: URI; vault: DVault };

export abstract class ImportPod<T extends ImportPodConfig = ImportPodConfig> {
  public L: DLogger;
  static kind = "import" as PodKind;
  abstract get config(): JSONSchemaType<T>;

  constructor() {
    this.L = createLogger("ImportPod");
  }

  async execute(opts: ImportPodExecuteOpts<T>) {
    const { config, engine } = opts;
    PodUtils.validate<T>(config, this.config);
    const { src, vaultName } = _.defaults(config, {
      concatenate: false,
    });

    // validate config
    const vault = VaultUtils.getVaultByNameOrThrow({
      vaults: engine.vaults,
      vname: vaultName,
    });
    const srcURL = URI.file(resolvePath(src, engine.wsRoot));

    return this.plant({ ...opts, src: srcURL, vault });
  }
  abstract plant(
    opts: ImportPodPlantOpts<T>
  ): Promise<{ importedNotes: NoteProps[]; errors?: Item[] }>;
}

// === Export Pod

export type PodVaultConfig = {
  include?: string[];
  exclude?: string[];
};

export type ExportPodConfig = {
  /**
   * Where to export to
   */
  dest: string;
  includeBody?: boolean;
  includeStubs?: boolean;
  ignore?: string[];
  vaults?: PodVaultConfig;
};
export type ExportPodExecuteOpts<T extends ExportPodConfig = ExportPodConfig> =
  PodOpts<T>;

export type ExportPodPlantOpts<T extends ExportPodConfig = ExportPodConfig> =
  Omit<ExportPodExecuteOpts<T>, "dest"> & {
    dest: URI;
    vaults: DVault[];
    notes: NoteProps[];
    wsRoot: string;
  };

export abstract class ExportPod<
  T extends ExportPodConfig = ExportPodConfig,
  TData = any
> {
  public L: DLogger;
  static kind = "export" as PodKind;
  abstract get config(): JSONSchemaType<T>;

  constructor() {
    this.L = createLogger("ExportPod");
  }

  /**
   * Checks for some pre-sets
   * - if not `includeBody`, then fetch notes without body
   * - if not `includeStubs`, then ignore stub nodes
   */
  prepareNotesForExport({
    config,
    notes,
  }: {
    config: ExportPodConfig;
    notes: NoteProps[];
  }) {
    const { includeBody } = _.defaults(config, { includeBody: true });
    if (!config.includeStubs) {
      notes = _.reject(notes, { stub: true });
    }
    if (!includeBody) {
      notes = notes.map((ent) => ({ ...ent, body: "" }));
    }
    if (config.vaults?.exclude) {
      notes = _.reject(notes, (ent) =>
        config.vaults?.exclude?.includes(VaultUtils.getName(ent.vault))
      ) as NoteProps[];
    }
    if (config.vaults?.include) {
      notes = _.filter(notes, (ent) =>
        config.vaults?.include?.includes(VaultUtils.getName(ent.vault))
      ) as NoteProps[];
    }
    if (config.ignore) {
      notes = _.reject(notes, (ent) => {
        return _.some(config.ignore, (pat) => minimatch(ent.fname, pat));
      });
    }
    return notes;
  }

  async execute(opts: ExportPodExecuteOpts<T>) {
    const { config, engine } = opts;
    PodUtils.validate<T>(config, this.config);
    const { dest } = config;

    // validate config
    const destURL = URI.file(resolvePath(dest, engine.wsRoot));

    // parse notes into NoteProps
    const engineNotes = await engine.findNotes({ excludeStub: false });
    const notes = this.prepareNotesForExport({
      config,
      notes: engineNotes,
    });

    try {
      return await this.plant({ ...opts, dest: destURL, notes });
    } catch (err: any) {
      console.log("error", stringifyError(err));
      throw err;
    }
  }
  abstract plant(
    opts: ExportPodPlantOpts<T>
  ): Promise<{ notes: NoteProps[]; data?: TData }>;
}
