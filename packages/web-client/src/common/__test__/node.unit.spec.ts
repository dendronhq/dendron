import { SchemaNode } from "../types";
import { SchemaTree } from "../node";

const YAML_PROJECT_BASE = `
  name: project
  schema:
      root:
        children:
          quickstart: 
          topic: 
          version: 
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
const YAML_PROJECT_DEV = `
  name: dev project
  schema: 
    root:
      children: 
        upgrade:
        dev:
        ref:
    dev:
      children:
        dev-layout: 
        architecture:
          alias: arch        
        qa:
        ops:
    ref:
      children:
        config:
        lifecycle:
    config: 
`;

function treeTest(
  testFunc: typeof test,
  name: string,
  treeFunc: () => SchemaTree
) {
  testFunc("basic", () => {
    expect(treeFunc()).toMatchSnapshot(`${name}-snap`);
  });
  testFunc("toAntDTree", () => {
    const antTree = treeFunc().toAntDTree();
    expect(antTree).toMatchSnapshot(`${name}-antdTree`);
    console.log(JSON.stringify(antTree));
  });
}

let rootSchemaNode: SchemaNode;
let fooSchemaNode: SchemaNode;
describe("SchemaTree", () => {
  beforeEach(() => {
    rootSchemaNode = {
      id: "root",
      children: [],
      parent: null,
      data: { title: "root", desc: "root" },
    };

    fooSchemaNode = {
      id: "foo",
      children: [],
      parent: null,
      data: { title: "foo", desc: "foo" },
    };
  });

  describe("root", () => {
    treeTest(test, "root", () => {
      return new SchemaTree("root", rootSchemaNode);
    });
  });

  describe("foo", () => {
    treeTest(test, "foo", () => {
      return new SchemaTree("foo", fooSchemaNode);
    });
  });

  describe("root.foo", () => {
    treeTest(test, "root.foo", () => {
      const tree1 = new SchemaTree("root", rootSchemaNode);
      const tree2 = new SchemaTree("foo", fooSchemaNode);
      tree1.addSubTree(tree2, "root");
      return tree1;
    });
  });

  describe.only("yamlSchema", () => {
    treeTest(test, "yamlSchema", () => {
      const initialTree = new SchemaTree("root", rootSchemaNode);
      const treeProjectBase = SchemaTree.fromSchemaYAML(YAML_PROJECT_BASE);
      const treeProjectDev = SchemaTree.fromSchemaYAML(YAML_PROJECT_DEV);
      initialTree.addSubTree(treeProjectBase, rootSchemaNode.id);
      initialTree.addSubTree(treeProjectDev, rootSchemaNode.id);
      return initialTree;
      //return SchemaTree.fromSchemaYAML(SAMPLE_YAML);
    });
  });

  //   describe.only("yaml1.yaml2", () => {
  //     treeTest(test, "yam1.yaml2", () => {
  //       const tree1 = SchemaTree.fromSchemaYAML(SAMPLE_YAML);
  //     });
  //   });
});
