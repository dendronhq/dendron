import { DNodeRaw, NodeBuilder, Schema } from "../node";

import { ISchemaOpts } from "../types";

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});

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
