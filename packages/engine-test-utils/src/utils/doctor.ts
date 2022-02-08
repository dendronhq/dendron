import { WorkspaceOpts } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";

export class TestDoctorUtils {
  static createNotesWithNoFrontmatter = ({ wsRoot, vaults }: WorkspaceOpts) => {
    const payload = ["hello"];
    const vpath = vault2Path({ vault: vaults[0], wsRoot });
    return fs.writeFile(path.join(vpath, "test.md"), payload.join("\n"));
  };

  static createNotesWithBadIds = ({ wsRoot, vaults }: WorkspaceOpts) => {
    const notes = NoteTestUtilsV4.createNote({
      wsRoot,
      fname: "test",
      vault: vaults[0],
      props: {
        id: "-bad-id",
      },
    });
    return { notes };
  };
}
