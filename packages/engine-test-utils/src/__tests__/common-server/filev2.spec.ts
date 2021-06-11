import { DNodeUtils as _du, SchemaUtils as _su } from "@dendronhq/common-all";
import {
  file2Schema,
  goUpTo,
  schemaModuleProps2File,
  tmpDir,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

describe("goUpTo", () => {
  let root: string;
  let cwd: string;

  beforeEach(() => {
    root = tmpDir().name;
    cwd = path.join(root, "foo", "bar");
    fs.ensureDirSync(cwd);
  });

  test("basic", () => {
    expect(goUpTo(cwd, "foo")).toEqual(path.join(root));
  });

  // used in dendron-cli/src/commands/build-site-v2.ts
  test("double", () => {
    let cwd2 = path.join(cwd, "foo", "bar");
    fs.ensureDirSync(cwd2);
    const match1 = goUpTo(cwd2, "foo");
    expect(match1).toEqual(cwd);
    expect(goUpTo(path.join(match1, ".."), "foo")).toEqual(root);
  });
});

describe("schemaModuleProps2File", () => {
  let root: string;

  beforeEach(() => {
    root = tmpDir().name;
  });

  it("root", async () => {
    const fname = "root";
    const sm = _su.createRootModuleProps(fname, { fsPath: root });
    await schemaModuleProps2File(sm, root, fname);
    const payload = fs.readFileSync(path.join(root, `${fname}.schema.yml`), {
      encoding: "utf8",
    });
    expect(payload).toMatchSnapshot();
  });

  it("non-root", async () => {
    const fname = "bond";
    const vault = { fsPath: root };
    const smp = _su.createModuleProps({ fname, vault });
    const rootNote = smp.schemas["bond"];
    const ch1 = _su.create({ id: "ch1", fname, vault });
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
    const schema = await file2Schema(fpath, root);
    expect(_.values(schema.schemas).length).toEqual(8);
  });
});
