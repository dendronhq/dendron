import { SchemaTree } from "../node";
var YAML_PROJECT_BASE = "\n  name: project\n  schema:\n      root:\n        children:\n          quickstart: \n          topic: \n          version: \n          features:\n          rel:\n      quickstart:\n        desc: get started with project\n      features:\n        desc: what does it do\n      ref:\n        kind: namespace\n        choices:\n            competitors: \n            shortcuts:\n      rel:\n        desc: relative\n      version:\n        children:\n          version-major: \n          version-minor: \n          version-breaking: \n      plan:\n        children:\n          requirements:\n            alias: req\n          timeline:\n            desc: \"how long will it take\"\n      version-major:\n        desc: the major version\n";
var YAML_PROJECT_DEV = "\n  name: dev project\n  schema: \n    root:\n      children: \n        upgrade:\n        dev:\n        ref:\n    dev:\n      children:\n        dev-layout: \n        architecture:\n          alias: arch        \n        qa:\n        ops:\n    ref:\n      children:\n        config:\n        lifecycle:\n    config: \n";
function treeTest(testFunc, name, treeFunc) {
    testFunc("basic", function () {
        expect(treeFunc()).toMatchSnapshot(name + "-snap");
    });
    testFunc("toAntDTree", function () {
        var antTree = treeFunc().toAntDTree();
        expect(antTree).toMatchSnapshot(name + "-antdTree");
        console.log(JSON.stringify(antTree));
    });
}
var rootSchemaNode;
var fooSchemaNode;
describe("SchemaTree", function () {
    beforeEach(function () {
        rootSchemaNode = {
            id: "root",
            children: [],
            parent: null,
            data: { title: "root", desc: "root", type: "schema" },
        };
        fooSchemaNode = {
            id: "foo",
            children: [],
            parent: null,
            data: { title: "foo", desc: "foo", type: "schema" },
        };
    });
    describe("root", function () {
        treeTest(test, "root", function () {
            return new SchemaTree("root", rootSchemaNode);
        });
    });
    describe("foo", function () {
        treeTest(test, "foo", function () {
            return new SchemaTree("foo", fooSchemaNode);
        });
    });
    describe("root.foo", function () {
        treeTest(test, "root.foo", function () {
            var tree1 = new SchemaTree("root", rootSchemaNode);
            var tree2 = new SchemaTree("foo", fooSchemaNode);
            tree1.addSubTree(tree2, "root");
            return tree1;
        });
    });
    describe.only("yamlSchema", function () {
        treeTest(test, "yamlSchema", function () {
            var initialTree = new SchemaTree("root", rootSchemaNode);
            var treeProjectBase = SchemaTree.fromSchemaYAML(YAML_PROJECT_BASE);
            var treeProjectDev = SchemaTree.fromSchemaYAML(YAML_PROJECT_DEV);
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
//# sourceMappingURL=node.unit.spec.js.map