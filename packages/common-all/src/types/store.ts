import { NoteProps, NotePropsMeta } from "./foundation";
import { DVault } from "./workspace";

// Types used on the store layer

/**
 * Properties used to find notes by. If multiple properties are provided, then returned notes
 * must satisfy all constraints.
 *
 * For example, if fname = "foo" and vault = "vaultOne", then only notes with fname "foo" in vault "vaultOne" are returned
 */
export type FindNoteOpts = {
  // Find notes by fname
  fname?: string;
  // If vault is provided, filter results so that only notes with matching vault is returned
  vault?: DVault;
  // Find note by child. This usually refers to parent but could also be closest ancestor if parent doesn't exist. Max one note should be returned
  // E.g. if childFname = `baz.one.two` and `baz.one` does not exist, then `baz` will be returned
  child?: NotePropsMeta; // Noteprops metadata of child
};

export type WriteNoteOpts<K> = {
  key: K;
  note: NoteProps;
};

export type WriteNoteMetaOpts<K> = {
  key: K;
  noteMeta: NotePropsMeta;
};
