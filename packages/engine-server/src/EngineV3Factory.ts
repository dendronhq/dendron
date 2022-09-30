import {
  BacklinkUtils,
  ConfigUtils,
  CONSTANTS,
  DendronCompositeError,
  DendronError,
  DEngineInitResp,
  DLogger,
  DVault,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FuseMetadataStore,
  FuseMetadataStore,
  IDataStore,
  IDendronError,
  IFileStore,
  ISchemaStore,
  isNotUndefined,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteStore,
  RespWithOptError,
  SchemaMetadataStore,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaStore,
  stringifyError,
  URI,
  vault2Path,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  createLogger,
  DConfig,
  getDurationMilliseconds,
} from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Utils } from "vscode-uri";
import { HookUtils, SchemaParser, NotesFileSystemCache } from "../lib";
import { DendronEngineV3 } from "./DendronEngineV3";
import { NoteParserV2 } from "./drivers/file/NoteParserV2";
import { NodeJSFileStore } from "./store";

// This variation is tuned for Local Ext with Fuse. These factory methods can
// later be converted to separate DI containers.
export async function createAndInitDendronEngineV3WithFuse({
  wsRoot,
  vaults,
  logger,
}: {
  logger?: DLogger;
  vaults: DVault[];
  wsRoot: URI;
}): Promise<DendronEngineV3> {
  const LOGGER = logger || createLogger();
  const { error, data: config } =
    DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
  if (error) {
    LOGGER.error(stringifyError(error));
  }

  const fileStore = getFileStore(); // We can later have a different DI container / factory method to give the web-friendly virtual FS.

  const metadataStoreAndQueryEngine = getMetadataStore(); // In the alternate DI Container / factory method, we have SQLiteMetadataStore;

  const schemaStore = provideInitializedSchemaStore(wsRoot, fileStore);

  const noteStore = await provideInitializedNoteStore(
    fileStore,
    metadataStoreAndQueryEngine,
    wsRoot,
    vaults,
    LOGGER,
    schemaStore // Types here don't quite line up yet (SchemaModuleDict vs ISchemaStore), but gist is to pass in schema data to the fn.
  );

  return new DendronEngineV3({
    wsRoot: wsRoot.fsPath, // TODO: Convert to URI
    vaults: ConfigUtils.getVaults(config),
    noteStore,
    schemaStore,
    noteQueryEngine: metadataStoreAndQueryEngine,
    // TODO: Need to also add a corresponding schemaQueryEngine object
    fileStore,
    logger: LOGGER,
    config,
  });
}

export function createAndInitDendronEngineV3WithSQLLite() {
  // Not implemented yet
}

function getFileStore() {
  return new NodeJSFileStore();
}

function getMetadataStore() {
  return new FuseMetadataStore();
}

// TODO: supply dependencies
function provideInitializedSchemaStore(
  wsRoot: URI,
  fileStore: IFileStore
): ISchemaStore<string> {
  const store = new SchemaStore(fileStore, new SchemaMetadataStore(), wsRoot);

  // const schemaDict = provideSchemas(wsRoot);

  // Write schema data prior to initializing notes, so that the schema
  // information can correctly get applied to the notes.
  const bulkWriteSchemaOpts = schemas.map((schema) => {
    return { key: schema.root.id, schema };
  });
  store.bulkWriteMetadata(bulkWriteSchemaOpts);

  return store;
}

async function provideInitializedNoteStore(
  fileStore: IFileStore,
  metaDataStore: IDataStore<string, NotePropsMeta>,
  wsRoot: URI,
  vaults: DVault[],
  logger: DLogger,
  schemaDict: SchemaModuleDict
) {
  const noteStore = new NoteStore(fileStore, metaDataStore, wsRoot);

  const { data: notes, error: noteErrors } = await initNotes(
    wsRoot,
    vaults,
    schemaDict,
    logger,
    fileStore
  );
  if (_.isUndefined(notes)) {
    return {
      data: defaultResp,
      error: DendronError.createFromStatus({
        message: "No notes found",
        status: ERROR_STATUS.UNKNOWN,
        severity: ERROR_SEVERITY.FATAL,
      }),
    };
  }

  const bulkWriteOpts = _.values(notes).map((note) => {
    const noteMeta: NotePropsMeta = _.omit(note, ["body", "contentHash"]);

    return { key: note.id, noteMeta };
  });
  noteStore.bulkWriteMetadata(bulkWriteOpts);

  return noteStore;
}

// TODO: better encapsulate hook init logic
async function initHooks(engine: DendronEngineV3, wsRoot: URI) {
  const hookErrors: IDendronError[] = [];
  engine.hooks.onCreate = engine.hooks.onCreate.filter((hook) => {
    const { valid, error } = HookUtils.validateHook({
      hook,
      wsRoot: wsRoot.fsPath, // TODO - use URI
    });
    if (!valid && error) {
      // this.logger.error({ msg: "bad hook", hook, error });
      hookErrors.push(error);
    }
    return valid;

    // TODO: Propagate errors
  });
}

