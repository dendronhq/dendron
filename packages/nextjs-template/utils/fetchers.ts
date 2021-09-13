import { DendronConfig } from "@dendronhq/common-all";
import { getAssetUrl } from "./links";
import { NoteData } from "./types";

export async function fetchNotes() {
  const resp = await fetch(getAssetUrl("/data/notes.json"));
  return (await resp.json()) as NoteData;
}

export async function fetchConfig() {
  const resp = await fetch(getAssetUrl("/data/dendron.json"));
  return (await resp.json()) as DendronConfig;
}
