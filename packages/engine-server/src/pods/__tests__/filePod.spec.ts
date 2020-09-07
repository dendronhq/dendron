import { DEngine, Note } from "@dendronhq/common-all";
import {
  FileTestUtils,
  LernaTestUtils,
  EngineTestUtils,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DendronEngine } from "../../engine";
import { FilePod } from "../filePod";

// not working on windows, need to investigate
describe("filePod", () => {
  let root: string;
  let fixtures: string;
  let engine: DEngine;
  let actualFiles: string[];
  let expectedFiles: string[];

  beforeEach(async () => {
    root = EngineTestUtils.setupStoreDir();
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
    const filesRoot = path.join(fixtures, "pods", "filePod");
    // const uri = URI.parse(filesRoot);
    const fp = new FilePod({ engine });
    await fp.import({ root: filesRoot });

    // domain note is stub
    let note = _.find(engine.notes, { fname: "project" }) as Note;
    expect(note.stub).toBeTruthy();
    expect(note.parent?.fname).toEqual("root");
    expect(note.children.map((n) => n.fname)).toEqual([
      "project.p-3",
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
          "project.p1.md",
          "project.p1.n1.md",
          "project.p1.n2.md",
          "project.p2.n1.md",
          "project.p-3.n1.md",
        ],
      }
    );
    expect(expectedFiles).toEqual(actualFiles);
    // check that assets are copied over
    const assetsDir = fs.readdirSync(path.join(root, "assets"));
    expect(assetsDir.length).toEqual(3);

    // check that assets are there
    const fileBody = fs.readFileSync(path.join(root, "project.p1.md"), {
      encoding: "utf8",
    });
    expect(fileBody.match("n1.pdf")).toBeTruthy();
    expect(fileBody.match("n3.pdf")).toBeTruthy();
  });
});
