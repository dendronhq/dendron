import { NoteProps, NotePropsMeta } from "./foundation";
import { SchemaModuleProps } from "./typesv2";
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
  // If true, exclude stubs from results. Otherwise, include stub notes
  // WARNING: If false and no other parameters are set, this will return all notes in the engine
  excludeStub?: boolean;
};

export type WriteNoteOpts<K> = {
  key: K;
  note: NoteProps;
};

export type WriteNoteMetaOpts<K> = {
  key: K;
  noteMeta: NotePropsMeta;
};

export type WriteSchemaOpts<K> = {
  key: K;
  schema: SchemaModuleProps;
};
