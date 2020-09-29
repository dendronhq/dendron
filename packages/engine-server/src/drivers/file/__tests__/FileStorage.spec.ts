import {
  AssertionError,
  IDNode,
  QueryMode,
  Schema,
  SchemaUtils,
  testUtils,
} from "@dendronhq/common-all";
import {
  createLogger,
  EngineTestUtils,
  FileTestUtils,
  NodeTestUtils,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { GitCache } from "../../../cache/gitCache";
import { createFileStorage } from "../../../testUtils";
import FileStorage from "../store";

describe("main", () => {
  let root: string;
  let store: FileStorage;

  beforeEach(() => {
    root = EngineTestUtils.setupStoreDir();
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
        const resp = await store.query("**/*", queryMode, {});
        const data = resp.data as IDNode[];
        const nodeOrig = _.find(data, (n) => n.title === "foo.one") as IDNode;
        await store.delete(nodeOrig.id);
        await expect(store.get(nodeOrig.id, {})).rejects.toThrow(
          AssertionError
        );
        expect(() => {
          FileTestUtils.readMDFile(root, "foo.one.md");
        }).toThrow(/ENOENT/);
      });
    });

    describe("get", () => {
      test("get root", async () => {
        const resp = await store.query("**/*", queryMode, {});
        const nodeOrig = _.find(resp.data, (n) => n.title === "root") as IDNode;
        const respGet = await store.get(nodeOrig.id, {});
        const node = respGet.data;
        expect(node).not.toBeUndefined();
        expect(node.fname).toEqual("root");
      });

      test("get foo.one", async () => {
        const resp = await store.query("**/*", queryMode, {});
        const nodeOrig = _.find(
          resp.data,
          (n) => n.title === "foo.one"
        ) as IDNode;
        const respGet = await store.get(nodeOrig.id, {});
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
      test("with missing", async () => {
        FileTestUtils.writeMDFile(
          root,
          "bar.one.alpha.md",
          {},
          "bar alpha content"
        );
        store = createFileStorage(root);
        const resp = await store.query("**/*", queryMode, {});
        const bar = _.find(resp.data, { fname: "bar" });
        const barOne = _.find(resp.data, { fname: "bar.one" });
        expect(bar).not.toBeNull();
        expect(bar?.stub).toBeTruthy();
        expect(barOne).not.toBeNull();
        expect(barOne?.stub).toBeTruthy();
        testUtils.expectSnapshot(expect, "missing snapshots", resp.data);
      });

      test("all", async () => {
        const resp = await store.query("**/*", queryMode, {});
        const rootNode = _.find(resp.data, (n) => n.title === "root") as Schema;
        const foo = _.find(resp.data, (n) => n.title === "foo") as Schema;
        const fooChild = _.find(
          resp.data,
          (n) => n.title === "foo.one"
        ) as Schema;
        expect(rootNode).not.toBeUndefined();
        expect(fooChild).not.toBeUndefined();
        // expect parent
        expect(fooChild.domain.title).toEqual("foo");
        expect(fooChild.parent?.id).toEqual(foo.id);
        testUtils.expectSnapshot(expect, "raw-props", fooChild);
      });
    });

    describe("write", () => {
      test("writeQuery", async () => {
        const resp = await store.query("**/*", queryMode, {});
        const node = _.find(resp.data, (n) => n.title === "foo.one") as IDNode;
        node.body = "bond";
        await store.write(node);
        const { data, content } = FileTestUtils.readMDFile(root, "foo.one.md");
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
      test("sanity", async () => {
        const resp = await store.query("**/*", queryMode, {});
        const bar = _.find(resp.data, (n) => n.id === "bar") as Schema;
        expect(bar.namespace).toBe(true);
      });

      test("all", async () => {
        const resp = await store.query("**/*", queryMode, {});
        const rootNode = _.find(resp.data, (n) => n.title === "root") as IDNode;
        const foo = _.find(resp.data, (n) => n.title === "foo") as IDNode;
        const node = SchemaUtils.matchNote("foo.one", resp.data as Schema[]);
        //const node = _.find(resp.data, (n) => n.title === "one") as IDNode;
        expect(rootNode).not.toBeUndefined();
        expect(node).not.toBeUndefined();
        expect(node.parent?.id).toEqual(foo.id);
      });
    });

    describe("write", () => {
      test("writeRoot", async () => {
        await store.write(Schema.createRoot());
        const rootYml = FileTestUtils.readYMLFile(root, "root.schema.yml");
        expect(testUtils.omitEntropicProps(rootYml[0])).toMatchSnapshot("root");
      });
    });
  });
});

describe("use cache", () => {
  let queryMode: QueryMode;

  describe("notes", () => {
    let root: string;
    let store: FileStorage;

    beforeAll(() => {
      queryMode = "note";
    });

    beforeEach(() => {
      root = EngineTestUtils.setupStoreDir({
        copyFixtures: false,
        initDirCb: (dirPath: string) => {
          NodeTestUtils.createNotes(dirPath, [
            {
              id: "id-bar",
              fname: "bar",
            },
            {
              id: "id-bar.one",
              fname: "bar.one",
            },
          ]);
        },
      });
      store = new FileStorage({
        root,
        cache: new GitCache({ root }),
        logger: createLogger(
          "FileStorage",
          path.join("/tmp", "engine-server.txt"),
          { lvl: "debug" }
        ),
      });
    });

    test("query ", async () => {
      const resp = await store.query("**/*", queryMode, {});
      expect(resp.data.map((ent) => ent.toRawProps())).toMatchSnapshot();
    });
  });
});