async function provideSchemas(
  wsRoot: URI,
  vaults: DVault[],
  _fileStore: IFileStore,
  logger: DLogger
): Promise<SchemaModuleDict> {
  const ctx = "DEngine:initSchema";
  logger.info({ ctx, msg: "enter" });
  let errorList: IDendronError[] = [];

  const schemaResponses: RespWithOptError<SchemaModuleProps[]>[] =
    await Promise.all(
      (vaults as DVault[]).map(async (vault) => {
        const vpath = vault2Path({ vault, wsRoot });
        // Get list of files from filesystem
        const maybeFiles = await _fileStore.readDir({
          root: vpath,
          include: ["*.schema.yml"],
        });
        if (maybeFiles.error || maybeFiles.data.length === 0) {
          // Keep initializing other vaults
          return {
            error: new DendronCompositeError([
              new DendronError({
                message: `Unable to get schemas for vault ${VaultUtils.getName(
                  vault
                )}`,
                status: ERROR_STATUS.NO_SCHEMA_FOUND,
                severity: ERROR_SEVERITY.MINOR,
                payload: maybeFiles.error,
              }),
            ]),
            data: [],
          };
        }
        const schemaFiles = maybeFiles.data.map((entry) => entry.toString());
        // this.logger.info({ ctx, schemaFiles });
        const { schemas, errors } = await new SchemaParser({
          wsRoot: wsRoot.fsPath, // JYTODO: Make SchemaParser take a URI
          logger,
        }).parse(schemaFiles, vault);

        if (errors) {
          errorList = errorList.concat(errors);
        }
        return {
          data: schemas,
          error: _.isNull(errors)
            ? undefined
            : new DendronCompositeError(errors),
        };
      })
    );
  const errors = schemaResponses
    .flatMap((response) => response.error)
    .filter(isNotUndefined);

  const payload = {
    error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
    data: schemaResponses
      .flatMap((response) => response.data)
      .filter(isNotUndefined),
  };

  // TODO: Error handling and propagation.
  // if (_.isUndefined(schemas)) {
  //   return {
  //     data: defaultResp,
  //     error: DendronError.createFromStatus({
  //       message: "No schemas found",
  //       status: ERROR_STATUS.UNKNOWN,
  //       severity: ERROR_SEVERITY.FATAL,
  //     }),
  //   };
  // }

  const schemaDict: SchemaModuleDict = {};
  payload.data.forEach((schema) => {
    schemaDict[schema.root.id] = schema;
  });

  return schemaDict;
}

/**
 * Construct dictionary of NoteProps from workspace on filesystem
 *
 * For every vault on the filesystem, get list of files and convert each file to NoteProp
 * @returns NotePropsByIdDict
 */
async function initNotes(
  wsRoot: URI,
  vaults: DVault[],
  schemas: SchemaModuleDict,
  logger: DLogger,
  _fileStore: IFileStore
): Promise<RespWithOptError<NotePropsByIdDict>> {
  const ctx = "DEngine:initNotes";
  logger.info({ ctx, msg: "enter" });
  let errors: IDendronError[] = [];
  let notesFname: NotePropsByFnameDict = {};
  const start = process.hrtime();

  const allNotesList = await Promise.all(
    vaults.map(async (vault) => {
      const vpath = vault2Path({ vault, wsRoot });
      // Get list of files from filesystem
      const maybeFiles = await _fileStore.readDir({
        root: vpath,
        include: ["*.md"],
      });
      if (maybeFiles.error) {
        // Keep initializing other vaults
        errors = errors.concat([
          new DendronError({
            message: `Unable to read notes for vault ${VaultUtils.getName(
              vault
            )}`,
            severity: ERROR_SEVERITY.MINOR,
            payload: maybeFiles.error,
          }),
        ]);
        return {};
      }

      // Load cache from vault
      // const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
      const cachePath = Utils.joinPath(vpath, CONSTANTS.DENDRON_CACHE_FILE);
      const notesCache = new NotesFileSystemCache({
        cachePath: cachePath.fsPath, // TODO: Replace with URI arg
        noCaching: DConfig.readConfigSync(wsRoot.fsPath).noCaching, // TODO: Replace with URI arg
        logger,
      });

      const { data: notesDict, error } = await new NoteParserV2({
        cache: notesCache,
        engine: this, // TODO: Make noteparser engine-less
        logger,
      }).parseFiles(maybeFiles.data, vault, schemas);
      if (error) {
        errors = errors.concat(error);
      }
      if (notesDict) {
        const { notesById, notesByFname } = notesDict;
        notesFname = NoteFnameDictUtils.merge(notesFname, notesByFname);

        logger.info({
          ctx,
          vault,
          numEntries: _.size(notesById),
          numCacheUpdates: notesCache.numCacheMisses,
        });
        return notesById;
      }
      return {};
    })
  );
  const allNotes: NotePropsByIdDict = Object.assign({}, ...allNotesList);
  const notesWithLinks = _.filter(allNotes, (note) => !_.isEmpty(note.links));
  addBacklinks(
    {
      notesById: allNotes,
      notesByFname: notesFname,
    },
    notesWithLinks
  );
  const duration = getDurationMilliseconds(start);
  logger.info({ ctx, msg: `time to init notes: "${duration}" ms` });

  return {
    data: allNotes,
    error: new DendronCompositeError(errors),
  };
}

/**
 * Create and add backlinks from all notes with a link pointing to another note
 */
function addBacklinks(noteDicts: NoteDicts, notesWithLinks: NoteProps[]) {
  notesWithLinks.forEach((noteFrom) => {
    try {
      noteFrom.links.forEach((link) => {
        const maybeBacklink = BacklinkUtils.createFromDLink(link);
        if (maybeBacklink) {
          const notes = NoteDictsUtils.findByFname(link.to!.fname!, noteDicts);

          notes.forEach((noteTo: NoteProps) => {
            BacklinkUtils.addBacklinkInPlace({
              note: noteTo,
              backlink: maybeBacklink,
            });
            NoteDictsUtils.add(noteTo, noteDicts);
          });
        }
      });
    } catch (err: any) {
      const error = error2PlainObject(err);
      // this.logger.error({ error, noteFrom, message: "issue with backlinks" });
    }
  });
}
