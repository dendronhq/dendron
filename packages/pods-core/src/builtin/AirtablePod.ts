import Airtable, { FieldSet, Records } from "@dendronhq/airtable";
import {
  assertUnreachable,
  DendronCompositeError,
  DendronError,
  DEngineClient,
  ErrorFactory,
  ErrorUtils,
  ERROR_SEVERITY,
  IDendronError,
  isFalsy,
  NoteProps,
  NotePropsWithOptionalCustom,
  NoteUtils,
  RespV3,
  StatusCodes,
  VaultUtils,
} from "@dendronhq/common-all";
import { createLogger, DLogger } from "@dendronhq/common-server";
import { NoteMetadataUtils } from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import fs from "fs-extra";
import { RateLimiter } from "limiter";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import {
  ExportPod,
  ExportPodConfig,
  ExportPodPlantOpts,
  PublishPod,
  PublishPodConfig,
  PublishPodPlantOpts,
} from "../basev3";
import { PodUtils } from "../utils";

const ID = "dendron.airtable";

// Allow 5 req/sec. Also understands 'hour', 'minute', 'day', or a no. of ms
// @ts-ignore
const limiter = new RateLimiter({ tokensPerInterval: 5, interval: "second" });

type AirtablePodCustomOptsCommon = {
  tableName: string;
  apiKey: string;
  baseId: string;
};

type AirtableExportPodCustomOpts = AirtablePodCustomOptsCommon & {
  srcHierarchy: string;
  srcFieldMapping: { [key: string]: SrcFieldMapping };
  noCheckpointing?: boolean;
};
type AirtablePublishPodCustomOpts = AirtablePodCustomOptsCommon & {};
export type AirtableExportResp = {
  notes: NoteProps[];
  data: { created: Records<FieldSet>; updated: Records<FieldSet> };
};

export type SrcFieldMappingResp = {
  create: AirtableFieldsMap[];
  update: (AirtableFieldsMap & { id: string })[];
  lastCreated: number;
  lastUpdated: number;
};

export type SrcFieldMapping = SrcFieldMappingV2 | string;
export type SrcFieldMappingV2 =
  | SimpleSrcField
  | MultiSelectField
  | SingleSelectField
  | LinkedRecordField;

export enum SpecialSrcFieldToKey {
  TAGS = "tags",
  LINKS = "links",
}

type SimpleSrcField = {
  to: string;
  type: "string" | "date";
};

type SelectField = {
  to: SpecialSrcFieldToKey | string;
  filter?: string;
};

type SingleSelectField = {
  type: "singleSelect";
} & SelectField;

type MultiSelectField = {
  type: "multiSelect";
} & SelectField;

type LinkedRecordField = {
  type: "linkedRecord";
} & SelectField;

export type AirtableFieldsMap = { fields: { [key: string]: string | number } };

export type AirtableExportConfig = ExportPodConfig &
  AirtableExportPodCustomOpts;

export type AirtablePublishConfig = PublishPodConfig &
  AirtablePublishPodCustomOpts;

type AirtableExportPodProcessProps = AirtableExportPodCustomOpts & {
  filteredNotes: NoteProps[];
  checkpoint: string;
  engine: DEngineClient;
};

export class AirtableUtils {
  static addRequiredFields(mapping: { [key: string]: SrcFieldMapping }) {
    const _map = { ...mapping };
    _map["DendronId"] = { type: "string", to: "id" };
    return _map;
  }

  static checkNoteHasAirtableId(note: NoteProps): boolean {
    return !_.isUndefined(_.get(note.custom, "airtableId"));
  }

  static filterNotes(notes: NoteProps[], srcHierarchy: string) {
    return notes.filter((note) => note.fname.includes(srcHierarchy));
  }
  static getAirtableIdFromNote(note: NoteProps): string {
    return _.get(note.custom, "airtableId");
  }

