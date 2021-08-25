import { NoteProps } from "@dendronhq/common-all";
import { InMemoryNoteCacheImpl } from "./impl/inMemoryNoteCacheImpl";

/**
 * In memory cache for {@link NoteProps}.
 *
 * Use {@link InMemoryNoteCacheFactory} to get an instance of this interface.*/
export interface InMemoryNoteCache {
  /** Returns list of {@link NoteProps} that have matching file name (ignoring
   *  the file name case). Will return empty list if no notes match.  */
  getNotesByFileNameIgnoreCase(fileName: string): NoteProps[];
}

/** Factory for {@link InMemoryNoteCache} */
export class InMemoryNoteCacheFactory {
  static createCache(notes: NoteProps[]): InMemoryNoteCache {
    return InMemoryNoteCacheImpl.createCache(notes);
  }
}
