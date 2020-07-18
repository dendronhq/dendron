import { DEngine, Note, testUtils } from "@dendronhq/common-all";
import { FileTestUtils, LernaTestUtils } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { posix } from "path";
import { URI } from "vscode-uri";
import { DendronEngine } from "../../engine";
import { setupTmpDendronDir } from "../../testUtils";
import { FilePod } from "../filePod";

describe("filePod", () => {
  let root: string;
  let fixtures: string;
  let engine: DEngine;
  let actualFiles: string[];
  let expectedFiles: string[];

  beforeEach(async () => {
    root = setupTmpDendronDir();
    fixtures = FileTestUtils.getFixturesRoot(__dirname);
    engine = DendronEngine.getOrCreateEngine({
      root,
      forceNew: true,
    });
    await engine.init();
  });

  afterEach(() => {
    fs.removeSync(root);
  });

  test("sanity", async () => {
    const filesRoot = posix.join(fixtures, "pods", "filePod");
    const uri = URI.parse(filesRoot);
    const fp = new FilePod({ engine, root: uri });
    await fp.import();
    // testUtils.expectSnapshot(expect, "main", _.values(engine.notes));

    // domain note is stub
    let note = _.find(engine.notes, { fname: "project" }) as Note;
    expect(note.stub).toBeTruthy();
    expect(note.parent?.fname).toEqual("root");
    expect(note.children.map((n) => n.fname)).toEqual([
      "project.p1",
      "project.p2",
    ]);

    // p1 is not stub
    note = _.find(engine.notes, { fname: "project.p1" }) as Note;
    expect(note.stub).not.toBeTruthy();
    expect(note.parent?.fname).toEqual("project");
    expect(note.children.map((n) => n.fname)).toEqual([
      "project.p1.n1",
      "project.p1.n2",
    ]);
    [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
      root,
      LernaTestUtils.fixtureFilesForStore(),
      {
        add: [
          "assets",
          "project.p1.md",
          "project.p1.n1.md",
          "project.p1.n2.md",
          "project.p2.n1.md",
        ],
      }
    );
    expect(expectedFiles).toEqual(actualFiles);
    // check that assets are copied over
    const assetsDir = fs.readdirSync(posix.join(root, "assets"));
    //expect(assetsDir).toMatchSnapshot("assetsDir");
    expect(assetsDir.length).toEqual(2);

    // check that assets are there
    const fileBody = fs.readFileSync(posix.join(root, "project.p1.md"), {
      encoding: "utf8",
    });
    expect(fileBody.match("n1.pdf")).toBeTruthy();
    expect(fileBody.match("n3.pdf")).toBeTruthy();
    // expect(fs.readFileSync(posix.join(root, "project.p1.md"), {encoding: "utf8"})).toMatchSnapshot("p1.md")
  });

  test("harness1", async () => {
    const filesRoot = "/Users/kevinlin/tmp/kiran_test";
    const uri = URI.parse(filesRoot);
    const fp = new FilePod({ engine, root: uri });
    await fp.import();
    // testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
  });
});
