import { DNodeUtils, Note, NoteUtils, Schema } from "../node";

import { expectSnapshot } from "../testUtils";

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
  const fooTwoBeta = new Note({
    fname: "foo.two.beta"
  });
  const barChild = new Note({ fname: "bar.one" });
  const root = new Note({ id: "root", fname: "root" });
  foo.addChild(fooChild);
  root.addChild(foo);
  return { foo, fooChild, barChild, root, fooTwoBeta, baz };
}

function setup() {
  const foo = new Schema({
    id: "foo.root",
    title: "foo.root",
    fname: "foo.root",
    parent: null
  });
  const fooChild = new Schema({
    id: "foo.child",
    title: "foo.child",
    fname: "foo.child",
    parent: null
  });
  const fooGrandChild = new Schema({
    id: "foo.grandchild",
    title: "foo.grandchild",
    fname: "foo.grandchild",
    parent: null
  });
  foo.addChild(fooChild);
  fooChild.addChild(fooGrandChild);
  return { foo, fooChild, fooGrandChild };
}

describe(DNodeUtils, () => {
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
});

describe("schema", () => {
  let schemas: ReturnType<typeof setup>;

  beforeEach(() => {
    schemas = setup();
  });

  describe("domainRoot", () => {
    test("at root", () => {
      const { foo } = schemas;
      expect(foo.domain.id).toEqual(foo.id);
      expect(foo.renderBody()).toMatchSnapshot("foo_body");
    });

    test("at child", () => {
      const { fooChild, foo } = schemas;
      expect(fooChild.domain.id).toEqual(foo.id);
      expect(fooChild.renderBody()).toMatchSnapshot("fooChild_body");
    });

    test("at grand child", () => {
      const { fooGrandChild, foo } = schemas;
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
