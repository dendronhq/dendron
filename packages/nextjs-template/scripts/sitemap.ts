import { DateTime } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { getNotes } from "../utils/build";
import { getNoteUrl } from "../utils/links";

process.env.DATA_DIR = "data";

function getRootUrlStatic() {
  const config = fs.readJSONSync(path.join("data", "dendron.json"));
  let url = config.site.siteUrl;
  const assetsPrefix = config.site.assetsPrefix;
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
