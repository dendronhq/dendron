import {
  DendronError,
  DNodeUtils,
  DStore,
  DVault,
  ENGINE_ERROR_CODES,
  NoteProps,
  NotePropsDict,
  NotesCache,
  NotesCacheEntry,
  NotesCacheEntryMap,
  NoteUtils,
  SchemaUtils,
} from "@dendronhq/common-all";
import {
  DLogger,
  file2NoteWithCache,
  globMatch,
  vault2Path,
} from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { FileMeta, FileMetaDict } from "./storev2";
import { createCacheEntry } from "../../utils";
import { ParserBase } from "./parseBase";

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
    metaDict[lvl].push({ prefix: name, fpath });
  });
  return metaDict;
}

export class NoteParser extends ParserBase {
  public cache: NotesCache;

  constructor(
    public opts: { store: DStore; cache: NotesCache; logger: DLogger }
  ) {
    super(opts);
    this.cache = opts.cache;
  }

  async parseFile(
    fpath: string[],
    vault: DVault
  ): Promise<{ notes: NoteProps[]; cacheUpdates: NotesCacheEntryMap }> {
    const ctx = "parseFile";
    const fileMetaDict: FileMetaDict = getFileMeta(fpath);
    const maxLvl = _.max(_.keys(fileMetaDict).map((e) => _.toInteger(e))) || 2;
    const notesByFname: NotePropsDict = {};
    const notesById: NotePropsDict = {};
    this.logger.debug({ ctx, msg: "enter", fpath });
    const cacheUpdates: { [key: string]: NotesCacheEntry } = {};

    // get root note
    if (_.isUndefined(fileMetaDict[1])) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND });
    }
    const rootFile = fileMetaDict[1].find(
      (n) => n.fpath === "root.md"
    ) as FileMeta;
    if (!rootFile) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND });
    }
    const rootProps = this.parseNoteProps({
      fileMeta: rootFile,
      addParent: false,
      vault,
    });
    const rootNote = rootProps.propsList[0];
    this.logger.debug({ ctx, rootNote, msg: "post-parse-rootNote" });
    if (!rootProps.matchHash) {
      cacheUpdates[rootNote.fname] = createCacheEntry({
        noteProps: rootNote,
        hash: rootProps.noteHash,
      });
    }

    notesByFname[rootNote.fname] = rootNote;
    notesById[rootNote.id] = rootNote;

    // get root of hiearchies
    let lvl = 2;
    let prevNodes: NoteProps[] = fileMetaDict[1]
      // don't count root node
      .filter((n) => n.fpath !== "root.md")
      .flatMap((ent) => {
        const out = this.parseNoteProps({
          fileMeta: ent,
          addParent: false,
          vault,
        });
        const notes = out.propsList;
        if (!out.matchHash) {
          cacheUpdates[notes[0].fname] = createCacheEntry({
            noteProps: notes[0],
            hash: out.noteHash,
          });
        }
        return notes;
      });
    prevNodes.forEach((ent) => {
      DNodeUtils.addChild(rootNote, ent);
      notesByFname[ent.fname] = ent;
      notesById[ent.id] = ent;
    });

    // get everything else
    while (lvl <= maxLvl) {
      const currNodes: NoteProps[] = (fileMetaDict[lvl] || [])
        .filter((ent) => {
          return !globMatch(["root.*"], ent.fpath);
        })
        .flatMap((ent) => {
          const out = this.parseNoteProps({
            fileMeta: ent,
            parents: prevNodes,
            notesByFname,
            addParent: true,
            vault,
          });
          const notes = out.propsList;
          if (!out.matchHash) {
            cacheUpdates[notes[0].fname] = createCacheEntry({
              noteProps: notes[0],
              hash: out.noteHash,
            });
          }
          // need to be inside this loop
          // deal with `src/__tests__/enginev2.spec.ts`, with stubs/ test case
          notes.forEach((ent) => {
            notesByFname[ent.fname] = ent;
            notesById[ent.id] = ent;
          });
          return notes;
        });
      lvl += 1;
      prevNodes = currNodes;
    }

    // add schemas
    const out = _.values(notesByFname);
    const domains = rootNote.children.map(
      (ent) => notesById[ent]
    ) as NoteProps[];
    const schemas = this.opts.store.schemas;
    await Promise.all(
      domains.map(async (d) => {
        return SchemaUtils.matchDomain(d, notesById, schemas);
      })
    );
    return { notes: out, cacheUpdates };
  }

  /**
   *
   * @param opts
   * @returns List of all notes added. If a note has no direct parents, stub notes are added instead
   */
  parseNoteProps(opts: {
    fileMeta: FileMeta;
    notesByFname?: NotePropsDict;
    parents?: NoteProps[];
    addParent: boolean;
    createStubs?: boolean;
    vault: DVault;
  }): { propsList: NoteProps[]; noteHash: string; matchHash: boolean } {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      createStubs: true,
      notesByFname: {},
      parents: [] as NoteProps[],
    });
    const { fileMeta, parents, notesByFname, vault } = cleanOpts;
    const ctx = "parseNoteProps";
    this.logger.debug({ ctx, msg: "enter", fileMeta });
    const wsRoot = this.opts.store.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    let out: NoteProps[] = [];
    let noteProps: NoteProps;
    let noteHash: string;
    let matchHash: boolean;

    // get note props
    try {
      // noteProps = file2Note(path.join(vpath, fileMeta.fpath), vault);
      ({ note: noteProps, noteHash, matchHash } = file2NoteWithCache({
        fpath: path.join(vpath, fileMeta.fpath),
        vault,
        cache: this.cache,
      }));
    } catch (_err) {
      const err = {
        status: ENGINE_ERROR_CODES.BAD_PARSE_FOR_NOTE,
        msg: JSON.stringify({
          fname: fileMeta.fpath,
          error: _err.message,
        }),
      };
      this.logger.error({ ctx, fileMeta, err });
      throw new DendronError(err);
    }
    out.push(noteProps);

    // add parent
    if (cleanOpts.addParent) {
      const stubs = NoteUtils.addParent({
        note: noteProps,
        notesList: _.uniqBy(_.values(notesByFname).concat(parents), "id"),
        createStubs: cleanOpts.createStubs,
        wsRoot: this.opts.store.wsRoot,
      });
      out = out.concat(stubs);
    }
    return { propsList: out, noteHash, matchHash };
  }
}
