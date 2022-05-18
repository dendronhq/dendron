import _ from "lodash";
import {
  NotePropsDict,
  NotePropsByFnameDict,
  DVault,
  NoteProps,
  NotePropsFullDict,
} from "./types";
import { cleanName, isNotUndefined } from "./utils";
import { VaultUtils } from "./vault";

/**
 * Utilities for working with NotePropsFullDict. The reason NotePropsFullDict is not a class is due to needing
 * to work with primitive objects with redux
 */
export class NoteFullDictUtils {
  /**
   * Find notes by fname. If vault is provided, filter results so that only notes with matching vault is returned
   * Return empty array if no match is found
   *
   * @param fname
   * @param notesDict
   * @param vault If provided, use to filter results
   * @returns Copy of NoteProps array
   */
  static findNotesByFname(
    fname: string,
    notesDict: NotePropsFullDict,
    vault?: DVault
  ): NoteProps[] {
    const { notesById, notesByFname } = notesDict;
    const cleanedFname = cleanName(fname);
    const ids: string[] | undefined = notesByFname[cleanedFname];
    if (!ids) {
      return [];
    }
    let notes = ids.map((id) => notesById[id]).filter(isNotUndefined);
    if (vault) {
      notes = notes.filter((note) => VaultUtils.isEqualV2(note.vault, vault));
    }
    return _.cloneDeep(notes);
  }

  /**
   * Remove note from both notesById and notesByFname
   *
   * @param note note to delete
   * @param notesDict
   */
  static deleteNote(note: NoteProps, notesDict: NotePropsFullDict) {
    const { notesById, notesByFname } = notesDict;
    delete notesById[note.id];
    NoteFnameDictUtils.deleteNote(note, notesByFname);
  }

  /**
   * Add note to notesById and notesByFname.
   * If note id already exists, check to see if it corresponds to same note by fname.
   * If fname match, then we only need to update notesById. If fname doesn't match, remove old id from notesByFname first before updating both.
   *
   * Otherwise, if note id doesn't exist, add to both dictionaries
   *
   * @param note to add
   * @returns
   */
  static addNote(note: NoteProps, notesDict: NotePropsFullDict) {
    const { notesById, notesByFname } = notesDict;
    const maybeNote = notesById[note.id];
    if (maybeNote) {
      if (cleanName(maybeNote.fname) === cleanName(note.fname)) {
        notesById[note.id] = note;
        return;
      } else {
        // Remove old fname from fname dict
        NoteFnameDictUtils.deleteNote(maybeNote, notesByFname);
      }
    }
    notesById[note.id] = note;
    NoteFnameDictUtils.addNote(note, notesByFname);
  }
}

/**
 * Utilities for working with NotePropsByFnameDict.
 */
export class NoteFnameDictUtils {
  /**
   * Create a map of {key -> value} where key = noteFname and value is list of ids corresponding to that fname from NotePropsDict
   *
   * @param notesById NotePropsDict used to populate map
   * @returns
   */
  static create(notesById: NotePropsDict): NotePropsByFnameDict {
    const notesByFname = {};
    _.values(notesById).forEach((note) =>
      NoteFnameDictUtils.addNote(note, notesByFname)
    );
    return notesByFname;
  }

  /**
   * Add note to notesByFname dictionary. If note fname exists, add note id to existing list of ids
   *
   * @param note to add
   * @param notesByFname dictionary to modify
   */
  static addNote(note: NoteProps, notesByFname: NotePropsByFnameDict) {
    const fname = cleanName(note.fname);
    let ids = notesByFname[fname];
    if (_.isUndefined(ids)) ids = [];
    ids.push(note.id);
    notesByFname[fname] = ids;
  }

  /**
   * Delete note id from notesByFname dictionary. If note exists and it corresponds to last entry for that fname, delete fname entry
   * from dictionary as well
   *
   * @param note to delete
   * @param notesByFname dictionary to modify
   * @returns
   */
  static deleteNote(note: NoteProps, notesByFname: NotePropsByFnameDict) {
    const fname = cleanName(note.fname);
    const ids = notesByFname[fname];
    if (_.isUndefined(ids)) return;
    _.pull(ids, note.id);
    if (ids.length === 0) {
      delete notesByFname[fname];
    } else {
      notesByFname[fname] = ids;
    }
  }
}
