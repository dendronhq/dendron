import defaultsDeep from "lodash/defaultsDeep";
import {
  DendronConfig,
  SerializedFuseIndex,
  TreeMenu,
  ConfigUtils,
} from "@dendronhq/common-all";
import { getAssetUrl } from "./links";
import { NoteData } from "./types";
import Fuse from "fuse.js";

export async function fetchNotes() {
  const resp = await fetch(getAssetUrl("/data/notes.json"));
  return (await resp.json()) as NoteData;
}

export async function fetchTreeMenu() {
  const resp = await fetch(getAssetUrl("/data/tree.json"));
  return (await resp.json()) as TreeMenu;
}

export async function fetchConfig() {
  const defaultConfig = ConfigUtils.genDefaultConfig();
  const resp = await fetch(getAssetUrl("/data/dendron.json"));
  const configWithDefaults = defaultsDeep(await resp.json(), defaultConfig); // TODO move into `_app`
  return configWithDefaults as DendronConfig;
}

/** See the helpers in `utils/fuse.ts` for your convenienance. */
export async function fetchFuseIndex() {
  const resp = await fetch(getAssetUrl("/data/fuse.json"));
  const serializedIndex = (await resp.json()) as SerializedFuseIndex;
  return Fuse.parseIndex(serializedIndex);
}

/** Fetches a note body in markdown. See hook in `utils/hooks.ts` for convenient integration. */
export async function fetchNoteBody(id: string) {
  const resp = await fetch(getAssetUrl(`/data/notes/${id}.md`));
  return resp.text();
}
