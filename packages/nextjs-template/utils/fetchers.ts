import { DendronConfig, SerializedFuseIndex } from "@dendronhq/common-all";
import { getAssetUrl } from "./links";
import { NoteData } from "./types";
import Fuse from "fuse.js";

export async function fetchNotes() {
  const resp = await fetch(getAssetUrl("/data/notes.json"));
  return (await resp.json()) as NoteData;
}

export async function fetchConfig() {
  const resp = await fetch(getAssetUrl("/data/dendron.json"));
  return (await resp.json()) as DendronConfig;
}

/** See the helpers in `utils/fuse.ts` for your convenienance. */
export async function fetchFuseIndex() {
  const resp = await fetch(getAssetUrl("/data/fuse.json"));
  const serializedIndex = (await resp.json()) as SerializedFuseIndex;
  return Fuse.parseIndex(serializedIndex);
}
