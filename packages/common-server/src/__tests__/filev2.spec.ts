import {
  DNodeUtilsV2 as _du,
  SchemaUtilsV2 as _su,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { tmpDir } from "../files";
import { file2Schema, schemaModuleProps2File } from "../filesv2";

describe("schemaModuleProps2File", () => {
  let root: string;

  beforeEach(() => {
    root = tmpDir().name;
  });

  it("root", async () => {
    const fname = "root";
    const sm = _su.createRootModuleProps(fname);
    await schemaModuleProps2File(sm, root, fname);
    const payload = fs.readFileSync(path.join(root, `${fname}.schema.yml`), {
      encoding: "utf8",
    });
    expect(payload).toMatchSnapshot();
  });

  it("non-root", async () => {
    const fname = "bond";
    const smp = _su.createModuleProps({ fname });
    const rootNote = smp.schemas["root"];
    const ch1 = _su.create({ id: "ch1", fname });
    smp.schemas["ch1"] = ch1;
    _du.addChild(rootNote, ch1);

    await schemaModuleProps2File(smp, root, fname);
    const payload = fs.readFileSync(path.join(root, `${fname}.schema.yml`), {
      encoding: "utf8",
    });
    expect(payload).toMatchSnapshot();
  });
});

describe("file2Schema", () => {
  let root: string;
  beforeEach(() => {
    root = tmpDir().name;
  });

  it("simple", async () => {
    const fpath = path.join(root, "sample.schema.yml");
    fs.writeFileSync(
      fpath,
      `
version: 1
schemas:
- id: pro
  desc: projects
  parent: root
  namespace: true
  children:
    - quickstart
    - concepts
    - tips
    - faq
    - upgrading
    - topic
    - install
- id: quickstart
  desc: getting started with a project
- id: concepts
  desc: basic concepts to do with the project
- id: tips
- id: faq
- id: upgrading
- id: install
- id: topic
  desc: important areas of a project
  namespace: true
`,
      { encoding: "utf-8" }
    );
    const schema = file2Schema(fpath);
    expect(_.values(schema.schemas).length).toEqual(8);
  });
});
