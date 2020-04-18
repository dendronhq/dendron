import { SchemaNode } from "../types";
import { SchemaTree } from "../node";

const rootSchemaNode: SchemaNode = {
  id: "root",
  logicalId: "root",
  children: [],
  parent: null,
  data: { title: "root", desc: "root" },
};

const fooSchemaNode: SchemaNode = {
  id: "foo",
  logicalId: "foo",
  children: [],
  parent: null,
  data: { title: "foo", desc: "foo" },
};

const SAMPLE_YAML = `
  name: project
  schema:
      root:
        children:
          quickstart: 
          topic: 
          version: 
          dev: 
          features:
          rel:
      quickstart:
        desc: get started with project
      features:
        desc: what does it do
      ref:
        kind: namespace
        choices:
            competitors: 
            shortcuts:
      rel:
        desc: relative
      version:
        children:
          version-major: 
          version-minor: 
          version-breaking: 
      plan:
        children:
          requirements:
            alias: req
          timeline:
            desc: "how long will it take"
      version-major:
        desc: the major version
`;

describe("SchemaTree", () => {
  test("root", () => {
    const tree = new SchemaTree("root", rootSchemaNode);
    expect(tree).toMatchSnapshot("root-snap");
  });
  test("foo", () => {
    const tree = new SchemaTree("foo", fooSchemaNode);
    expect(tree).toMatchSnapshot("foo-snap");
  });
  test("root/foo", () => {
    const tree1 = new SchemaTree("root", rootSchemaNode);
    const tree2 = new SchemaTree("foo", fooSchemaNode);
    tree1.addSubTree(tree2, "root");
    expect(tree1).toMatchSnapshot("root/foo-snap");
  });
  test("fromSchemaYAML", () => {
    const tree = SchemaTree.fromSchemaYAML(SAMPLE_YAML);
    expect(tree).toMatchSnapshot("fromSchemaYAML");
  });
});
