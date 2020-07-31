import {
  DEngine,
  DNodeRawProps,
  INoteOpts,
  Note,
  testUtils,
  SchemaUtils,
  Schema,
} from "@dendronhq/common-all";
import { FileTestUtils, LernaTestUtils } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DendronEngine } from "../engine";
import { setupTmpDendronDir } from "../testUtils";

function expectNoteProps(
  expect: jest.Expect,
  note: Note,
  expectedProps: INoteOpts
) {
  const propsToCheck = ["fname"].concat(_.keys(expectedProps));
  expect(_.pick(note, propsToCheck)).toEqual(expectedProps);
}

function stripEntropicData(ent: any) {
  return _.omit(ent, ["created", "updated"]);
}

describe("engine:exact", () => {
  let root: string;
  const queryMode = "note";
  let actualFiles: string[];
  let expectedFiles: string[];
  let engine: DEngine;

  beforeEach(() => {
    root = setupTmpDendronDir();
    engine = DendronEngine.getOrCreateEngine({
      root,
      forceNew: true,
      mode: "exact",
    });
  });

  afterEach(() => {
    expect(actualFiles).toEqual(expectedFiles);
    fs.removeSync(root);
  });

  describe("schema", () => {
    describe("basic", () => {
      test("init", async () => {
        await engine.init();
        testUtils.expectSnapshot(expect, "main", _.values(engine.schemas));
        const note = engine.notes["foo"];
        let schema = engine.schemas["foo"];
        const schemaMatch = SchemaUtils.matchNote(note, engine.schemas);
        expect(schemaMatch).toEqual(schema);
        const schemaNamespace = engine.schemas["bar"];
        expect(schemaNamespace.namespace).toBeTruthy();

        // case3
        schema = engine.schemas["test1-1"];
        expect(schema.children[0].id).toEqual("test1-1-1");
      });

      test("add node with schema", async () => {
        await engine.init();
        await engine.write(
          new Note({ id: "bar.ns.one.alpha", fname: "bar.ns.one.alpha" }),
          { newNode: true, parentsAsStubs: true }
        );
        const note = engine.notes["bar.ns.one.alpha"];
        const schema = engine.schemas["alpha"];
        const schemaMatch = SchemaUtils.matchNote(note, engine.schemas);
        expect(schemaMatch).toEqual(schema);
      });

      test("write schema", async () => {
        await engine.init();
        const schema = new Schema({ fname: "bond" });
        await engine.write(schema, {
          newNode: true,
          parentsAsStubs: true,
        });
        const schemaInEngine = engine.schemas["bond"];
        testUtils.expectSnapshot(expect, "schema", schemaInEngine);
        expect(
          _.pick(schemaInEngine.toRawProps(), [
            "id",
            "title",
            "fname",
            "parent",
            "children",
          ])
        ).toEqual({
          id: "bond",
          title: "bond",
          fname: "bond.schema",
          parent: "root",
          children: [],
        });
      });
    });
  });
  describe("note", () => {
    describe("basic", () => {
      test("create when empty", async () => {
        fs.removeSync(root);
        root = setupTmpDendronDir({ copyFixtures: false });
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
        testUtils.expectSnapshot(expect, "notes", _.values(engine.notes));
        testUtils.expectSnapshot(expect, "schemas", _.values(engine.schemas));
        const { content, data } = FileTestUtils.readMDFile(root, "root.md");
        expect(content).toMatchSnapshot("notes-root-content");
        expect(
          testUtils.omitEntropicProps(data as DNodeRawProps)
        ).toMatchSnapshot("notes-root-data");
        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          ["root.md"],
          {}
        );
      });

      test("create node", async () => {
        await engine.init();
        const bazNote = new Note({ id: "baz", fname: "baz" });
        bazNote.body = "baz.body";
        await engine.write(bazNote, { newNode: true });
        const baz = await engine.queryOne("baz", "note");
        // FIXME: the ids change, need a better way to test
        let bazMd = FileTestUtils.readMDFile(root, "baz.md");

        bazMd.data = stripEntropicData(bazMd.data);
        // @ts-ignore
        bazMd = _.omit(bazMd, ["path"]);
        expect(bazMd).toMatchSnapshot("bazMd");
        expect(stripEntropicData(baz.data.toRawProps())).toMatchSnapshot(
          "bazNode"
        );

        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          { add: ["baz.md"] }
        );
      });

      test("fetch node", async () => {
        await engine.init();
        testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
        // foo should be fully specified
        const resp = await engine.query("foo", queryMode);
        expect(resp.data[0].title).toEqual("foo");
        expect(resp.data[0].created).toEqual(123);
        expect(resp.data[0].updated).toEqual(456);
        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore()
        );
      });

      test("fetch node with custom att", async () => {
        await engine.init();
        const resp = await engine.query("foo.one", queryMode);
        expect(resp.data[0].title).toEqual("foo.one");
        expect(resp.data[0].custom).toEqual({ bond: 42 });
        expect(resp.data[0].toRawProps()).toMatchSnapshot();
        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore()
        );
      });

      test("write node with custom att", async () => {
        await engine.init();
        const note: Note = (await engine.query("foo.one", queryMode))
          .data[0] as Note;
        note.body = "foo.one.body";
        await engine.write(note);

        // check written note is still equal
        const noteUpdated: Note = (await engine.query("foo.one", queryMode))
          .data[0] as Note;
        expect(_.omit(note.toRawProps(), "body")).toEqual(
          _.omit(noteUpdated.toRawProps(), "body")
        );
        expect(_.trim(noteUpdated.body)).toEqual("foo.one.body");

        // check custom att is in file
        const { data } = FileTestUtils.readMDFile(root, "foo.one.md");
        expect(stripEntropicData(data)).toEqual({
          bond: 42,
          desc: "",
          id: "foo.one",
          title: "foo.one",
        });

        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore()
        );
      });

      test("add custom att to node", async () => {
        await engine.init();
        const note: Note = (await engine.query("foo", queryMode))
          .data[0] as Note;
        // add custom att
        note.custom.bond = true;
        await engine.write(note);
        const noteUpdated: Note = (await engine.query("foo", queryMode))
          .data[0] as Note;

        // check note has custom att
        expect(_.omit(note.toRawProps(), "body")).toEqual(
          _.omit(noteUpdated.toRawProps(), "body")
        );
        expect(_.trim(noteUpdated.body)).toEqual("");
        // check custom att in file
        const { content, data } = FileTestUtils.readMDFile(root, "foo.md");
        expect(_.trim(content)).toEqual("");
        expect(stripEntropicData(data)).toEqual({
          bond: true,
          desc: "",
          id: "foo",
          title: "foo",
        });

        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore()
        );
      });

      test("node has same attributes when re-initializing engine", async () => {
        await engine.init();
        const root1: Note = engine.notes.foo;
        const engine2 = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine2.init();
        const root2: Note = engine2.notes.foo;
        // TODO: don't omit when we fix stub nodes
        const [root1Raw, root2Raw] = _.map(
          [root1.toRawProps(), root2.toRawProps()],
          (ent) => _.omit(ent, "children")
        );
        expect(root1Raw).toEqual(root2Raw);
        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore()
        );
      });

      test("updateNode", async () => {
        await engine.init();
        testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
        const bazNote = new Note({ fname: "baz" });
        // foo should be fully specified
        await engine.updateNodes([bazNote], {
          newNode: true,
          parentsAsStubs: true,
        });
        const baz = await engine.queryOne("baz", "note");
        expect(
          testUtils.omitEntropicProps(baz.data.toRawProps())
        ).toMatchSnapshot("bazNote");
        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore()
        );
      });
    });

    describe("main", () => {
      test("open stub node", async () => {
        FileTestUtils.writeMDFile(root, "bar.two.md", {}, "bar.two.body");
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
        expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
        testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
        const resp = engine.query("bar.two", queryMode);
        expect((await resp).data[0].fname).toEqual("bar.two");

        const resp2 = engine.query("bar", queryMode);
        expect((await resp2).data[0].fname).toEqual("bar");
        expect(fs.readdirSync(root)).toMatchSnapshot("listDir2");

        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {
            add: ["bar.two.md"],
          }
        );
      });

      test("delete node with no children", async () => {
        await engine.init();
        const numNodesPre = _.values(engine.notes).length;
        const fooNode = await engine.queryOne("foo.one", "note");
        await engine.delete(fooNode.data.id);
        // should be less nodes
        expect(numNodesPre - 1).toEqual(_.values(engine.notes).length);
        const resp = await engine.query("foo", "note");
        // start of with three foo nodes, end up with two
        expect(resp.data.length).toEqual(4);
        // file should not be there
        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {
            remove: ["foo.one.md"],
          }
        );
      });

      test("delete node with children", async () => {
        await engine.init();
        const fooNode = await engine.queryOne("foo", "note");

        // delete foo
        await engine.delete(fooNode.data.id);
        expect(fs.readdirSync(root)).toMatchSnapshot("listDi2");
        const numNodesPre = _.values(engine.notes).length;
        testUtils.expectSnapshot(expect, "main", _.values(engine.notes));

        // because foo has children, exepect it to still exist as a stub
        const deletedNode = engine.notes[fooNode.data.id];
        expectNoteProps(expect, deletedNode, { fname: "foo", stub: true });

        // size should be the same
        expect(numNodesPre).toEqual(_.values(engine.notes).length);
        testUtils.expectSnapshot(expect, "main2", _.values(engine.notes));
        // foo file should be deleted
        [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {
            remove: ["foo.md"],
          }
        );
      });
    });

    describe("edge", () => {
      test("md exist, no schema file", async () => {
        fs.unlinkSync(path.join(root, "foo.schema.yml"));
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
        expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
        testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
        const resp = engine.query("root", "schema");
        expect((await resp).data[0].fname).toEqual("root.schema");
        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {
            add: [],
            remove: ["foo.schema.yml"],
          }
        );
      });

      test("no md file, schema exist", async () => {
        fs.unlinkSync(path.join(root, "root.md"));
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
        expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
        testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
        const fooNote = (await engine.query("foo", "note")).data[0];
        expect(fooNote.fname).toEqual("foo");
        testUtils.expectSnapshot(expect, "fooNote", fooNote);
        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {}
        );
      });

      test("no md file, no schema ", async () => {
        fs.unlinkSync(path.join(root, "foo.schema.yml"));
        fs.unlinkSync(path.join(root, "root.md"));
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
        expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
        testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
        const resp = engine.query("root", "note");
        expect((await resp).data[0].fname).toEqual("root");
        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {
            add: [],
            remove: ["foo.schema.yml"],
          }
        );
      });

      test("note without id", async () => {
        fs.unlinkSync(path.join(root, "foo.md"));
        FileTestUtils.writeMDFile(root, "foo.md", {}, "this is foo");
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {}
        );
        const fooNote = (await engine.query("foo", "note")).data[0];
        expect(fooNote.fname).toEqual("foo");
        testUtils.expectSnapshot(expect, "fooNote", fooNote);
      });

      test("note without fm", async () => {
        fs.unlinkSync(path.join(root, "foo.md"));
        fs.writeFileSync(path.join(root, "foo.md"), "this is foo");
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
        const fooNote = (await engine.query("foo", "note")).data[0];
        expect(fooNote.fname).toEqual("foo");
        testUtils.expectSnapshot(expect, "fooNote", fooNote);
        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          root,
          LernaTestUtils.fixtureFilesForStore(),
          {}
        );
      });
    });
  });
});
