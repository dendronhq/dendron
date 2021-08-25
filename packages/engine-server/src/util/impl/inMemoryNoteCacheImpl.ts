import { DendronError, NoteProps } from "@dendronhq/common-all";
import { InMemoryNoteCache } from "../inMemoryNoteCache";

export class InMemoryNoteCacheImpl implements InMemoryNoteCache {
  /** Note map which maps lowercase file name to a list {@link NoteProps}
   *  that have the matching file name */
  private readonly mapFNameToNotes: Map<string, NoteProps[]>;

  static createCache(notes: NoteProps[]) {
    return new InMemoryNoteCacheImpl(
      InMemoryNoteCacheImpl.initializeFileNameMap(notes)
    );
  }

  private constructor(noteMap: Map<string, NoteProps[]>) {
    this.mapFNameToNotes = noteMap;
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
