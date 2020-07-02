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
import { EngineTestUtils, LernaTestUtils } from "@dendronhq/common-server";

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

export function createFileStorage(root: string) {
  // TODO: update
  return new FileStorage({
    root
  });
}

export function setupTmpDendronDir(): string {
  return EngineTestUtils.setupStoreDir(LernaTestUtils.getFixturesDir("store"), TMP_DATA_DIR);
}

export function rmTmpDendronDir(root: string) {
  return fs.removeSync(root);
}

