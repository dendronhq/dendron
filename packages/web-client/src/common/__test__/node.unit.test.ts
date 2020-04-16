import { SchemaTree } from "../node";

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
  test("basic", () => {
    const tree = SchemaTree.fromSchemaYAML(SAMPLE_YAML);
    expect(tree).toMatchSnapshot();
  });
});
