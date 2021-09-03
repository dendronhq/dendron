import fs from "fs-extra";
import path from "path";
import { DendronConfig, NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from "lodash";
import { DateTime } from "luxon";
import { NoteData } from "./types";
import { getNoteUrl } from "./links";

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
  if(_.isUndefined(customHeadPathConfig)) {
    return null;
  }
  const publicDir = getPublicDir();
  const headPath = path.join(publicDir, customHeadPathConfig);
  return fs.readFileSync(headPath, { encoding: "utf-8" });
}

export function ISO2FormattedDate(time: string, format: Intl.DateTimeFormatOptions) { 
  const dt = DateTime.fromISO(time);
  return dt.toLocaleString(format);
}

export function millisToJSDate(ts: number) {
  const dt = DateTime.fromMillis(_.toInteger(ts));
  return dt.toJSDate();
}

export function millisToFormattedDate(ts: number, format: Intl.DateTimeFormatOptions) {
  const dt = DateTime.fromMillis(ts);
  return dt.toLocaleString(format);
}

export function generateCollectionBody(note: NoteProps) {
  if (note.children.length <= 0) {
    return "";
  }
  const noteData = getNotes();
  const notesDict = noteData.notes;
  let children = note.children.map((id) => notesDict[id]);
  children = _.sortBy(children, (ent) => {
    if(_.has(ent, "custom.date")) {
      const dt = DateTime.fromISO(ent.custom.date);
      return dt.toMillis();
    }
    return ent.created;
  });
  if (_.get(note, "custom.sort_order", "normal") === "reverse") {
    children = _.reverse(children);
  }
  const noteIndex = noteData.noteIndex;
  return children.map(
    (child) => generateCollectionItem(child, noteIndex)
  ).join("\n");
}

export function generateCollectionItem(note: NoteProps, noteIndex: NoteProps) {
  const out = [];
  const include = {};
  out.push(`<div class="list"}__item">`);
  out.push(
    `<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">`
  );
  out.push(`<h2 class="archive__item-title no_toc" itemprop="headline">`);
  
  const href = getNoteUrl({note, noteIndex});
  
  out.push(`<a href="${href}" rel="permalink">${note.title}</a>`);
  out.push(`</h2>`);
  try {
  const publishedDate = _.get(note, "custom.date", false)
    ? ISO2FormattedDate(note.custom.date, DateTime.DATE_SHORT)
    : millisToFormattedDate(note.created, DateTime.DATE_SHORT);
  out.push(
    `<p class="page__meta"><i class="far fa-clock" aria-hidden="true"></i> ${publishedDate} </p>`
  );
  } catch(err) {
    throw Error(`no date found for note ${note.id}`);
  }
  if (_.has(note, "custom.excerpt")) {
    out.push(
      `<p class="archive__item-excerpt" itemprop="description">${note.custom.excerpt}</p>`
    );
  }
  out.push(`</article></div>`);
  return out.join("\n");
}