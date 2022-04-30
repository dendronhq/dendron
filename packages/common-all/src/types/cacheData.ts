import { DLink, NoteProps } from ".";

export type FileSystemCache = {
  version: number;
};

export type NotesCache = {
  version: number;
  notes: NotesCacheEntryMap;
};
// key = DNodeProps.fname
export type NotesCacheEntryMap = { [key: string]: NotesCacheEntry };
export type NotesCacheEntry = {
  hash: string;
  data: Omit<NoteProps, "body">;
};

export type BacklinksCache = {
  version: number;
  backlinks: BacklinksCacheEntryMap;
};
// key = DNodeExplicitProps.id
export type BacklinksCacheEntryMap = {
  [key: string]: BacklinksCacheEntry;
};
export type BacklinksCacheEntry = {
  hash: string;
  data: Omit<DLink, "type"> & { type: "backlink" };
}[];
