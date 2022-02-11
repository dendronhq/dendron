import {
  ConfigUtils,
  DateTime,
  IntermediateDendronConfig,
  NoteProps,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { NoteData } from "../utils/types";
/**
 * INLINE all typescript dependencies
 */

process.env.DATA_DIR = "data";

let _NOTES_CACHE: NoteData | undefined;

export function getDataDir(): string {
  const dataDir = process.env.DATA_DIR;
  if (!dataDir) {
    throw new Error("DATA_DIR not set");
  }
  return dataDir;
}

export function getNotes() {
  if (_.isUndefined(_NOTES_CACHE)) {
    const dataDir = getDataDir();
    _NOTES_CACHE = fs.readJSONSync(
      path.join(dataDir, "notes.json")
    ) as NoteData;
  }
  return _NOTES_CACHE;
}

export function getNoteUrl(opts: { note: NoteProps; noteIndex: NoteProps }) {
  const { note, noteIndex } = opts;
  return note.id === noteIndex.id ? "/" : `/notes/${note.id}`;
}

function getRootUrlStatic() {
  const config = fs.readJSONSync(
    path.join("data", "dendron.json")
  ) as IntermediateDendronConfig;
  const publishingConfig = ConfigUtils.getPublishingConfig(config);
  let url = publishingConfig.siteUrl;
  const assetsPrefix = publishingConfig.assetsPrefix;
  if (assetsPrefix) {
    url += assetsPrefix;
  }
  return url;
}

const genSiteMap = async () => {
  const { notes, noteIndex } = getNotes();
  const fields = _.values(notes).map((note) => {
    const suffix = getNoteUrl({ note, noteIndex });
    const out = {
      loc: suffix,
      lastmod: DateTime.fromMillis(note.updated).toISO(),
    };
    return out;
  });
  return fields;
};

module.exports = {
  siteUrl: getRootUrlStatic(),
  generateRobotsTxt: true,
  additionalPaths: async () => {
    return genSiteMap();
  },
};
