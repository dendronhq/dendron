import { NotePropsMeta } from "./foundation";

export type FileSystemCache = {
  version: number;
};

export type NotesCache = {
  version: number;
  notes: NotesCacheEntryMap;
};
export type NotesCacheEntryMap = { [key: string]: NotesCacheEntry };
export type NotesCacheEntry = {
  hash: string;
  data: NotePropsMeta;
};
