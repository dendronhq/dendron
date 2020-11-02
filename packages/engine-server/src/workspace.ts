import { DVault, NoteUtilsV2, SchemaUtilsV2 } from "@dendronhq/common-all";
import { note2File, schemaModuleOpts2File } from "@dendronhq/common-server";
import fs from "fs-extra";

export type PathExistBehavior = "delete" | "abort" | "continue";

export type WorkspaceServiceCreateOpts = {
  wsRoot: string;
  vaults: DVault[];
};

export class WorkspaceService {
  async createVault({ vault }: { vault: DVault }) {
    fs.ensureDirSync(vault.fsPath);
    const note = NoteUtilsV2.createRoot({
      body: [
        "# Welcome to Dendron",
        "",
        `This is the root fo your dendron vault. If you decide to publish your entire vault, this will be your landing page. You are free to customize any part of this page except the frontmatter on top. `,
      ].join("\n"),
    });
    const schema = SchemaUtilsV2.createRootModule({});
    await note2File(note, vault.fsPath);
    await schemaModuleOpts2File(schema, vault.fsPath, "root");
    return;
  }

  /**
   * Iinitialize workspace with root
   * @param opts
   */
  async createWorkspace(opts: WorkspaceServiceCreateOpts) {
    const { wsRoot, vaults } = opts;
    fs.ensureDirSync(wsRoot);
    await Promise.all(
      vaults.map(async (vault) => {
        return this.createVault({ vault });
      })
    );
  }
}
