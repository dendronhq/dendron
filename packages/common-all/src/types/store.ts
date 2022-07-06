import { NoteProps, NotePropsMeta } from "./foundation";
import { DVault } from "./workspace";

// Types used on the store layer

export type FindNoteOpts = {
  fname?: string;
  // If vault is provided, filter results so that only notes with matching vault is returned
  vault?: DVault;
};

export type WriteNoteOpts<K> = {
  key: K;
  note: NoteProps;
};

export type WriteNoteMetaOpts<K> = {
  key: K;
  noteMeta: NotePropsMeta;
};
