import fs from "fs-extra";
import path from "path";
import { DendronConfig, NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from "lodash";
import { NoteData } from "./types";

export * from "./fetchers";

const NOTE_META_DIR = "meta";
const NOTE_BODY_DIR = "notes";

export function getDataDir(): string {
  const dataDir = process.env.DATA_DIR;
  if (!dataDir) {
    throw new Error("DATA_DIR not set");
  }
  return dataDir;
}

export function getNoteBody(id: string) {
  const dataDir = getDataDir();
  const body = fs.readFile(path.join(dataDir, NOTE_BODY_DIR, `${id}.html`), {
    encoding: "utf8",
  });
  return body;
}

let _NOTES_CACHE: NoteData | undefined;

export function getNotes() {
  if (_.isUndefined(_NOTES_CACHE)) {
    const dataDir = getDataDir();
    _NOTES_CACHE = fs.readJSONSync(
      path.join(dataDir, "notes.json")
    ) as NoteData;
  }
  return _NOTES_CACHE;
}

export function getNoteMeta(id: string) {
  const dataDir = getDataDir();
  return fs.readJSON(
    path.join(dataDir, NOTE_META_DIR, `${id}.json`)
  ) as Promise<NoteProps>;
}

export function getConfig(): Promise<DendronConfig> {
  const dataDir = getDataDir();
  return fs.readJSON(path.join(dataDir, "dendron.json"));
}

export function getPublicDir() {
  return path.join(process.cwd(), "public");
}

export async function getCustomHead() {
  const config = await getConfig();
  const customHeadPathConfig = config.site.customHeaderPath;
  if (_.isUndefined(customHeadPathConfig)) {
    return null;
  }
  const publicDir = getPublicDir();
  const headPath = path.join(publicDir, customHeadPathConfig);
  return fs.readFileSync(headPath, { encoding: "utf-8" });
}
