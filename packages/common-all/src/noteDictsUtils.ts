import _ from "lodash";
import {
  NotePropsByIdDict,
  NotePropsByFnameDict,
  NoteProps,
  NoteDicts,
  NotePropsMeta,
} from "./types";
import { DVault } from "./types/DVault";
import { cleanName, isNotUndefined } from "./utils";
import { VaultUtils } from "./vault";

/**
 * Utilities for working with NoteDicts. The reason NoteDicts is not a class is due to needing
 * to work with primitive objects with redux
 */
export class NoteDictsUtils {
  /**
   * Construct a full NoteDicts from a set of Note Props
   * @param notes
   */
  static createNoteDicts(notes: NoteProps[]): NoteDicts {
    const notesById = this.createNotePropsByIdDict(notes);
    const notesByFname =
      NoteFnameDictUtils.createNotePropsByFnameDict(notesById);

    return { notesById, notesByFname };
  }
  /**
   * Construct NotePropsByIdDict from list of NoteProps
   *
   * @param notes Used to populate map
   * @returns NotePropsByIdDict
   */
  static createNotePropsByIdDict(notes: NoteProps[]): NotePropsByIdDict {
    const notesById: NotePropsByIdDict = {};

    for (const note of notes) {
      notesById[note.id] = note;
    }

    return notesById;
  }

  /**
   * Find notes by fname. If vault is provided, filter results so that only notes with matching vault is returned
   * Return empty array if no match is found
   *
   * @param fname
   * @param noteDicts
   * @param vault If provided, use to filter results
   * @returns Array of NoteProps matching opts
   */
  static findByFname(
    fname: string,
    noteDicts: NoteDicts,
    vault?: DVault
  ): NoteProps[] {
    const { notesById, notesByFname } = noteDicts;
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
   * Remove note from both notesById and notesByFname.
   * Returns true if note was deleted from both. False otherwise
   *
   * @param note note to delete
   * @param noteDicts
   * @return whether note was deleted
   */
  static delete(note: NoteProps, noteDicts: NoteDicts): boolean {
    const { notesById, notesByFname } = noteDicts;
    if (_.isUndefined(notesById[note.id])) {
      return false;
    }
    delete notesById[note.id];
    return NoteFnameDictUtils.delete(note, notesByFname);
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
  static add(note: NoteProps, noteDicts: NoteDicts) {
    const { notesById, notesByFname } = noteDicts;
    const maybeNote = notesById[note.id];
    if (maybeNote) {
      if (cleanName(maybeNote.fname) === cleanName(note.fname)) {
        notesById[note.id] = note;
        return;
      } else {
        // Remove old fname from fname dict
        NoteFnameDictUtils.delete(maybeNote, notesByFname);
      }
    }
    notesById[note.id] = note;
    NoteFnameDictUtils.add(note, notesByFname);
  }
}

/**
 * Utilities for working with NotePropsByFnameDict.
 */
export class NoteFnameDictUtils {
  /**
   * Use NotePropsByIdDict to create a inverted index of {key -> value} where key = noteFname and value is list of ids corresponding to that fname
   *
   * @param notesById Used to populate map
   * @returns
   */
  static createNotePropsByFnameDict(
    notesById: NotePropsByIdDict
  ): NotePropsByFnameDict {
    const notesByFname = {};
    _.values(notesById).forEach((note) =>
      NoteFnameDictUtils.add(note, notesByFname)
    );
    return notesByFname;
  }

  /**
   * Add note to notesByFname dictionary. If note fname exists, add note id to existing list of ids
   *
   * @param note to add
   * @param notesByFname dictionary to modify
   */
  static add(note: NotePropsMeta, notesByFname: NotePropsByFnameDict) {
    const fname = cleanName(note.fname);
    let ids = notesByFname[fname];
    if (_.isUndefined(ids)) ids = [];
    ids.push(note.id);
    notesByFname[fname] = ids;
  }

  /**
   * Delete note from notesByFname dictionary. If note exists and it corresponds to last entry for that fname, delete fname entry
   * from dictionary as well
   * Returns true if note was deleted
   *
   * @param note to delete
   * @param notesByFname dictionary to modify
   * @returns whether note was deleted
   */
  static delete(
    note: NotePropsMeta,
    notesByFname: NotePropsByFnameDict
  ): boolean {
    const fname = cleanName(note.fname);
    const ids = notesByFname[fname];
    if (_.isUndefined(ids)) return false;
    _.pull(ids, note.id);
    if (ids.length === 0) {
      delete notesByFname[fname];
    } else {
      notesByFname[fname] = ids;
    }
    return true;
  }

  /**
   * Merge two NotePropsByFnameDict into a single NotePropsByFnameDict
   * If key exists in both, merge values into a single array
   *
   * @return new merged NotePropsByFnameDict without modifying existing NotePropsByFnameDicts
   */
  static merge(
    fnameDictOne: NotePropsByFnameDict,
    fnameDictTwo: NotePropsByFnameDict
  ) {
    const notesByFname = _.cloneDeep(fnameDictOne);
    _.entries(fnameDictTwo).forEach(([key, value]) => {
      // If same key exists, concat values
      if (notesByFname[key]) {
        notesByFname[key] = notesByFname[key].concat(value);
      } else {
        notesByFname[key] = value;
      }
    });
    return notesByFname;
  }
}
