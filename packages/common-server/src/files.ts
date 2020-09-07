import {
  DNodeRaw,
  genUUID,
  Note,
  NoteRawProps,
  Schema,
} from "@dendronhq/common-all";
import fs, { Dirent } from "fs";
import matter from "gray-matter";
import YAML from "js-yaml";
import _ from "lodash";
import minimatch from "minimatch";
import os from "os";
import path from "path";

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
    const { name: fname, dir } = path.parse(name);
    // strip off extension
    name = path.join(dir, fname);
  }
  name = name.replace(/\./g, "-");
  // replace all names already in file name
  //name = name.replace(/\./g, "-");
  name = cleanName(name);
  // if file, only get name (no extension)
  return name;
}

export function readMD(fpath: string): { data: any; content: string } {
  return matter.read(fpath, {});
}

export function readYAML(fpath: string): any {
  return YAML.safeLoad(fs.readFileSync(fpath, { encoding: "utf8" }), {
    schema: YAML.JSON_SCHEMA,
  });
}

export function writeYAML(fpath: string, data: any) {
  const out = YAML.safeDump(data, { indent: 4, schema: YAML.JSON_SCHEMA });
  return fs.writeFileSync(fpath, out);
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
  const { data, content: body } = matter(
    fs.readFileSync(fpath, { encoding: "utf8" }),
    {
      engines: {
        yaml: {
          // @ts-ignore
          parse: (s) => YAML.safeLoad(s, { schema: YAML.JSON_SCHEMA }),
          stringify: (s) => YAML.safeDump(s, { schema: YAML.JSON_SCHEMA }),
        },
      },
    }
  );
  const { name: fname } = path.parse(fpath);
  const dataProps = DNodeRaw.createProps({ ...data, fname, body });
  return dataProps as NoteRawProps;
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
  const { root } = opts;
  const { fname } = node;
  const filePath = path.join(root, `${fname}.md`);
  return fs.writeFileSync(filePath, node.render());
}

export function schema2YMLFile(schema: Schema, opts: { root: string }) {
  const { root } = opts;
  const { fname } = schema;
  const filePath = path.join(root, `${fname}.yml`);
  const out = schema.render();
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
    return path.join(root, filePath);
  }
}

export function removeMDExtension(nodePath: string) {
  const idx = nodePath.lastIndexOf(".md");
  if (idx > 0) {
    nodePath = nodePath.slice(0, idx);
  }
  return nodePath;
}