  /***
   * Chunk all calls into records of 10 (Airtable API limit and call using limiter)
   */
  static async chunkAndCall(
    allRecords: AirtableFieldsMap[],
    func: (record: any[]) => Promise<Records<FieldSet>>
  ) {
    const chunks = _.chunk(allRecords, 10);

    // let total: number = 0;
    const out = await Promise.all(
      chunks.flatMap(async (record) => {
        // @ts-ignore
        await limiter.removeTokens(1);
        const data = JSON.stringify({ records: record });
        try {
          const _records = await func(record);
          // total += _records.length;
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

  /**
   * Maps a {@linkk SrcFieldMappingV2["type"]} to a field on {@link NoteProps}
   * @param param0
   * @returns
   */
  static handleSrcField({
    fieldMapping,
    note,
    engine,
  }: {
    fieldMapping: SrcFieldMappingV2;
    note: NoteProps;
    engine: DEngineClient;
  }): RespV3<any> {
    switch (fieldMapping.type) {
      case "string": {
        return {
          data: NoteMetadataUtils.extractString({ note, key: fieldMapping.to }),
        };
      }
      case "date": {
        return {
          data: NoteMetadataUtils.extractDate({ note, key: fieldMapping.to }),
        };
      }
      case "singleSelect": {
        if (fieldMapping.to === SpecialSrcFieldToKey.TAGS) {
          const { error, data } = NoteMetadataUtils.extractSingleTag({
            note,
            filters: fieldMapping.filter ? [fieldMapping.filter] : [],
          });
          if (error) {
            return { error };
          }
          return { data: NoteMetadataUtils.cleanTags(data ? [data] : [])[0] };
        } else {
          const data = NoteMetadataUtils.extractString({
            note,
            key: fieldMapping.to,
          });
          return { data };
        }
      }
      case "multiSelect": {
        if (fieldMapping.to === SpecialSrcFieldToKey.TAGS) {
          const tags = NoteMetadataUtils.extractTags({
            note,
            filters: fieldMapping.filter ? [fieldMapping.filter] : [],
          });
          const data = NoteMetadataUtils.cleanTags(tags);
          return { data };
        }
        const data = NoteMetadataUtils.extractArray({
          note,
          key: fieldMapping.to,
        });
        return { data };
      }
      case "linkedRecord": {
        const links = NoteMetadataUtils.extractLinks({
          note,
          filters: fieldMapping.filter ? [fieldMapping.filter] : [],
        });
        const { vaults, notes } = engine;
        const notesWithNoIds: NoteProps[] = [];
        const recordIds = links.flatMap((l) => {
          if (_.isUndefined(l.to)) {
            return;
          }
          const { fname, vaultName } = l.to;
          if (_.isUndefined(fname)) {
            return;
          }
          const vault = vaultName
            ? VaultUtils.getVaultByName({ vaults, vname: vaultName })
            : undefined;
          const _notes = NoteUtils.getNotesByFname({ fname, notes, vault });
          const _recordIds = _notes
            .map((n) => {
              const id = AirtableUtils.getAirtableIdFromNote(n);
              return {
                note: n,
                id,
              };
            })
            .filter((ent) => {
              const { id, note } = ent;
              const missingId = isFalsy(id);
              if (missingId) {
                notesWithNoIds.push(note);
              }
              return !missingId;
            });

          return _recordIds;
        });
        if (notesWithNoIds.length > 0) {
          return {
            error: ErrorFactory.createInvalidStateError({
              message: `The following notes are missing airtable ids: ${notesWithNoIds
                .map((n) => NoteUtils.toNoteLocString(n))
                .join(", ")}`,
            }),
          };
        }

        // if notesWithNoIds.length > 0 is false, then all records have ids
        return { data: recordIds.map((ent) => ent!.id) };
      }
      default:
        assertUnreachable(fieldMapping);
    }
  }

  /**
   * Maps note props to airtable calls.
   * For existing notes, checks for `airtableId` prop to see if we need to run an update vs a create
   *
   * @param opts
   * @returns
   */
  static notesToSrcFieldMap(opts: {
    notes: NoteProps[];
    srcFieldMapping: { [key: string]: SrcFieldMapping };
    logger: DLogger;
    engine: DEngineClient;
  }): RespV3<SrcFieldMappingResp> {
    const { notes, srcFieldMapping, logger, engine } = opts;
    const ctx = "notesToSrc";
    const recordSets: SrcFieldMappingResp = {
      create: [],
      update: [],
      lastCreated: -1,
      lastUpdated: -1,
    };
    const errors: IDendronError[] = [];
    notes.map((note) => {
      // TODO: optimize, don't parse if no hashtags
      let fields = {};
      logger.debug({ ctx, note: NoteUtils.toLogObj(note), msg: "enter" });
      for (const [key, fieldMapping] of Object.entries<SrcFieldMapping>(
        srcFieldMapping
      )) {
        // handle legacy mapping
        if (_.isString(fieldMapping)) {
          const val =
            _.get(note, `${fieldMapping}`) ??
            _.get(note.custom, `${fieldMapping}`);
          if (!_.isUndefined(val)) {
            fields = {
              ...fields,
              [key]: val.toString(),
            };
          }
        } else {
          const resp = this.handleSrcField({
            fieldMapping,
            note,
            engine,
          });
          if (resp.error) {
            return errors.push(resp.error);
          }

          const val = resp.data;
          if (val) {
            fields = {
              ...fields,
              [key]: val,
            };
          }
        }
      }
      if (AirtableUtils.checkNoteHasAirtableId(note)) {
        logger.debug({ ctx, noteId: note.id, msg: "updating" });
        recordSets.update.push({
          fields,
          id: AirtableUtils.getAirtableIdFromNote(note),
        });
      } else {
        logger.debug({ ctx, noteId: note.id, msg: "creating" });
        recordSets.create.push({ fields });
      }
      if (note.created > recordSets.lastCreated) {
        recordSets.lastCreated = note.created;
      }
      if (note.updated > recordSets.lastUpdated) {
        recordSets.lastCreated = note.updated;
      }
      logger.debug({ ctx, noteId: note.id, msg: "exit" });
      return;
    });

    if (!_.isEmpty(errors)) {
      return { error: new DendronCompositeError(errors) };
    }
    return { data: recordSets };
  }

  static async updateAirtableIdForNewlySyncedNotes({
    records,
    engine,
    logger,
  }: {
    records: Records<FieldSet>;
    engine: DEngineClient;
    logger: DLogger;
  }) {
    const out = await Promise.all(
      records.map(async (ent) => {
        const airtableId = ent.id;
        const dendronId = ent.fields["DendronId"] as string;
        const note = engine.notes[dendronId] as NotePropsWithOptionalCustom;
        const noteAirtableId = _.get(note.custom, "airtableId");
        if (!noteAirtableId) {
          const updatedNote = {
            ...note,
            custom: { ...note.custom, airtableId },
          };
          const out = await engine.writeNote(updatedNote, {
            updateExisting: true,
          });
          return out;
        }
        return undefined;
      })
    );
    logger.info({
      msg: `${out.filter((n) => !_.isUndefined(n)).length} notes updated`,
    });
  }
}

export class AirtablePublishPod extends PublishPod<AirtablePublishConfig> {
  static id: string = ID;
  static description: string = "publish to airtable";

  get config(): JSONSchemaType<AirtablePublishConfig> {
    return PodUtils.createPublishConfig({
      required: ["tableName", "baseId", "apiKey", "srcFieldMapping"],
      properties: {
        tableName: { type: "string", description: "Name of the airtable" },
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
    }) as JSONSchemaType<AirtablePublishConfig>;
  }

  async plant(opts: PublishPodPlantOpts) {
    const { config, note, engine } = opts;
    const { apiKey, baseId, tableName, srcFieldMapping } =
      config as AirtableExportConfig;
    const logger = createLogger("AirtablePublishPod");

    const resp = AirtableUtils.notesToSrcFieldMap({
      notes: [note],
      srcFieldMapping,
      logger,
      engine,
    });
    if (resp.error) {
      throw resp.error;
    }
    const { update, create } = resp.data;
    const base = new Airtable({ apiKey }).base(baseId);
    if (!_.isEmpty(update)) {
      const out = await base(tableName).update(update);
      return out[0].getId();
    } else {
      const created = await base(tableName).create(create);
      await AirtableUtils.updateAirtableIdForNewlySyncedNotes({
        records: created,
        engine,
        logger,
      });
      return created[0].getId();
    }
  }
}

export class AirtableExportPod extends ExportPod<
  AirtableExportConfig,
  { created: Records<FieldSet>; updated: Records<FieldSet> }
> {
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

  async processNote(opts: AirtableExportPodProcessProps) {
    const {
      filteredNotes,
      apiKey,
      baseId,
      tableName,
      checkpoint,
      srcFieldMapping,
      engine,
    } = opts;

    const resp = AirtableUtils.notesToSrcFieldMap({
      notes: filteredNotes,
      srcFieldMapping,
      logger: this.L,
      engine,
    });
    if (resp.error) {
      throw resp.error;
    }
    const { update, create, lastCreated } = resp.data;

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

  async plant(opts: ExportPodPlantOpts): Promise<AirtableExportResp> {
    const { notes, config, dest, engine } = opts;
    const {
      apiKey,
      baseId,
      tableName,
      srcFieldMapping: srcFieldMappingRaw,
      srcHierarchy,
      noCheckpointing,
    } = config as AirtableExportConfig;

    const ctx = "plant";
    const checkpoint: string = this.verifyDir(dest);
    const srcFieldMapping = AirtableUtils.addRequiredFields(srcFieldMappingRaw);

    let filteredNotes: NoteProps[] =
      srcHierarchy === "root"
        ? notes
        : AirtableUtils.filterNotes(notes, srcHierarchy);
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
        engine,
      });
      await AirtableUtils.updateAirtableIdForNewlySyncedNotes({
        records: created,
        engine,
        logger: this.L,
      });
      this.L.info({
        ctx,
        created: created.length,
        updated: updated.length,
        msg: "finish export",
      });
      return { notes, data: { created, updated } };
    } else {
      throw new DendronError({
        message:
          "No new Records to sync in selected hierarchy. Create new file and then try",
      });
    }
  }
}
