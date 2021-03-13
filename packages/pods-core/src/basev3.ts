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

    const vault = VaultUtils.getVaultByName({
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
};
export type ImportPodExecuteOpts<T extends ImportPodConfig = any> = PodOpts<T>;

export type ImportPodPlantOpts<T extends ImportPodConfig = any> = Omit<
  ImportPodExecuteOpts<T>,
  "src"
> & { src: URI; vault: DVault };

export abstract class ImportPod<T extends ImportPodConfig = any> {
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
        key: "ignore",
        description: "whether to ignore a given file",
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

  async execute(opts: ImportPodExecuteOpts<T>) {
    const { config, engine } = opts;
    const { src, vaultName, concatenate } = _.defaults(config, {
      concatenate: false,
    });

    // validate config
    if (_.isUndefined(src)) {
      throw new DendronError({ msg: "no src specified" });
    }
    if (_.isUndefined(vaultName)) {
      throw new DendronError({ msg: "no vaultName specified" });
    }
    if (concatenate && _.isUndefined(config?.destName)) {
      throw new DendronError({
        msg: "destName must be specified if concatenate is enabled",
      });
    }

    const vault = VaultUtils.getVaultByName({
      vaults: engine.vaultsv3,
      vname: vaultName,
    });
    const srcURL = URI.file(resolvePath(src, engine.wsRoot));
    this.L.info({ msg: "pre:plant", src: srcURL.fsPath });
    const out = await this.plant({ ...opts, src: srcURL, vault });
    this.L.info({ msg: "post:plant", src: srcURL.fsPath });
    return out;
  }
  abstract plant(opts: ImportPodPlantOpts<T>): Promise<NotePropsV2[]>;
}
