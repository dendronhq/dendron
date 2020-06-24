import {
  AssertionError,
  IDNode,
  QueryMode,
  Schema
} from "@dendronhq/common-all";
import {
  createFileStorage,
  createScope,
  expectSnapshot,
  readMdFile,
  setupTmpDendronDir
} from "../../../testUtils";

import FileStorage from "../store";
import _ from "lodash";
import fs from "fs-extra";

describe("main", () => {
  let root: string;
  let store: FileStorage;

  beforeEach(() => {
    root = setupTmpDendronDir();
    store = createFileStorage(root);
  });

  afterEach(() => {
    fs.removeSync(root);
  });

  describe("notes", () => {
    let queryMode: QueryMode;

    beforeAll(() => {
      queryMode = "note";
    });

    describe("delete", () => {
      test("delete foo.one", async () => {
        const resp = await store.query(createScope(), "**/*", queryMode, {});
        const nodeOrig = _.find(
          resp.data,
          n => n.title === "foo.one"
        ) as IDNode;
        await store.delete(nodeOrig.id);
        await expect(store.get(createScope(), nodeOrig.id, {})).rejects.toThrow(
          AssertionError
        );
        expect(() => {
          readMdFile(root, "foo.one.md");
        }).toThrow(/ENOENT/);
      });
    });

    describe("get", () => {
      test("get root", async () => {
        const resp = await store.query(createScope(), "**/*", queryMode, {});
        const nodeOrig = _.find(resp.data, n => n.title === "root") as IDNode;
        const respGet = await store.get(createScope(), nodeOrig.id, {});
        const node = respGet.data;
        expect(node).not.toBeUndefined();
        expect(node.fname).toEqual("root");
      });

      test("get foo.one", async () => {
        const resp = await store.query(createScope(), "**/*", queryMode, {});
        const nodeOrig = _.find(
          resp.data,
          n => n.title === "foo.one"
        ) as IDNode;
        const respGet = await store.get(createScope(), nodeOrig.id, {});
        const node = respGet.data;
        expect(node).not.toBeUndefined();
        expect(node.fname).toEqual("foo.one");
      });
    });

    /**
     * Hiearchy:
     * - foo
     *   - foo.one
     *   - foo.two
     */
    describe("query", () => {
      test("all", async () => {
        const resp = await store.query(createScope(), "**/*", queryMode, {});
        const rootNode = _.find(resp.data, n => n.title === "root") as Schema;
        const foo = _.find(resp.data, n => n.title === "foo") as Schema;
        const fooChild = _.find(
          resp.data,
          n => n.title === "foo.one"
        ) as Schema;
        expect(rootNode).not.toBeUndefined();
        expect(fooChild).not.toBeUndefined();
        // expect parent
        expect(fooChild.domain.title).toEqual("foo");
        expect(fooChild.parent?.id).toEqual(foo.id);
        expectSnapshot(expect, "raw-props", fooChild);
      });
    });

    describe("write", () => {
      test("writeQuery", async () => {
        const scope = createScope();
        const resp = await store.query(scope, "**/*", queryMode, {});
        const node = _.find(resp.data, n => n.title === "foo.one") as IDNode;
        node.body = "bond";
        await store.write(scope, node);
        const { data, content } = readMdFile(root, "foo.one.md");
        expect(data.title).toEqual("foo.one");
        expect(content).toEqual("bond\n");
        expect(content).toMatchSnapshot("data snapshot");
      });
    });
  });

  describe("schema", () => {
    let queryMode: QueryMode;

    beforeAll(() => {
      queryMode = "schema";
    });

    describe("query", () => {
      test("all", async () => {
        const resp = await store.query(createScope(), "**/*", queryMode, {});
        const rootNode = _.find(resp.data, n => n.title === "root") as IDNode;
        const foo = _.find(resp.data, n => n.title === "foo") as IDNode;
        const node = _.find(resp.data, n => n.title === "one") as IDNode;
        expect(rootNode).not.toBeUndefined();
        expect(node).not.toBeUndefined();
        expect(node.parent?.id).toEqual(foo.id);
      });
    });
  });
});
