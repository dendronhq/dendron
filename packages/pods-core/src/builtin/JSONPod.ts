import { Note, NoteRawProps } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import { URI } from "vscode-uri";
import {
  ExportConfig,
  ExportPod,
  ExportPodBaseV2,
  ExportPodOpts,
  ImportConfig,
  ImportPodBaseV2,
  ImportPodOpts,
  PodConfigEntry,
} from "../base";

const ID = "dendron.pod.json";

export type ImportPodConfig = ImportConfig & {
  concatenate: boolean;
  destName?: string;
};

export class JSONImportPod extends ImportPodBaseV2<ImportPodConfig> {
  static id: string = ID;
  static description: string = "import to json";

  static config = (): PodConfigEntry[] => {
    return [
      {
        key: "src",
        description: "where will notes be imported from",
        type: "string",
      },
      {
        key: "concatenate",
        description:
          "concatenate all entries into one note? if set to true, need to set `destName`",
        type: "boolean",
        default: false,
      },
      {
        key: "destName",
        description:
          "if `concatenate: true`, specify name of concatenated note",
        type: "string",
      },
    ];
  };

  async plant(opts: ImportPodOpts<ImportPodConfig>): Promise<void> {
    const cleanConfig = this.cleanConfig(opts.config);
    await this.prepare(opts);
    await this.execute({ ...opts.config, ...cleanConfig });
  }

  async execute(opts: { src: URI } & Omit<ImportPodConfig, "src">) {
    const ctx = "JSONPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { src, destName, concatenate } = opts;
    const entries = fs.readJSONSync(src.fsPath);
    const notes = await this._entries2Notes(entries, { destName, concatenate });
    return Promise.all(
      _.map(notes, (n) => this.engine.write(n, { newNode: true }))
    );
  }

  async _entries2Notes(
    entries: Partial<NoteRawProps>[],
    opts: Pick<ImportPodConfig, "concatenate" | "destName">
  ): Promise<Note[]> {
    const notes = _.map(entries, (ent) => {
      if (!ent.fname) {
        throw Error("fname not defined");
      }
      let fname = ent.fname;
      return new Note({ ...ent, fname, parent: null, children: [] });
    });
    if (opts.concatenate) {
      if (!opts.destName) {
        throw Error(
          "destname needs to be specified if concatenate is set to true"
        );
      }
      const acc: string[] = [""];
      _.forEach(notes, (n) => {
        acc.push(`# ${n.fname}`);
        acc.push(n.renderBody());
        acc.push("---");
      });
      return [new Note({ fname: opts.destName, body: acc.join("\n") })];
    } else {
      return notes;
    }
  }
}

export class JSONExportPod extends ExportPodBaseV2
  implements ExportPod<ExportConfig> {
  static id: string = ID;
  static description: string = "export to json";

  static config = (): PodConfigEntry[] => {
    return [
      {
        key: "dest",
        description: "where will output be stored",
        type: "string",
      },
    ];
  };

  async plant(opts: ExportPodOpts<ExportConfig>): Promise<void> {
    return new Promise(async (resolve) => {
      await this.initEngine();
      const cleanConfig = this.cleanConfig(opts.config);
      const payload = this.prepareForExport(opts);
      const destPath = cleanConfig.dest.fsPath;
      fs.writeJSONSync(destPath, payload, { encoding: "utf8" });
      resolve();
    });
  }
}
