import {
  DNode,
  DNodeData,
  genUUID
} from "@dendronhq/common-all";
import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import FileStorage from "./drivers/file/store";
import { EngineTestUtils } from "@dendronhq/common-server";

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

export class FixtureUtils {
  static fixtureFiles = (): string[] => {
    return fs.readdirSync(FIXTURES_DIR);
  }
}

export function createFileStorage(root: string) {
  // TODO: update
  return new FileStorage({
    root
  });
}

export function readMdFile(root: string, fname: string) {
  return matter.read(path.join(root, fname));
}

export function setupTmpDendronDir(): string {
  return EngineTestUtils.setupStoreDir(FIXTURES_DIR, TMP_DATA_DIR);
}

export function rmTmpDendronDir(root: string) {
  return fs.removeSync(root);
}

