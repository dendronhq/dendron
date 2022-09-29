import fs from "fs-extra";
import path from "path";
import {
  ConfigUtils,
  IntermediateDendronConfig,
  NoteProps,
} from "@dendronhq/common-all";
import _ from "lodash";
import { NoteData } from "./types";
import { GetStaticPathsResult } from "next";
import { ParsedUrlQuery } from "querystring";

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

/**
 *  Returns the HTML representation of a note
 */
export function getNoteBody(id: string): Promise<string> {
  const dataDir = getDataDir();
  const body = fs.readFile(path.join(dataDir, NOTE_BODY_DIR, `${id}.html`), {
    encoding: "utf8",
  });
  return body;
}

let _NOTES_CACHE: NoteData | undefined;

export function getNotes(): NoteData {
  if (_.isUndefined(_NOTES_CACHE)) {
    const dataDir = getDataDir();
    _NOTES_CACHE = fs.readJSONSync(
      path.join(dataDir, "notes.json")
    ) as NoteData;
  }
  return _NOTES_CACHE;
}

const NOTE_REF_DIR = "refs";
let _REFS_CACHE: string[] | undefined;
export function getRefBody(id: string) {
  const dataDir = getDataDir();
  const body = fs.readFile(path.join(dataDir, NOTE_REF_DIR, `${id}.html`), {
    encoding: "utf8",
  });
  return body;
}
export function getNoteRefs() {
  if (_.isUndefined(_REFS_CACHE)) {
    const dataDir = getDataDir();
    try {
      _REFS_CACHE = fs.readJSONSync(
        path.join(dataDir, "refs.json")
      ) as string[];
    } catch {
      _REFS_CACHE = [];
    }
  }
  return _REFS_CACHE;
}

export interface DendronNotePageParams extends ParsedUrlQuery {
  id: string;
}
/**
 * Generate URLs for all exported pages
 * For use with getStaticProps
 * https://nextjs.org/docs/basic-features/data-fetching/get-static-props
 * @returns
 */
export function getNotePaths(): GetStaticPathsResult<DendronNotePageParams> {
  const { notes, noteIndex } = getNotes();
  // filter out the index node
  const paths = Object.keys(notes)
    .filter((id) => id !== noteIndex.id)
    .map((id) => {
      return { params: { id } };
    });
  return {
    paths,
    fallback: false,
  };
}

/**
 * Reads the JSON contents of data/meta/<note>.json
 */
export function getNoteMeta(id: string): Promise<NoteProps> {
  const dataDir = getDataDir();
  return fs.readJSON(path.join(dataDir, NOTE_META_DIR, `${id}.json`));
}

let _CONFIG_CACHE: IntermediateDendronConfig | undefined;
export function getConfig(): Promise<IntermediateDendronConfig> {
  if (_.isUndefined(_CONFIG_CACHE)) {
    const dataDir = getDataDir();
    return fs.readJSON(path.join(dataDir, "dendron.json"));
  }
  return new Promise(() => _CONFIG_CACHE);
}

export function getPublicDir(): string {
  const publicDir = process.env.PUBLIC_DIR;
  if (!publicDir) {
    throw new Error("PUBLIC_DIR not set");
  }
  return publicDir;
}

export async function getCustomHead(): Promise<string | null> {
  const config = await getConfig();
  const publishingConfig = ConfigUtils.getPublishingConfig(config);
  const customHeadPathConfig = publishingConfig.customHeaderPath;
  if (_.isUndefined(customHeadPathConfig)) {
    return null;
  }
  const publicDir = getPublicDir();
  const headPath = path.join(publicDir, "header.html");
  return fs.readFileSync(headPath, { encoding: "utf-8" });
}
