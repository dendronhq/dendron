import {
  DUtils,
  DVault,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { note2File, schemaModuleOpts2File } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { getVersionFilePath } from "./utils";

export type PathExistBehavior = "delete" | "abort" | "continue";

export type WorkspaceServiceCreateOpts = {
  wsRoot: string;
  vaults: DVault[];
};

export class WorkspaceService {
  static isNewVersionGreater({
    oldVersion,
    newVersion,
  }: {
    oldVersion: string;
    newVersion: string;
  }) {
    return DUtils.semver.lt(oldVersion, newVersion);
  }

  static getVersion({ wsRoot }: { wsRoot: string }): string {
    const fsPath = getVersionFilePath({ wsRoot });
    if (!fs.existsSync(fsPath)) {
      return "0.0.0";
    } else {
      return _.trim(fs.readFileSync(fsPath, { encoding: "utf8" }));
    }
  }

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
