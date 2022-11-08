import { NoteProps, NotePropsMeta } from "./foundation";
import { SchemaModuleProps } from "./typesv2";

// Types used on the store layer

//--- NoteProps
export type WriteNoteOpts<K> = {
  key: K;
  note: NoteProps;
};

export type WriteNoteMetaOpts<K> = {
  key: K;
  noteMeta: NotePropsMeta;
};

//--- Schemas
export type QuerySchemaOpts = {
  qs: string;
};

export type WriteSchemaOpts<K> = {
  key: K;
  schema: SchemaModuleProps;
};
