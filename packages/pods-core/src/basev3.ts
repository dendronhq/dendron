import {
  DEngineClientV2,
  NotePropsV2,
  NoteUtilsV2,
  PodConfig,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { PodKind } from "./types";

export type PodOpts<T> = {
  engine: DEngineClientV2;
  config: T;
} & WorkspaceOpts;

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

  execute(opts: PublishPodExecuteOpts<T>) {
    const { config, engine } = opts;
    const { fname, vaultName } = config;
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
