import {
  DateTime,
  DendronError,
  DEngineClient,
  ErrorUtils,
  ERROR_SEVERITY,
  minimatch,
  NoteProps,
  StatusCodes,
} from "@dendronhq/common-all";
import { LinkUtils } from "@dendronhq/engine-server";
import Airtable, { FieldSet } from "airtable";
import { Records } from "airtable/lib/records";
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
  noCheckpointing?: boolean;
};

type SrcFieldMapping =
  | {
      to: string;
      type: "string" | "date" | "singleTag";
      filter?: string;
    }
  | string;

type AirtableFieldsMap = { fields: { [key: string]: string | number } };

export type AirtableExportConfig = ExportPodConfig &
  AirtableExportPodCustomOpts;

type AirtableExportPodProcessProps = AirtableExportPodCustomOpts & {
  filteredNotes: NoteProps[];
  checkpoint: string;
};

class AirtableUtils {
  static checkNoteHasAirtableId(note: NoteProps): boolean {
    return !_.isUndefined(_.get(note.custom, "airtableId"));
  }

  static getAirtableIdFromNote(note: NoteProps): string {
    return _.get(note.custom, "airtableId");
  }

  static async chunkAndCall(
    allRecords: AirtableFieldsMap[],
    func: (record: any[]) => Promise<Records<FieldSet>>
  ) {
    const chunks = _.chunk(allRecords, 10);

    let total: number = 0;
    const out = await Promise.all(
      chunks.flatMap(async (record) => {
        // @ts-ignore
        await limiter.removeTokens(1);
        const data = JSON.stringify({ records: record });
        try {
          const _records = await func(record);
          total = total + _records.length;
          return _records;
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
          throw _error;
        }
      })
    );
    return _.flatten(out);
  }
}

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
        noCheckpointing: {
          type: "boolean",
          description: "turn off checkpointing",
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
    const recordSets: {
      create: AirtableFieldsMap[];
      update: (AirtableFieldsMap & { id: string })[];
      lastCreated: number;
      lastUpdated: number;
    } = {
      create: [],
      update: [],
      lastCreated: -1,
      lastUpdated: -1,
    };
    notes.map((note) => {
      // TODO: optimize, don't parse if no hashtags
      let hashtags = LinkUtils.findHashTags({ links: note.links });
      let fields = {};
      for (const [key, fieldMapping] of Object.entries<SrcFieldMapping>(
        srcFieldMapping
      )) {
        // handle legacy mapping
        if (_.isString(fieldMapping)) {
          const val = _.get(note, `${fieldMapping}`);
          if (_.isUndefined(val)) {
            return;
          }
          fields = {
            ...fields,
            [key]: val.toString(),
          };
        } else {
          let val = _.get(note, fieldMapping.to);
          if (fieldMapping.type === "date") {
            if (_.isNumber(val)) {
              val = DateTime.fromMillis(val).toLocaleString(
                DateTime.DATETIME_FULL
              );
            }
          }
          if (fieldMapping.type === "singleTag") {
            if (!_.isUndefined(fieldMapping.filter)) {
              hashtags = hashtags.filter((t) =>
                minimatch(t.value, fieldMapping.filter!)
              );
            }
            if (hashtags.length > 1) {
              throw new DendronError({
                message: `singleTag field has multiple values: ${JSON.stringify(
                  hashtags
                )}`,
              });
            }
            if (hashtags.length === 0) {
              return;
            }
            val = hashtags[0].value.replace(/^tags./, "");
          } else {
            // no value found
            if (!val) {
              return;
            }
            val = val.toString();
          }
          fields = {
            ...fields,
            [key]: val,
          };
        }
      }
      if (AirtableUtils.checkNoteHasAirtableId(note)) {
        recordSets.update.push({
          fields,
          id: AirtableUtils.getAirtableIdFromNote(note),
        });
      } else {
        recordSets.create.push({ fields });
      }
      if (note.created > recordSets.lastCreated) {
        recordSets.lastCreated = note.created;
      }
      if (note.updated > recordSets.lastUpdated) {
        recordSets.lastCreated = note.updated;
      }
      return;
    });
    return recordSets;
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

    const { create, update, lastCreated } = this.notesToSrcFieldMap(
      filteredNotes,
      srcFieldMapping
    );

    const base = new Airtable({ apiKey }).base(baseId);
    const createRequest = _.isEmpty(create)
      ? []
      : await AirtableUtils.chunkAndCall(create, base(tableName).create);
    const updateRequest = _.isEmpty(update)
      ? []
      : await AirtableUtils.chunkAndCall(update, base(tableName).update);

    if (checkpoint) {
      fs.writeFileSync(checkpoint, lastCreated.toString(), {
        encoding: "utf8",
      });
    }

    return { created: createRequest, updated: updateRequest };
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
    const { notes, config, dest, engine } = opts;
    const {
      apiKey,
      baseId,
      tableName,
      srcFieldMapping,
      srcHierarchy,
      noCheckpointing,
    } = config as AirtableExportConfig;

    const ctx = "plant";
    const checkpoint: string = this.verifyDir(dest);

    let filteredNotes: NoteProps[] =
      srcHierarchy === "root" ? notes : this.filterNotes(notes, srcHierarchy);
    filteredNotes = _.orderBy(filteredNotes, ["created"], ["asc"]);

    // unless disabled, only process notes that haven't already been processed
    if (!noCheckpointing) {
      if (fs.existsSync(checkpoint)) {
        const lastUpdatedTimestamp: number = Number(
          fs.readFileSync(checkpoint, { encoding: "utf8" })
        );
        filteredNotes = filteredNotes.filter(
          (note) => note.created > lastUpdatedTimestamp
        );
      }
    }

    if (filteredNotes.length > 0) {
      const { created, updated } = await this.processNote({
        filteredNotes,
        apiKey,
        baseId,
        tableName,
        srcFieldMapping,
        srcHierarchy,
        checkpoint,
      });
      await this.updateAirtableIdForNewlySyncedNotes({
        records: created,
        engine,
      });
      this.L.info({
        ctx,
        created: created.length,
        updated: updated.length,
        msg: "finish export",
      });
    } else {
      throw new DendronError({
        message:
          "No new Records to sync in selected hierarchy. Create new file and then try",
      });
    }

    return { notes };
  }

  async updateAirtableIdForNewlySyncedNotes({
    records,
    engine,
  }: {
    records: Records<FieldSet>;
    engine: DEngineClient;
  }) {
    const out = await Promise.all(
      records.map(async (ent) => {
        const airtableId = ent.id;
        const dendronId = ent.fields["DendronId"] as string;
        const note = engine.notes[dendronId];
        const noteAirtableId = _.get(note.custom, "airtableId");
        if (!noteAirtableId) {
          const updatedNote = {
            ...note,
            custom: { ...note.custom, airtableId },
          };
          console.log(updatedNote);
          const out = await engine.writeNote(updatedNote, {
            updateExisting: true,
          });
          return out;
        }
        return undefined;
      })
    );
    this.L.info({
      msg: `${out.filter((n) => !_.isUndefined(n)).length} notes updated`,
    });
  }
}
