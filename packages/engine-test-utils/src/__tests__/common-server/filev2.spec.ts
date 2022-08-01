import {
  DNodeUtils as _du,
  DVault,
  ErrorUtils,
  SchemaUtils as _su,
} from "@dendronhq/common-all";
import {
  file2Note,
  file2Schema,
  FileUtils,
  goUpTo,
  schemaModuleProps2File,
  tmpDir,
} from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
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
    expect(goUpTo({ base: cwd, fname: "foo" })).toEqual(path.join(root));
  });

  test("double", () => {
    const cwd2 = path.join(cwd, "foo", "bar");
    fs.ensureDirSync(cwd2);
    const match1 = goUpTo({ base: cwd2, fname: "foo" });
    expect(match1).toEqual(cwd);
    expect(goUpTo({ base: path.join(match1, ".."), fname: "foo" })).toEqual(
      root
    );
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
    const ch1 = _su.createFromSchemaOpts({ id: "ch1", fname, vault });
    smp.schemas["ch1"] = ch1;
    _du.addChild(rootNote, ch1);

    await schemaModuleProps2File(smp, root, fname);
    const payload = fs.readFileSync(path.join(root, `${fname}.schema.yml`), {
      encoding: "utf8",
    });
    expect(payload).toMatchSnapshot();
  });
});

describe("GIVEN config set", () => {
  describe("WHEN file2Note", () => {
    let root: string;
    let vault: DVault;
    beforeEach(() => {
      root = tmpDir().name;
      vault = { fsPath: root };
    });

    test("THEN config is read", () => {
      const notePath = path.join(root, "foo.md");
      fs.writeFileSync(
        notePath,
        `---
id: foo
title: foo
desc: foo
updated: 1
created: 1
config:
  global:
    enableChildLinks: false
---
Foo body`
      );
      const resp = file2Note(notePath, vault);
      expect(ErrorUtils.isErrorResp(resp)).toBeFalsy();
      expect(resp.data).toMatchObject({
        id: "foo",
        title: "foo",
        updated: 1,
        created: 1,
        config: {
          global: {
            enableChildLinks: false,
          },
        },
      });
    });
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

describe("GIVEN createFileWithSuffixThatDoesNotExist", () => {
  let root: string;
  let fpath: string;

  describe("WHEN orig file does not exist", () => {
    beforeEach(() => {
      root = FileTestUtils.tmpDir().name;
      fpath = path.join(root, "foo");
    });
    test("THEN create file", () => {
      expect(
        FileUtils.genFilePathWithSuffixThatDoesNotExist({ fpath })
      ).toEqual({ filePath: path.join(root, "foo"), acc: 0 });
    });
  });

  describe("WHEN orig file does exist", () => {
    beforeEach(async () => {
      root = FileTestUtils.tmpDir().name;
      fpath = path.join(root, "foo");
      await FileTestUtils.createFiles(root, [{ path: "foo" }]);
    });
    test("THEN increment suffix", () => {
      expect(
        FileUtils.genFilePathWithSuffixThatDoesNotExist({ fpath })
      ).toEqual({ filePath: path.join(root, "foo-1"), acc: 1 });
    });
  });

  describe("WHEN orig file and one prefix exists", () => {
    beforeEach(async () => {
      root = FileTestUtils.tmpDir().name;
      fpath = path.join(root, "foo");
      await FileTestUtils.createFiles(root, [
        { path: "foo" },
        { path: "foo-1" },
      ]);
    });
    test("THEN increment suffix", () => {
      expect(
        FileUtils.genFilePathWithSuffixThatDoesNotExist({ fpath })
      ).toEqual({ filePath: path.join(root, "foo-2"), acc: 2 });
    });
  });
});

describe("GIVEN matchFilePrefix", () => {
  let fpath: string;
  const prefix = "---";

  beforeEach(() => {
    const root = FileTestUtils.tmpDir().name;
    fpath = path.join(root, "test-file.md");
  });

  describe("WHEN file starts with prefix", () => {
    test("THEN return true", async () => {
      fs.writeFileSync(fpath, "---\nfoo");
      expect(await FileUtils.matchFilePrefix({ fpath, prefix })).toEqual({
        data: true,
      });
    });
  });

  describe("WHEN file matches prefix exactly", () => {
    test("THEN return true", async () => {
      fs.writeFileSync(fpath, "---");
      expect(await FileUtils.matchFilePrefix({ fpath, prefix })).toEqual({
        data: true,
      });
    });
  });

  describe("WHEN file does not start with prefix", () => {
    test("THEN return false", async () => {
      fs.writeFileSync(fpath, "--!");
      expect(await FileUtils.matchFilePrefix({ fpath, prefix })).toEqual({
        data: false,
      });
    });
  });

  describe("WHEN file is empty", () => {
    test("THEN return false", async () => {
      fs.writeFileSync(fpath, "");
      expect(await FileUtils.matchFilePrefix({ fpath, prefix })).toEqual({
        data: false,
      });
    });
  });

  describe("WHEN file is shorter than prefix", () => {
    test("THEN return false", async () => {
      fs.writeFileSync(fpath, "--");
      expect(await FileUtils.matchFilePrefix({ fpath, prefix })).toEqual({
        data: false,
      });
    });
  });
  describe("WHEN file match is not at start of file", () => {
    test("THEN return false", async () => {
      fs.writeFileSync(fpath, " ---");
      expect(await FileUtils.matchFilePrefix({ fpath, prefix })).toEqual({
        data: false,
      });
    });
  });
});
