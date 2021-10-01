import {
  DendronError,
  ErrorUtils,
  ERROR_SEVERITY,
  NoteProps,
  StatusCodes,
  axios,
  DateTime,
  DUtils,
} from "@dendronhq/common-all";
import { JSONSchemaType } from "ajv";
import fs from "fs-extra";
import { RateLimiter } from "limiter";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { ExportPod, ExportPodConfig, ExportPodPlantOpts } from "../basev3";
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
  srcFieldMapping: { [key: string]: SrcFieldMapping };
};

type SrcFieldMapping =
  | {
      to: string;
      type: "string" | "date";
    }
  | string;

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
  notesToSrcFieldMap(
    notes: NoteProps[],
    srcFieldMapping: { [key: string]: SrcFieldMapping }
  ) {
    const data: any[] = notes.map((note) => {
      let fields = {};
      for (const [key, fieldMapping] of Object.entries<SrcFieldMapping>(
        srcFieldMapping
      )) {
        // handle legacy mapping
        if (_.isString(fieldMapping)) {
          fields = {
            ...fields,
            [key]: _.get(note, `${fieldMapping}`).toString(),
          };
        } else {
          console.log("parse fieldMapping");
          let val = _.get(note, fieldMapping.to);
          if (fieldMapping.type === "date") {
            console.log("parse date");
            if (_.isNumber(val)) {
              console.log("parse numeric date");
              val = DateTime.fromMillis(val).toLocaleString(
                DateTime.DATETIME_FULL
              );
            }
          }
          fields = {
            ...fields,
            [key]: val.toString(),
          };
        }
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
      return Promise.all(
        chunks.map(async (record) => {
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
            let payload: any = { data };
            let _error: DendronError;
            if (ErrorUtils.isAxiosError(error)) {
              payload = error.toJSON();
              if (
                error.response?.data &&
                error.response.status === StatusCodes.UNPROCESSABLE_ENTITY
              ) {
                payload = _.merge(payload, error.response.data);
                _error = new DendronError({
                  message: error.response.data.message,
                  payload,
                  severity: ERROR_SEVERITY.MINOR,
                });
              } else {
                _error = new DendronError({ message: "axios error", payload });
              }
            } else {
              payload = _.merge(payload, error);
              _error = new DendronError({ message: "general error", payload });
            }
            this.L.error({
              msg: "failed to export all the notes.",
              payload,
            });
            throw _error;
          }
        })
      );
    };
    await sendRequest();
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
