import fs from "fs-extra";
import _ from "lodash";
import { ExportPod, ExportPodPlantOpts } from "../basev3";
import { ExportPodConfig } from "../basev3";
import { Time } from "@dendronhq/common-all";
import { NoteProps } from "packages/common-all/src/types";
import path from "path";
import { URI } from "vscode-uri";
import Airtable from "airtable";

const ID = "dendron.airtable";

type AirtableExportPodCustomOpts = {
  tableName: string;
  srcHierarchy: string;
  apiKey: string;
  baseId: string;
  srcFieldMapping: any;
};

export type AirtableExportConfig = ExportPodConfig &
  AirtableExportPodCustomOpts;

type AirtableExportPodProcessProps = AirtableExportPodCustomOpts & {
  filteredNotes: NoteProps[];
  checkpoint: string;
};

export class AirtableExportPod extends ExportPod<AirtableExportConfig> {
  static id: string = ID;
  static description: string = "export notes to airtable";

  get config() {
    return super.config.concat([
      {
        key: "tableName",
        description: "Name of the airtable",
        type: "string",
      },
      {
        key: "srcHierarchy",
        description: "The src .md file from where to start the sync",
        type: "string",
      },
      {
        key: "apiKey",
        description: "Api key for airtable",
        type: "string",
      },
      {
        key: "baseId",
        description: " base Id of airtable base",
        type: "string",
      },
      {
        key: "srcFieldMapping",
        description: "mapping of airtable fields with the note",
        type: "object",
      },
    ]);
  }

  notesToSrcFieldMap(notes: NoteProps[], srcFieldMapping: any) {
    const data: any[] = notes.map((note) => {
      let fields = {};
      for (const [key, value] of Object.entries(srcFieldMapping)) {
        fields = {
          ...fields,
          [key]: _.get(note, `${value}`).toString(),
        };
      }
      return { fields };
    });
    return data;
  }

  async processNote(opts: AirtableExportPodProcessProps) {
    const {
      filteredNotes,
      apiKey,
      baseId,
      tableName,
      checkpoint,
      srcFieldMapping,
    } = opts;

    const records = this.notesToSrcFieldMap(filteredNotes, srcFieldMapping);
    const base = new Airtable({ apiKey }).base(baseId);

    try {
      const result = await base(tableName).create(records);
      if (result) {
        const timestamp = Time.now().toMillis();
        fs.writeFileSync(checkpoint, timestamp.toString(), {
          encoding: "utf8",
        });
      }
    } catch (error) {
      throw Error(error);
    }
  }

  verifyDir(dest: URI) {
    const basePath = path.dirname(dest.fsPath);
    const checkpoint = path.join(
      basePath,
      "pods",
      ID,
      "airtable-pod.lastupdate",
      "checkpoint.txt"
    );
    fs.ensureDirSync(path.dirname(checkpoint));
    return checkpoint;
  }

  filterNotes(notes: NoteProps[], srcHierarchy: string) {
    return notes.filter((note) => note.fname.includes(srcHierarchy));
  }

  async plant(opts: ExportPodPlantOpts) {
    const { notes, config, dest } = opts;
    const { apiKey, baseId, tableName, srcFieldMapping, srcHierarchy } =
      config as AirtableExportConfig;
    const checkpoint: string = this.verifyDir(dest);

    if (_.isUndefined(srcHierarchy) || _.isEmpty(srcHierarchy)) {
      throw Error("srcHierarchy cannot be empty");
    }
    let filteredNotes: NoteProps[] =
      srcHierarchy === "root" ? notes : this.filterNotes(notes, srcHierarchy);

    if (fs.existsSync(checkpoint)) {
      const lastUpdatedTimestamp: number = Number(
        fs.readFileSync(checkpoint, { encoding: "utf8" })
      );
      filteredNotes = filteredNotes.filter(
        (note) => note.created > lastUpdatedTimestamp
      );
    }

    if (filteredNotes.length > 0) {
      await this.processNote({
        filteredNotes,
        apiKey,
        baseId,
        tableName,
        srcFieldMapping,
        srcHierarchy,
        checkpoint,
      });
    } else {
      throw Error(
        "No new Records to sync in selected hierarchy. Create new file and then try"
      );
    }

    return { notes };
  }
}
