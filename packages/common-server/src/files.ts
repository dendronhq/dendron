import {
  DNodeRaw,
  DNodeRawOpts,
  genUUID,
  Note,
  NoteData,
  NoteRawProps,
  Schema,
} from "@dendronhq/common-all";
import fs, { Dirent } from "fs";
import matter from "gray-matter";
import _ from "lodash";
import minimatch from "minimatch";
import path, { posix } from "path";
import YAML from "yamljs";
import os from "os";

interface FileMeta {
  name: string;
}

export type getAllFilesOpts = {
  root: string;
  include?: string[];
  exclude?: string[];
  withFileTypes?: boolean;
};

/**
 * Make name safe for dendron
 * @param name
 * @param opts
 */
export function cleanName(name: string): string {
  name = name.replace(/\//g, ".").toLocaleLowerCase();
  name = name.replace(/ /g, "-");
  return name;
}

/**
 *
 * Normalize file name
 * - strip off extension
 * - replace [.\s] with -
 * @param name
 * @param opts
 *   - isDir: dealing with directory
 */
export function cleanFileName(
  name: string,
  opts?: { isDir?: boolean }
): string {
  const cleanOpts = _.defaults(opts, { isDir: false });
  if (!cleanOpts.isDir) {
    const { name: fname, dir } = posix.parse(name);
    name = posix.join(dir, fname);
    name = name.replace(/\./g, "-");
  }
  // replace all names already in file name
  //name = name.replace(/\./g, "-");
  name = cleanName(name);
  // if file, only get name (no extension)
  return name;
}

export function fileMeta2Node(body: string, meta: FileMeta): Note {
  const title = meta.name;
  // read id from file or generate one based on thte tile
  const id = genUUID();
  const note = new Note({
    id,
    title,
    desc: "TODO",
    data: {
      schemaId: "-1",
    },
    body,
    fname: meta.name,
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
  return _.some(patterns, (pattern) => minimatch(fname, pattern));
}

export function getAllFiles(opts: getAllFilesOpts): Dirent[] | string[] {
  const { root, withFileTypes } = _.defaults(opts, {
    exclude: [".git", "Icon\r", ".*"],
    withFileTypes: false,
  });
  const allFiles = fs.readdirSync(root, { withFileTypes: true });
  return _.reject(
    allFiles.map((dirent) => {
      const { name: fname } = dirent;
      // match exclusions
      if (
        _.some([dirent.isDirectory(), globMatch(opts.exclude || [], fname)])
      ) {
        return null;
      }
      // match inclusion
      if (opts.include && !globMatch(opts.include, fname)) {
        return null;
      }
      if (withFileTypes) {
        return dirent;
      } else {
        return dirent.name;
      }
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

export function node2PropsMdFile(props: NoteRawProps, opts: { root: string }) {
  const { root } = opts;
  const { body, fname, custom } = props;
  const filePath = path.join(root, `${fname}.md`);
  const blacklist = [
    "body",
    "stub",
    "data",
    "custom",
    "fname",
    "parent",
    "children",
  ];
  return fs.writeFileSync(
    filePath,
    matter.stringify(body || "", { ..._.omit(props, blacklist), ...custom })
  );
}

/**
 * Convert a node to a MD File. Any custom attributes will be
 * added to the end
 *
 * @param node: node to convert
 * @param opts
 *   - root: root folder where files should be written to
 */
export function node2MdFile(node: Note, opts: { root: string }) {
  const meta = _.pick(node, [
    "id",
    "title",
    "desc",
    "updated",
    "created",
    "data",
    "custom",
    "fname",
    "stub",
    "body",
  ]);
  // only save parent id if parent is not a stub
  const parent = node.parent && !node.parent.stub ? node.parent.id : null;
  const children = node.children.map((c) => c.id);
  const props: NoteRawProps = {
    ...meta,
    parent,
    children,
  };
  return node2PropsMdFile({ ...props }, opts);
}

export function schema2YMLFile(schema: Schema, opts: { root: string }) {
  const { root } = opts;
  const { fname } = schema;
  const filePath = path.join(root, `${fname}.yml`);
  const out = YAML.stringify(schema.toRawPropsRecursive(), undefined, 4);
  return fs.writeFileSync(filePath, out);
}

export function resolveTilde(filePath: string) {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  // '~/folder/path' or '~'
  if (filePath[0] === "~" && (filePath[1] === "/" || filePath.length === 1)) {
    return filePath.replace("~", os.homedir());
  }
  return filePath;
}

/**
 * Resolve file path and resolve relative paths relative to `root`
 * @param filePath
 * @param root
 */
export function resolvePath(filePath: string, root?: string): string {
  const platform = os.platform();
  const isWin = platform === "win32";
  if (filePath[0] === "~") {
    return resolveTilde(filePath);
  } else if (
    path.isAbsolute(filePath) ||
    (isWin && filePath.startsWith("\\"))
  ) {
    return filePath;
  } else {
    if (!root) {
      throw Error("can't use rel path without a workspace root set");
    }
    return posix.join(root, filePath);
  }
}
