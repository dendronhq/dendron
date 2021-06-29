import fs from "fs-extra";
import _ from "lodash";
import { ExportPod, ExportPodPlantOpts } from "../basev3";
import { ExportPodConfig } from "../basev3";
import { NoteProps, DendronError } from "@dendronhq/common-all";
import path from "path";
import { URI } from "vscode-uri";
import { RateLimiter } from "limiter";
import axios from "axios";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";

const ID = "dendron.airtable";

// Allow 5 req/sec. Also understands 'hour', 'minute', 'day', or a no. of ms
// @ts-ignore
const limiter = new RateLimiter({ tokensPerInterval: 5, interval: "second" });

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

  get config(): JSONSchemaType<AirtableExportConfig> {
    return PodUtils.createExportConfig({
      required: [
        "tableName",
        "srcHierarchy",
        "baseId",
        "apiKey",
        "srcFieldMapping",
      ],
      properties: {
        tableName: { type: "string", description: "Name of the airtable" },
        srcHierarchy: {
          type: "string",
          description: "The src .md file from where to start the sync",
        },
        apiKey: {
          type: "string",
          description: "Api key for airtable",
        },
        baseId: {
          type: "string",
          description: " base Id of airtable base",
        },
        srcFieldMapping: {
          type: "object",
          description:
            "mapping of airtable fields with the note eg: {Created On: created, Notes: body}",
        },
      },
    }) as JSONSchemaType<AirtableExportConfig>;
  }

  //filters the note's property as per srcFieldMapping provided
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

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const records = this.notesToSrcFieldMap(filteredNotes, srcFieldMapping);
    const chunks = _.chunk(records, 10);

    // rate limiter method
    const sendRequest = async () => {
      let total: number = 0;
      chunks.forEach(async (record) => {
        // @ts-ignore
        await limiter.removeTokens(1);
        const data = JSON.stringify({ records: record });
        try {
          const result = await axios.post(
            `https://api.airtable.com/v0/${baseId}/${tableName}`,
            data,
            { headers: headers }
          );
          total = total + result.data.records.length;
          if (total === filteredNotes.length) {
            const timestamp = filteredNotes[filteredNotes.length - 1].created;
            fs.writeFileSync(checkpoint, timestamp.toString(), {
              encoding: "utf8",
            });
          }
        } catch (error) {
          this.L.error({
            msg: "failed to export all the notes.",
            payload: error,
          });
          throw new DendronError({ message: JSON.stringify(error) });
        }
      });
    };
    sendRequest();
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

  //filters the notes of src hierarchy given from all the notes
  filterNotes(notes: NoteProps[], srcHierarchy: string) {
    return notes.filter((note) => note.fname.includes(srcHierarchy));
  }

  async plant(opts: ExportPodPlantOpts) {
    const { notes, config, dest } = opts;
    const { apiKey, baseId, tableName, srcFieldMapping, srcHierarchy } =
      config as AirtableExportConfig;
    const checkpoint: string = this.verifyDir(dest);

    let filteredNotes: NoteProps[] =
      srcHierarchy === "root" ? notes : this.filterNotes(notes, srcHierarchy);
    filteredNotes = _.orderBy(filteredNotes, ["created"], ["asc"]);
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
      throw new DendronError({
        message:
          "No new Records to sync in selected hierarchy. Create new file and then try",
      });
    }

    return { notes };
  }
}
