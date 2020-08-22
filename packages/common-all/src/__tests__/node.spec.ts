import {
  DNodeUtils,
  Note,
  NoteUtils,
  Schema,
  SchemaUtils,
  UNKNOWN_SCHEMA_ID,
} from "../node";

import { expectSnapshot, testUtilsCommonAll } from "../testUtils";
import _ from "lodash";

function setupNotes() {
  const baz = new Note({
    fname: "baz",
  });
  const foo = new Note({
    fname: "foo",
  });
  const fooChild = new Note({
    fname: "foo.one",
  });
  const fooGrandChild = new Note({
    fname: "foo.one.alpha",
  });
  const fooTwoBeta = new Note({
    fname: "foo.two.beta",
  });
  const bar = new Note({ fname: "bar" });
  const barChild = new Note({ fname: "bar.one" });
  const barChildNamespaceExact = new Note({ fname: "bar.one.alpha-namespace" });
  const barChildNamespaceChild = new Note({
    fname: "bar.one.alpha-namespace.alpha",
  });
  const barGrandChild = new Note({ fname: "bar.one.alpha" });
  const root = new Note({ id: "root", fname: "root" });
  fooChild.addChild(fooGrandChild);
  foo.addChild(fooChild);
  root.addChild(foo);
  root.addChild(baz);
  bar.addChild(barChild);
  barChild.addChild(barGrandChild);
  bar.addChild(barChildNamespaceExact);
  barChildNamespaceExact.addChild(barChildNamespaceChild);
  return {
    foo,
    fooChild,
    fooGrandChild,
    bar,
    barChild,
    barChildNamespaceExact,
    barChildNamespaceChild,
    barGrandChild,
    root,
    fooTwoBeta,
    baz,
  };
}

function setupSchema() {
  const bar = new Schema({
    id: "bar",
    fname: "bar.schema.yml",
    parent: null,
    data: { namespace: true },
  });
  const barChildNamespace = new Schema({
    id: "alpha-namespace",
    fname: "bar.schema.yml",
    parent: null,
    data: { namespace: true },
  });
  const foo = new Schema({
    id: "foo",
    desc: "foo desc",
    fname: "foo.schema.yml",
    parent: null,
  });
  const fooChild = new Schema({
    id: "one",
    fname: "foo.schema.yml",
    parent: null,
  });
  const fooGrandChild = new Schema({
    id: "alpha",
    fname: "foo.schema.yml",
    parent: null,
  });
  const root = Schema.createRoot();
  root.addChild(foo);
  root.addChild(bar);
  foo.addChild(fooChild);
  fooChild.addChild(fooGrandChild);
  bar.addChild(barChildNamespace);
  return { foo, fooChild, fooGrandChild, bar, barChildNamespace };
}

describe("DNoteUtils", () => {
  let notes: ReturnType<typeof setupNotes>;

  describe("basename", () => {
    test("simple", () => {
      expect(DNodeUtils.basename("foo.bar.md")).toEqual("md");
    });
    test("simple, rm extension", () => {
      expect(DNodeUtils.basename("foo.bar.md", true)).toEqual("bar");
    });
    test("simple, rm extension, no extension", () => {
      expect(DNodeUtils.basename("foo.bar", true)).toEqual("bar");
    });
  });

  describe("findClosestParent, parent", () => {
    beforeEach(() => {
      notes = setupNotes();
    });

    test("grandchild -> parent", () => {
      const resp = DNodeUtils.findClosestParent("foo.one.alpha", notes);
      resp.fname = "foo.one";
      expectSnapshot(expect, "main", resp);
    });

    test("grandchild -> domain root", () => {
      const resp = DNodeUtils.findClosestParent("baz.one.alpha", notes);
      resp.fname = "baz";
      expectSnapshot(expect, "main", resp);
    });

    test("grandchild -> root", () => {
      const resp = DNodeUtils.findClosestParent("bond.one.alpha", notes);
      resp.fname = "root";
      expectSnapshot(expect, "main", resp);
    });
  });
});

