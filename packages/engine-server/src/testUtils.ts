import {
  DNode,
  DNodeData,
  SchemaRawProps,
  genUUID
} from "@dendronhq/common-all";

import FileStorage from "./drivers/file/store";
import YAML from "yamljs";
import _ from "lodash";
import fs from "fs-extra";
import matter from "gray-matter";
import path from "path";

// const FIXTURES_DIR =
//     "/Users/kevinlin/projects/dendronv2/dendron/packages/electron-client/fixtures/store"
// TODO
//const FIXTURES_DIR = '/Users/kevinlin/Dropbox/Apps/Noah/notesv2';
// eslint-disable-next-line operator-linebreak
// TODO: don't hardcode
const FIXTURES_DIR =
  "/Users/kevinlin/projects/dendronv2/dendron/packages/engine-server/fixtures/store";
export const ROOT_ID = "root";
export const NOTE_FOO_PATH = "foo";
export const NOTE_FOO_CHILD_ONE_ID = "foo.one";

export const FOO_NOTE = {
  id: "foo",
  title: "foo"
};
export const FOO_SCHEMA = {
  title: "foo",
  id: "b111db5b-bc52-4977-893b-307522f89ea3",
  fname: "foo.schema",
  child: {
    id: "foo.two"
  }
};

export const SCHEMA_FOO_PARENT_ID = "root.schema";
export const TMP_DATA_DIR = "/tmp/dendron-tmp";
const CACHE_DIR = "/tmp/dendron-test-cache";

export class FileUtils {
  static writeMDFile = (root: string, fname: string, fm: any, body: string) => {
    const fmAndBody = matter.stringify(body, fm);
    return fs.writeFileSync(path.join(root, fname), fmAndBody);
  };
}

export function createFileStorage(root: string) {
  // TODO: update
  return new FileStorage({
    root
  });
}

export function createScope() {
  return { username: "kevin" };
}

export function readMdFile(root: string, fname: string) {
  return matter.read(path.join(root, fname));
}

export function readYAMLFile(root: string, fname: string): SchemaRawProps[] {
  const out = fs.readFileSync(path.join(root, `${fname}.yml`), "utf8");
  return YAML.parse(out) as SchemaRawProps[];
}

export function readFileForTest(root: string, fname: string, ext: string) {
  return fs.readFileSync(path.join(root, `${fname}.${ext}`), "utf8");
}

export function appendUUID(fname: string) {
  return `${fname}-${genUUID()}`;
}
function createTmpDir(dirPath: string) {
  const tmpDirPath = appendUUID(dirPath);
  fs.ensureDirSync(tmpDirPath);
  fs.emptyDirSync(tmpDirPath);
  return tmpDirPath;
}

export function setupTmpCacheDir(): string {
  return createTmpDir(CACHE_DIR);
}

export function setupTmpDendronDir(): string {
  const dirPath = appendUUID(TMP_DATA_DIR);
  fs.ensureDirSync(dirPath);
  fs.emptyDirSync(dirPath);
  fs.copySync(FIXTURES_DIR, dirPath);
  return dirPath;
}

export function rmTmpDendronDir(root: string) {
  return fs.removeSync(root);
}

export function toSnapshotProps(n1: DNode) {
  const out = _.omit(n1.toRawProps(), "id", "parent", "children");
  const parent = n1.parent?.title || "root";
  const children = n1.children.map(c => c.title);
  return { ...out, parent, children };
}

export function expectSnapshot(
  expect: jest.Expect,
  name: string,
  n1: DNode<DNodeData> | DNode<DNodeData>[]
) {
  let snap;
  if (_.isArrayLike(n1)) {
    snap = n1.map(n => toSnapshotProps(n));
  } else {
    snap = toSnapshotProps(n1);
  }
  expect(snap).toMatchSnapshot(name);
}

export function expectNodeEqual(
  expect: jest.Expect,
  n1: DNode<DNodeData>,
  n2: DNode<DNodeData>
) {
  expect(n1.id).toEqual(n2.id);
}
