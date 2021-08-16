import { DendronConfig } from "@dendronhq/common-all";
import { NoteData } from "./types";

export async function fetchNotes() {
  const resp = await fetch("/data/notes.json");
  return (await resp.json()) as NoteData;
}

export async function fetchConfig() {
  const resp = await fetch("/data/dendron.json");
  return (await resp.json()) as DendronConfig;
}