describe("SchemaUtils", () => {
  let notes: ReturnType<typeof setupNotes>;
  let schemas: ReturnType<typeof setupSchema>;

  beforeEach(() => {
    notes = setupNotes();
    schemas = setupSchema();
  });

  describe("string", () => {
    test("node: domain", () => {
      const fooSchema = SchemaUtils.matchNote("foo", schemas);
      expectSnapshot(expect, "schemas", _.values(schemas));
      expect(fooSchema).toEqual(schemas.foo);
    });

    test("end with dot", () => {
      const fooSchema = SchemaUtils.matchNote("foo.", schemas);
      expect(fooSchema).toEqual(schemas.foo);
    });

    test("end full-name, normal schema", () => {
      const fooChildSchema = SchemaUtils.matchNote("foo.one", schemas);
      expect(fooChildSchema).toEqual(schemas.fooChild);
    });

    test("end with dot, namespace schema", () => {
      const barSchema = SchemaUtils.matchNote("bar.", schemas);
      expect(barSchema).toEqual(schemas.bar);
    });

    test("end mid-name, namespace schema", () => {
      const barSchema = SchemaUtils.matchNote("bar.foo", schemas);
      expect(barSchema).toEqual(schemas.bar);
    });
  });

  describe("note", () => {
    test("matchDomain", () => {
      const fooNote = notes.foo;
      const fooSchema = SchemaUtils.matchNote(fooNote, schemas);
      expectSnapshot(expect, "schemas", _.values(schemas));
      expect(fooSchema).toEqual(schemas.foo);
    });

    test("matchChild", () => {
      const note = notes.fooChild;
      const schema = SchemaUtils.matchNote(note, schemas);
      expect(schema).toEqual(schemas.fooChild);
    });

    test("matchChildNamespace", () => {
      const note = notes.barChild;
      const schema = SchemaUtils.matchNote(note, schemas);
      expect(schema).toEqual(schemas.bar);
    });

    test("matchChildNamespace:childAlsoNamespace:exact", () => {
      const note = notes.barChildNamespaceExact;
      const schema = SchemaUtils.matchNote(note, schemas);
      expect(schema.toRawProps()).toEqual(
        schemas.barChildNamespace.toRawProps()
      );
    });

    test("matchChildNamespace:childAlsoNamespace:child", () => {
      const note = notes.barChildNamespaceExact;
      const schema = SchemaUtils.matchNote(note, schemas);
      expect(schema.toRawProps()).toEqual(
        schemas.barChildNamespace.toRawProps()
      );
    });

    test("namespace no match grandchild", () => {
      const note = notes.barGrandChild;
      const schema = SchemaUtils.matchNote(note, schemas);
      expect(schema).toEqual(Schema.createUnkownSchema());
    });

    test("matchGrandChild", () => {
      const note = notes.fooGrandChild;
      const schema = SchemaUtils.matchNote(note, schemas);
      expect(schema).toEqual(schemas.fooGrandChild);
      const note2 = notes.fooTwoBeta;
      const schema2 = SchemaUtils.matchNote(note2, schemas);
      expect(schema2).toEqual(Schema.createUnkownSchema());
    });
  });
});

describe("NoteUtils", () => {
  let notes: ReturnType<typeof setupNotes>;
  test("createStubNotes, root -> bar.one", () => {
    notes = setupNotes();
    NoteUtils.createStubNotes(notes.root, notes.barChild);
    expect(notes.barChild.parent).not.toBeNull();
    expect(notes.barChild.parent?.stub).toBe(true);
    expect(notes.root.children.length).toEqual(3);
    expectSnapshot(expect, "barChild", notes.barChild.nodes);
  });

  test("createStubNotes, foo -> foo.two.beta", () => {
    notes = setupNotes();
    NoteUtils.createStubNotes(notes.foo, notes.fooTwoBeta);
    expect(notes.fooTwoBeta.parent).not.toBeNull();
    expect(notes.fooTwoBeta.parent?.stub).toBe(true);
    expect(notes.root.children.length).toEqual(2);
    expect(notes.foo.children.length).toEqual(2);
  });

  test("createStubNotes, bar (stub) -> bar.two.beta", () => {
    notes = setupNotes();
    const barStub = Note.createStub("bar");
    notes.root.addChild(barStub);
    NoteUtils.createStubNotes(barStub, new Note({ fname: "bar.two.beta" }));
    const barStubChild = barStub.children[0];
    expect(barStubChild?.stub).toBe(true);
    expect(barStubChild?.fname).toBe("bar.two");
    expect(barStubChild?.children.length).toEqual(1);
  });
});

describe("Note", () => {
  let notes: ReturnType<typeof setupNotes>;
  let schemas: ReturnType<typeof setupSchema>;

  beforeEach(() => {
    notes = setupNotes();
    schemas = setupSchema();
  });

  describe("create", () => {
    test("fromSchema", () => {
      const dirPath = "root";
      const note = Note.fromSchema(dirPath, schemas.foo);
      expect(note.desc).toEqual(schemas.foo.desc);
      testUtilsCommonAll.expectSnapshot(expect, "noteFromSchema", note);
    });
  });
});

describe("Schema", () => {
  let schemas: ReturnType<typeof setupSchema>;

  beforeEach(() => {
    schemas = setupSchema();
  });

  describe("basic", () => {
    test("unknown schema", () => {
      const schema = Schema.createUnkownSchema();
      expect(schema.id).toEqual(UNKNOWN_SCHEMA_ID);
      expect(schema.stub).toBe(true);
      testUtilsCommonAll.expectSnapshot(expect, "unknown", schema);
    });

    test("render", () => {
      const schema = new Schema({ fname: "foo" });
      const body = schema.render();
      expect(body).toMatchSnapshot("schema.render");
    });
  });

  describe("domainRoot", () => {
    test("at root", () => {
      const { foo } = schemas;
      expect(foo.domain.id).toEqual(foo.id);
      expect(foo.logicalPath).toEqual("foo");
      expect(foo.renderBody()).toMatchSnapshot("foo_body");
    });

    test("at child", () => {
      const { fooChild, foo } = schemas;
      expect(fooChild.domain.id).toEqual(foo.id);
      expect(fooChild.logicalPath).toEqual("foo/one");
      expect(fooChild.renderBody()).toMatchSnapshot("fooChild_body");
    });

    test("at child namespace", () => {
      const { bar: schema } = schemas;
      expect(schema.logicalPath).toEqual("bar/*");
    });

    test("at grand child", () => {
      const { fooGrandChild, foo } = schemas;
      expect(fooGrandChild.logicalPath).toEqual("foo/one/alpha");
      expect(fooGrandChild.domain.id).toEqual(foo.id);
    });
  });
});
