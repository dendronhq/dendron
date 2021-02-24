import {
  DEngineClientV2,
  NotePropsV2,
  NoteUtilsV2,
  PodConfig,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { PodKind } from "./types";

export type PodOptsV3<T> = {
  engine: DEngineClientV2;
  config: T;
} & WorkspaceOpts;

export type PublishPodExecuteOptsV3<
  T extends PublishPodConfigV3 = any
> = PodOptsV3<T>;

export type PublishPodPlantOptsV3<
  T extends PublishPodConfigV3 = any
> = PublishPodExecuteOptsV3<T> & { note: NotePropsV2 };

export type PublishPodConfigV3 = {
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

// enum PublishPodDestType {
//   STDOUT = "stdout",
//   FILE = "file",
// }

export abstract class PublishPodV3<T extends PublishPodConfigV3 = any> {
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

  execute(opts: PublishPodExecuteOptsV3<T>) {
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

  abstract plant(opts: PublishPodPlantOptsV3<T>): Promise<string>;
}

// ===
// class MarkdownPublishPod extends PublishPod {
//   async plant(opts: PublishPodPlantOpts) {
//     const { note, engine } = opts;
//     const remark = MDUtilsV4.procFull({
//       dest: DendronASTDest.MD_DENDRON,
//       engine,
//       fname: note.fname,
//       vault: note.vault,
//     });
//     const out = remark.processSync(note.body).toString();
//     return { data: _.trim(out) };
//   }
// }

// type DevToConfig = {
//   apiKey: string;
//   canonicalUrl: string;
// };

// class DevToPublishPod extends PublishPod {
//   async plant(opts: PublishPodExecuteOpts) {
//     const { note } = opts;
//     const devToProps = note.custom.devto;
//     const canonicalUrl = "";

//     const client = new Client("Your API Key");
//     const { data } = await client.getUserByName("khaosdoctor");
//   }
// }

// async function main() {
//   const pod = new MarkdownPublishPod();
//   const note = {} as any;
//   const engine = {} as any;
//   const out = await pod.execute({
//     note,
//     engine,
//     destType: PublishPodDestType.STDOUT,
//   });

//   new DevToPublishPod().execute();
//   // await pod.plant({note, engine, dest})
// }
