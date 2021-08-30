import { DendronError, NoteProps } from "@dendronhq/common-all";

export class InMemoryNoteCache {
  /** Note map which maps lowercase file name to a list {@link NoteProps}
   *  that have the matching file name.
   *
   *  Primary reason file name maps to a list of notes is having notes with
   *  the same file name in different vaults.
   *  */
  private readonly mapFNameToNotes: Map<string, NoteProps[]>;

  constructor(notes: NoteProps[]) {
    this.mapFNameToNotes = InMemoryNoteCache.initializeFileNameMap(notes);
  }

  private static initializeFileNameMap(notes: NoteProps[]) {
    const map = new Map<string, NoteProps[]>();
    notes.forEach((note) => {
      const lowercaseName = note.fname.toLowerCase();
      let list = map.get(lowercaseName);
      if (list === undefined) {
        list = [];
      }
      list.push(note);

      map.set(lowercaseName, list);
    });
    return map;
  }

  /** Returns list of {@link NoteProps} that have matching file name (ignoring
   *  the file name case). Will return empty list if no notes match.  */
  getNotesByFileNameIgnoreCase(fileName: string): NoteProps[] {
    if (fileName === undefined || fileName === null || fileName.length === 0) {
      throw new DendronError({
        message: `File name cannot be undefined/null/empty.`,
      });
    }

    const list = this.mapFNameToNotes.get(fileName.toLowerCase());
    if (list === undefined) {
      return [];
    }
    return list;
  }
}
