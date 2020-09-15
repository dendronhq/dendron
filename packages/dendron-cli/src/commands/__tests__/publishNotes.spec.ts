import {
  EngineTestUtils,
  FileTestUtils,
  NodeTestUtils,
} from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import path from "path";
import { PublishNotesCommand } from "../publishNotes";

describe("publishNotes", async () => {
  let wsRoot: string;
  let vault: string;
  // @ts-ignore
  let siteRootDir: string;

  beforeEach(async () => {
    wsRoot = FileTestUtils.tmpDir().name;
    siteRootDir = FileTestUtils.tmpDir().name;
    vault = EngineTestUtils.setupStoreDir({
      copyFixtures: false,
      initDirCb: (root) => {
        NodeTestUtils.createNotes(root, [
          { id: "id-foo", fname: "foo", stub: true },
          { id: "id-bar", fname: "bar" },
        ]);
      },
    });
    await DConfig.getOrCreate(wsRoot);
  });

  test("publish", async () => {
    const { buildNotesRoot } = await PublishNotesCommand.run({
      wsRoot,
      vault,
      noPush: true,
    });
    const notesDir = path.join(buildNotesRoot, "notes");
    FileTestUtils.cmpFiles(notesDir, ["id-bar.md", "id-foo.md", "root.md"]);
  });

  test("publish but no git", async () => {
    const { buildNotesRoot } = await PublishNotesCommand.run({
      wsRoot,
      vault,
    });
    const notesDir = path.join(buildNotesRoot, "notes");
    FileTestUtils.cmpFiles(notesDir, ["id-bar.md", "id-foo.md", "root.md"]);
  });
});
