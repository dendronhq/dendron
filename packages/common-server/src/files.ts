import {
  DNodeRaw,
  DNodeRawOpts,
  IDNode,
  Note,
  NoteData,
  NoteRawProps,
  genUUID
} from "@dendron/common-all";
import fs, { Dirent } from "fs";

import _ from "lodash";
import matter from "gray-matter";
import minimatch from "minimatch";
import path from "path";

interface FileMeta {
  name: string;
}

type getAllFilesOpts = {
  root: string;
  exclude?: string[];
};

export function fileMeta2Node(body: string, meta: FileMeta): Note {
  const title = meta.name;
  // read id from file or generate one based on thte tile
  const id = genUUID();
  const note = new Note({
    id,
    title,
    desc: "TODO",
    data: {
      schemaId: "-1"
    },
    body,
    fname: meta.name
  });
  return note;
}

export function deleteFile(fpath: string) {
  return fs.unlinkSync(fpath);
}

export function globMatch(patterns: string[] | string, fname: string): boolean {
  if (_.isString(patterns)) {
    return minimatch(fname, patterns);
  }
  return _.some(patterns, pattern => minimatch(fname, pattern));
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

export function mdFile2NodeProps(fpath: string): NoteRawProps {
  // NOTE: gray matter cache old date, need to pass empty options
  // to bypass
  // see https://github.com/jonschlinkert/gray-matter/issues/43
  const { data, content: body } = (matter.read(fpath, {}) as unknown) as {
    data: DNodeRawOpts<NoteData>;
    content: string;
  };
  const { name: fname } = path.parse(fpath);
  const dataProps = DNodeRaw.createProps({ ...data, fname, body });
  // DEBUG: data: {data}, fpath: {fpath}, dataProps: {dataProps}
  return dataProps;
}

// export function mdFile2Node(fpath: string): Note {
//   // NOTE: gray matter cache old date, need to pass empty options
//   // to bypass
//   // see https://github.com/jonschlinkert/gray-matter/issues/43
//   const { data, content: body } = (matter.read(fpath, {}) as unknown) as {
//     data: DNodeRawOpts;
//     content: string;
//   };
//   const { name } = path.parse(fpath);
//   if (!data.title) {
//     data.title = name.split(".").slice(-1)[0];
//   }
//   if (!data.id) {
//     data.id = genUUID();
//   }
//   const note = new Note({ ...data, body, fname: name });
//   return note;
// }

export function node2MdFile(node: IDNode, opts: { root: string }) {
  const { root } = opts;
  const { body, path: nodePath } = node;
  const meta = _.pick(node, [
    "id",
    "title",
    "desc",
    "updated",
    "created",
    "url",
    "path"
  ]);
  const parent = node.parent?.id || null;
  const children = node.children.map(c => c.id);
  const filePath = path.join(root, `${nodePath}.md`);
  return fs.writeFileSync(
    filePath,
    matter.stringify(body || "", { ...meta, parent, children })
  );
}
