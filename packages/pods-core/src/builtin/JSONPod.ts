import { DVault, NoteProps, NoteUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  ExportPod,
  ExportPodConfig,
  ExportPodPlantOpts,
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PublishPod,
  PublishPodConfig,
  PublishPodPlantOpts,
} from "../basev3";
import { JSONSchemaType } from "ajv";

const ID = "dendron.json";

export type JSONImportPodPlantOpts = ImportPodPlantOpts;

export class JSONImportPod extends ImportPod {
  static id: string = ID;
  static description: string = "import json";

  get config(): JSONSchemaType<ImportPodConfig> {
    return {
      type: "object",
      additionalProperties: false,
      required: ["src", "vaultName"],
      properties: {
        src: {
          description: "Where to import from",
          type: "string",
        },
        vaultName: {
          description: "name of vault to import into",
          type: "string",
        },
        concatenate: {
          description: "whether to concatenate everything into one note",
          type: "boolean",
          nullable: true,
        },
        frontmatter: {
          description: "frontmatter to add to each note",
          type: "object",
          nullable: true,
        },
        fnameAsId: {
          description: "use the file name as the id",
          type: "boolean",
          nullable: true,
        },
        destName: {
          description: "If concatenate is set, name of destination path",
          type: "string",
          nullable: true,
        },
        ignore: {
          type: "boolean",
          nullable: true,
        },
      },
    };
  }

  async plant(opts: JSONImportPodPlantOpts) {
    const ctx = "JSONPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { engine, vault, src } = opts;
    const { destName, concatenate } = opts.config;
    const entries = fs.readJSONSync(src.fsPath);
    const notes = await this._entries2Notes(entries, {
      vault,
      destName,
      concatenate,
    });
    await Promise.all(
      _.map(notes, (n) => engine.writeNote(n, { newNode: true }))
    );
    return notes;
  }

  async _entries2Notes(
    entries: Partial<NoteProps>[],
    opts: Pick<ImportPodConfig, "concatenate" | "destName"> & {
      vault: DVault;
    }
  ): Promise<NoteProps[]> {
    const { vault } = opts;
    const notes = _.map(entries, (ent) => {
      if (!ent.fname) {
        throw Error("fname not defined");
      }
      let fname = ent.fname;
      return NoteUtils.create({ ...ent, fname, vault });
    });
    if (opts.concatenate) {
      if (!opts.destName) {
        throw Error(
          "destname needs to be specified if concatenate is set to true"
        );
      }
      const acc: string[] = [""];
      _.forEach(notes, (n) => {
        acc.push(`# [[${n.fname}]]`);
        acc.push(n.body);
        acc.push("---");
      });
      return [
        NoteUtils.create({
          fname: opts.destName,
          body: acc.join("\n"),
          vault,
        }),
      ];
    } else {
      return notes;
    }
  }
}

export class JSONPublishPod extends PublishPod<PublishPodConfig> {
  static id: string = ID;
  static description: string = "publish json";

  async plant(opts: PublishPodPlantOpts) {
    const note = opts.note;
    const out = JSON.stringify(note, null, 4);
    return out;
  }
}

export class JSONExportPod extends ExportPod {
  static id: string = ID;
  static description: string = "export notes as json";

  get config(): JSONSchemaType<ExportPodConfig> {
    return {
      type: "object",
      additionalProperties: false,
      required: ["dest"],
      properties: {
        dest: { type: "string", description: "Where to export to" },
        includeBody: {
          type: "boolean",
          default: true,
          description: "should body be included",
          nullable: true,
        },
        includeStubs: {
          type: "boolean",
          description: "should stubs be included",
          nullable: true,
        },
        ignore: { type: "array", items: { type: "string" }, nullable: true },
      },
    };
  }

  async plant(opts: ExportPodPlantOpts) {
    const { dest, notes } = opts;

    // verify dest exist
    const podDstPath = dest.fsPath;
    fs.ensureDirSync(path.dirname(podDstPath));

    fs.writeJSONSync(podDstPath, notes, { encoding: "utf8" });
    return { notes };
  }
}
