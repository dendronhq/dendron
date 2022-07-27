import { IReducedEngineAPIService } from "@dendronhq/plugin-common";

import {
  BulkResp,
  DendronCompositeError,
  DendronError,
  DEngine,
  DEngineClient,
  DEngineDeleteSchemaResp,
  DEngineMode,
  DLink,
  DVault,
  DVaultUriVariant,
  EngineInfoResp,
  // error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  FuseEngine,
  GetDecorationsPayload,
  GetNoteBlocksPayload,
  IDendronError,
  IFileStore,
  INoteStore,
  IntermediateDendronConfig,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteUtils,
  RenameNotePayload,
  RenderNotePayload,
  RespV2,
  SchemaModuleProps,
  SchemaQueryResp,
  WriteNoteResp,
} from "@dendronhq/common-all";
// import {
//   createLogger,
//   DLogger,
//   getDurationMilliseconds,
// } from "@dendronhq/common-server";
import _ from "lodash";

// TODO: Replace Factory with injection
export class WebEngineFactory {
  create(wsRoot: string): IReducedEngineAPIService {}

  private async initNotesNew(
    vaults: DVaultUriVariant[]
  ): Promise<BulkResp<NotePropsByIdDict>> {
    // const ctx = "DendronEngineV3:initNotes";
    // this.logger.info({ ctx, msg: "enter" });
    let errors: IDendronError[] = [];
    let notesFname: NotePropsByFnameDict = {};
    // const start = process.hrtime();

    const allNotesList = await Promise.all(
      vaults.map(async (vault) => {
        // const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
        // Get list of files from filesystem
        const maybeFiles = await this._fileStore.readDir({
          root: vault.path,
          include: ["*.md"],
        });
        if (maybeFiles.error) {
          // Keep initializing other vaults
          errors = errors.concat([
            new DendronError({
              message: `Unable to read notes for vault ${vault.name}`,
              severity: ERROR_SEVERITY.MINOR,
              payload: maybeFiles.error,
            }),
          ]);
          return {};
        }

        // // Load cache from vault
        // const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
        // const notesCache = new NotesFileSystemCache({
        //   cachePath,
        //   noCaching: this.config.noCaching,
        //   logger: this.logger,
        // });

        // TODO: Currently mocked as empty
        // const notesDict: NoteDicts = {
        //   notesById: {},
        //   notesByFname: {},
        // };

        const { data: notesDict, error } = await new NoteParserV2({
          cache: notesCache,
          engine: this,
          logger: this.logger,
          maxNoteLength: ConfigUtils.getWorkspace(this.config).maxNoteLength,
        }).parseFiles(maybeFiles.data, vault);
        if (error) {
          errors = errors.concat(error?.errors);
        }
        if (notesDict) {
          const { notesById, notesByFname } = notesDict;
          notesFname = NoteFnameDictUtils.merge(notesFname, notesByFname);

          // this.logger.info({
          //   ctx,
          //   vault,
          //   numEntries: _.size(notesById),
          //   numCacheUpdates: notesCache.numCacheMisses,
          // });
          return notesById;
        }
        return {};
      })
    );
    const allNotes: NotePropsByIdDict = Object.assign({}, ...allNotesList);
    const notesWithLinks = _.filter(allNotes, (note) => !_.isEmpty(note.links));
    this.addBacklinks(
      {
        notesById: allNotes,
        notesByFname: notesFname,
      },
      notesWithLinks
    );
    // const duration = getDurationMilliseconds(start);
    // this.logger.info({ ctx, msg: `time to init notes: "${duration}" ms` });

    return {
      data: allNotes,
      error: new DendronCompositeError(errors),
    };
  }
}
