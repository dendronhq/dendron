import {
  cleanName,
  DendronCompositeError,
  DendronError,
  DNodeUtils,
  DuplicateNoteError,
  DVault,
  ErrorFactory,
  ErrorUtils,
  ERROR_SEVERITY,
  ERROR_STATUS,
  genHash,
  globMatch,
  IDendronError,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NoteUtils,
  RespV2,
  RespWithOptError,
  string2Note,
  stringifyError,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode"; // NOTE: This version contains vscode.workspace.fs API references. Need to refactor that out somehow.
import { URI, Utils } from "vscode-uri";

// NOTE: THIS FILE IS DUPLICATED IN ENGINE-SERVER. TODO: Refactor and
// consolidate the two NoteParserV2 versions

type FileMeta = {
  // fpath: full path, eg: foo.md, fpath: foo.md
  fpath: string;
};
type FileMetaDict = { [key: string]: FileMeta[] };

/**
 * Get hierarchy of each file
 * @param fpaths
 * @returns
 */
function getFileMeta(fpaths: string[]): FileMetaDict {
  const metaDict: FileMetaDict = {};
  _.forEach(fpaths, (fpath) => {
    const { name } = path.parse(fpath);
    const lvl = name.split(".").length;
    if (!_.has(metaDict, lvl)) {
      metaDict[lvl] = [];
    }
    metaDict[lvl].push({ fpath });
  });
  return metaDict;
}

export class NoteParserV2 {
  constructor(private wsRoot: URI) {}
  /**
   * Construct in-memory
   *
   * @param allPaths
   * @param vault
   * @returns
   */
  async parseFiles(
    allPaths: string[],
    vault: DVault
  ): Promise<RespWithOptError<NoteDicts>> {
    const fileMetaDict: FileMetaDict = getFileMeta(allPaths);
    const maxLvl = _.max(_.keys(fileMetaDict).map((e) => _.toInteger(e))) || 2;
    // In-memory representation of NoteProps dictionary
    const notesByFname: NotePropsByFnameDict = {};
    const notesById: NotePropsByIdDict = {};
    const noteDicts = {
      notesById,
      notesByFname,
    };
    const errors: IDendronError<any>[] = [];

    // get root note
    if (_.isUndefined(fileMetaDict[1])) {
      return {
        data: noteDicts,
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        }),
      };
    }
    const rootFile = fileMetaDict[1].find((n) => n.fpath === "root.md");
    if (!rootFile) {
      return {
        data: noteDicts,
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        }),
      };
    }
    const rootProps = await this.parseNoteProps({
      fpath: cleanName(rootFile.fpath), // TODO: Don't think cleanName is necessary here
      addParent: false,
      vault,
    });
    if (rootProps.error) {
      errors.push(rootProps.error);
    }
    if (!rootProps.data || rootProps.data.length === 0) {
      return {
        data: noteDicts,
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        }),
      };
    }
    const rootNote = rootProps.data[0].note;
    NoteDictsUtils.add(rootNote, noteDicts);

    // Parse root hierarchies
    const op = fileMetaDict[1]
      // Don't count root node
      .filter((n) => n.fpath !== "root.md")
      .map(async (ent) => {
        try {
          const resp = await this.parseNoteProps({
            fpath: ent.fpath,
            addParent: false,
            vault,
          });
          // Store each successfully parsed node in note dict and keep track of errors
          if (resp.error) {
            errors.push(resp.error);
          }
          if (resp.data && resp.data.length > 0) {
            const parsedNote = resp.data[0].note;
            DNodeUtils.addChild(rootNote, parsedNote);

            // Check for duplicate IDs when adding notes to the map
            if (notesById[parsedNote.id] !== undefined) {
              const duplicate = notesById[parsedNote.id];
              errors.push(
                new DuplicateNoteError({
                  noteA: duplicate,
                  noteB: parsedNote,
                })
              );
            }
            // Update in-memory note dict
            NoteDictsUtils.add(parsedNote, noteDicts);
          }
        } catch (err: any) {
          const error = ErrorFactory.wrapIfNeeded(err);
          // A fatal error would kill the initialization
          error.severity = ERROR_SEVERITY.MINOR;
          error.message =
            `Failed to read ${ent.fpath} in ${vault.name}: ` + error.message;
          errors.push(error);
        }
      });

    await Promise.all(op);

    // Parse level by level
    let lvl = 2;
    while (lvl <= maxLvl) {
      const anotherOp = (fileMetaDict[lvl] || [])
        .filter((ent) => {
          return !globMatch(["root.*"], ent.fpath);
        })
        .flatMap(async (ent) => {
          try {
            const resp = await this.parseNoteProps({
              fpath: ent.fpath,
              noteDicts: { notesById, notesByFname },
              addParent: true,
              vault,
            });

            if (resp.error) {
              errors.push(resp.error);
            }

            if (resp.data && resp.data.length > 0) {
              resp.data.forEach((ent) => {
                const note = ent.note;
                // Check for duplicate IDs when adding created notes to the map
                if (
                  ent.status === "create" &&
                  notesById[note.id] !== undefined
                ) {
                  const duplicate = notesById[note.id];
                  errors.push(
                    new DuplicateNoteError({
                      noteA: duplicate,
                      noteB: note,
                    })
                  );
                }

                NoteDictsUtils.add(note, noteDicts);
              });
            }
          } catch (err: any) {
            const dendronError = ErrorFactory.wrapIfNeeded(err);
            // A fatal error would kill the initialization
            dendronError.severity = ERROR_SEVERITY.MINOR;
            dendronError.message =
              `Failed to read ${ent.fpath} in ${vault.name}: ` +
              dendronError.message;
            errors.push(dendronError);
          }
        });
      lvl += 1;

      // TODO: Fix
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(anotherOp);
    }
    return {
      data: noteDicts,
      error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
    };
  }

  /**
   * Given a fpath, convert to NoteProp
   * Update parent/children metadata if parents = true
   *
   * @returns List of all notes changed. If a note has no direct parents, stub notes are added instead
   */
  private async parseNoteProps(opts: {
    fpath: string;
    noteDicts?: NoteDicts;
    addParent: boolean;
    vault: DVault;
  }): Promise<RespV2<NoteChangeEntry[]>> {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      noteDicts: {
        notesById: {},
        notesByFname: {},
      },
    });
    const { fpath, noteDicts, vault } = cleanOpts;
    let changeEntries: NoteChangeEntry[] = [];

    try {
      // Get note props from file and propagate any errors
      const { data: note, error } = await this.file2NoteWithCache({
        uri: Utils.joinPath(this.wsRoot, VaultUtils.getRelPath(vault), fpath),
        vault,
      });

      if (note) {
        changeEntries.push({ status: "create", note });

        // Add parent/children properties
        if (cleanOpts.addParent) {
          const changed = NoteUtils.addOrUpdateParents({
            note,
            noteDicts,
            createStubs: true,
          });
          changeEntries = changeEntries.concat(changed);
        }
      }
      return { data: changeEntries, error };
    } catch (_err: any) {
      if (!ErrorUtils.isDendronError(_err)) {
        const error = DendronError.createFromStatus({
          status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
          severity: ERROR_SEVERITY.MINOR,
          payload: { fname: fpath, error: stringifyError(_err) },
          message: `${fpath} could not be parsed`,
        });
        return { error };
      }
      return { error: _err };
    }
  }

  /**
   * Given a fpath, attempt to convert raw file contents into a NoteProp
   *
   * Look up metadata from cache. If contenthash hasn't changed, use metadata from cache.
   * Otherwise, reconstruct metadata from scratch
   *
   * @returns NoteProp associated with fpath
   */
  private async file2NoteWithCache({
    uri,
    vault,
  }: {
    uri: URI;
    vault: DVault;
  }): Promise<RespV2<NoteProps>> {
    const raw = await vscode.workspace.fs.readFile(uri);

    // @ts-ignore - this needs to use browser's TextDecoder, not an import from node utils
    const textDecoder = new TextDecoder();

    const content = textDecoder.decode(raw);
    const name = path.parse(Utils.basename(uri)).name;
    const sig = genHash(content);

    const note = string2Note({
      content,
      fname: cleanName(name),
      vault,
    });
    note.contentHash = sig;

    return { data: note, error: null };
  }
}
