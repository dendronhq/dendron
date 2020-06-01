import { Note, genUUID } from "@dendron/common-all";
import fs, { Dirent } from "fs";

import _ from "lodash";
import minimatch from "minimatch";

interface FileMeta {
  name: string;
}

type getAllFilesOpts = {
  root: string;
  exclude?: string[];
};

export function fileToNote(body: string, meta: FileMeta) {
  const title = meta.name;
  // read id from file or generate one based on thte tile
  const id = genUUID();
  const note = new Note({
    id,
    title,
    desc: "TODO",
    type: "note",
    schemaId: "-1",
    body,
    fname: meta.name
  });
  return note;
}

export function getAllFiles(opts: getAllFilesOpts): Dirent[] | string[] {
  const { root } = _.defaults(opts, {
    exclude: [".git", "Icon\r", ".*"]
  });
  const allFiles = fs.readdirSync(root, { withFileTypes: true });
  return _.reject(
    allFiles.map(dirent => {
      const { name: fname } = dirent;
      // match exclusions
      if (
        _.some([dirent.isDirectory(), globMatch(opts.exclude || [], fname)])
      ) {
        return null;
      }
      return dirent.name;
    }),
    _.isNull
  ) as Dirent[] | string[];
}

export function globMatch(patterns: string[] | string, fname: string): boolean {
  if (_.isString(patterns)) {
    return minimatch(fname, patterns);
  }
  return _.some(patterns, pattern => minimatch(fname, pattern));
}
