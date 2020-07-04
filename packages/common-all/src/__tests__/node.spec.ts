import { DNodeUtils, Note, NoteUtils, Schema, SchemaUtils } from "../node";

import { expectSnapshot } from "../testUtils";
import _ from "lodash";

function setupNotes() {
  const baz = new Note({
    fname: "baz"
  });
  const foo = new Note({
    fname: "foo"
  });
  const fooChild = new Note({
    fname: "foo.one"
  });
  const fooGrandChild = new Note({
    fname: "foo.one.alpha"
  });
  const fooTwoBeta = new Note({
    fname: "foo.two.beta"
  });
  const bar= new Note({ fname: "bar" });
  const barChild = new Note({ fname: "bar.one" });
  const root = new Note({ id: "root", fname: "root" });
  fooChild.addChild(fooGrandChild);
  foo.addChild(fooChild);
  root.addChild(foo);
  bar.addChild(barChild);
  return { foo, fooChild, fooGrandChild, bar, barChild, root, fooTwoBeta, baz };
}

function setupSchema() {
  const bar= new Schema({
    id: "bar",
    fname: "bar.schema.yml",
    parent: null
  });
  const barChildNamespace = new Schema({
    id: "bar",
    fname: "bar.schema.yml",
    parent: null,
    data: {namespace: true}
  });
  const foo = new Schema({
    id: "foo",
    fname: "foo.schema.yml",
    parent: null
  });
  const fooChild = new Schema({
    id: "one",
    fname: "foo.schema.yml",
    parent: null
  });
  const fooGrandChild = new Schema({
    id: "alpha",
    fname: "foo.schema.yml",
    parent: null
  });
  foo.addChild(fooChild);
  fooChild.addChild(fooGrandChild);
  bar.addChild(barChildNamespace);
  return { foo, fooChild, fooGrandChild, bar, barChildNamespace };
}

describe("DNoteUtils", () => {
  let notes: ReturnType<typeof setupNotes>;
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

  beforeEach(()=> {
    notes = setupNotes();
    schemas = setupSchema();
  });

  test("matchDomain", () => {
    const fooNote = notes.foo
    const fooSchema =SchemaUtils.matchNote(fooNote, schemas);
    expectSnapshot(expect, "schemas", _.values(schemas));
    expect(fooSchema).toEqual(schemas.foo);
  });

  test("matchChild", () => {
    const note = notes.fooChild
    const schema =SchemaUtils.matchNote(note, schemas);
    expect(schema).toEqual(schemas.fooChild);
  });

  test("matchChildNamespace", () => {
    const note = notes.barChild
    const schema = SchemaUtils.matchNote(note, schemas);
    expect(schema).toEqual(schemas.barChildNamespace);
  });


  test("matchGrandChild", () => {
    const note = notes.fooGrandChild;
    const schema =SchemaUtils.matchNote(note, schemas);
    expect(schema).toEqual(schemas.fooGrandChild);
    const note2 = notes.fooTwoBeta;
    const schema2 =SchemaUtils.matchNote(note2, schemas);
    expect(schema2).toBeUndefined();
  });


});

describe("NoteUtils", () => {
  let notes: ReturnType<typeof setupNotes>;
  test("createStubNotes, root -> bar.one", () => {
    notes = setupNotes();
    NoteUtils.createStubNotes(notes.root, notes.barChild);
    expect(notes.barChild.parent).not.toBeNull();
    expect(notes.barChild.parent?.stub).toBe(true);
    expect(notes.root.children.length).toEqual(2);
    expectSnapshot(expect, "barChild", notes.barChild.nodes);
  });

  test("createStubNotes, foo -> foo.two.beta", () => {
    notes = setupNotes();
    NoteUtils.createStubNotes(notes.foo, notes.fooTwoBeta);
    expect(notes.fooTwoBeta.parent).not.toBeNull();
    expect(notes.fooTwoBeta.parent?.stub).toBe(true);
    expect(notes.root.children.length).toEqual(1);
    expect(notes.foo.children.length).toEqual(2);
  });

  test("createStubNotes, bar (stub) -> bar.two.beta", () => {
    notes = setupNotes();
    const barStub = Note.createStub("bar")
    notes.root.addChild(barStub);
    NoteUtils.createStubNotes(barStub, new Note({fname: "bar.two.beta"}));
    const barStubChild = barStub.children[0]
    expect(barStubChild?.stub).toBe(true);
    expect(barStubChild?.fname).toBe("bar.two");
    expect(barStubChild?.children.length).toEqual(1);
  });
});

describe("Schema", () => {
  let schemas: ReturnType<typeof setupSchema>;

  beforeEach(() => {
    schemas = setupSchema();
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
      expect(fooChild.logicalPath).toEqual("foo.one");
      expect(fooChild.renderBody()).toMatchSnapshot("fooChild_body");
    });

    test("at child namespace", () => {
      const {barChildNamespace: schema} = schemas;
      expect(schema.logicalPath).toEqual("bar.*");
    });

    test("at grand child", () => {
      const { fooGrandChild, foo } = schemas;
      expect(fooGrandChild.logicalPath).toEqual("foo.one.alpha");
      expect(fooGrandChild.domain.id).toEqual(foo.id);
    });
  });
});

// describe("NodeBuilder", () => {
//   // let store: FileStorage;
//   let root: string;
//   beforeAll(() => {
//     root = setupTmpDendronDir();
//     // store = createFileStorage(root);
//   });

// test("convert from raw", async () => {
//   const resp = await store.query(createScope(), "**/*", {});
//   const rawProps = resp.data.map(n => n.toRawProps());
//   const p = new NodeBuilder();
//   const nodes = p.parse(rawProps);
//   const nodesRaw = _.sortBy(rawProps, [ent => ent.title]);
//   const nodesParsedRaw = _.sortBy(
//     nodes.map(n => n.toRawProps()),
//     [ent => ent.title]
//   );
//   expect(nodesParsedRaw).toEqual(nodesRaw);
// });
// });
