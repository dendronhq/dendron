import {
  DendronConfig,
  DUtils,
  DVault,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { note2File, schemaModuleOpts2File } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { DConfig } from "./config";
import { createNormVault } from "./utils";

export type PathExistBehavior = "delete" | "abort" | "continue";

export type WorkspaceServiceCreateOpts = {
  wsRoot: string;
  vaults: DVault[];
};

export type WorkspaceServiceOpts = {
  wsRoot: string;
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

  public wsRoot: string;

  constructor({ wsRoot }: WorkspaceServiceOpts) {
    this.wsRoot = wsRoot;
  }

  get config(): DendronConfig {
    return DConfig.getOrCreate(this.wsRoot);
  }

  async setConfig(config: DendronConfig) {
    const wsRoot = this.wsRoot;
    return DConfig.writeConfig({ wsRoot, config });
  }

  async createVault({ vault }: { vault: DVault }) {
    fs.ensureDirSync(vault.fsPath);

    const note = NoteUtilsV2.createRoot({
      vault,
      body: [
        "# Welcome to Dendron",
        "",
        `This is the root of your dendron vault. If you decide to publish your entire vault, this will be your landing page. You are free to customize any part of this page except the frontmatter on top. `,
      ].join("\n"),
    });
    const schema = SchemaUtilsV2.createRootModule({ vault });
    if (!fs.existsSync(NoteUtilsV2.getPath({ note }))) {
      await note2File(note, vault.fsPath);
    }
    if (
      !fs.existsSync(
        SchemaUtilsV2.getPath({ root: this.wsRoot, fname: "root" })
      )
    ) {
      await schemaModuleOpts2File(schema, vault.fsPath, "root");
    }

    const wsRoot = this.wsRoot;
    const { vault: nvault } = createNormVault({ vault, wsRoot });
    // update config
    const config = this.config;
    config.vaults.push(nvault);
    await this.setConfig(config);
    return;
  }

  /**
   * Remove vaults. Currently doesn't delete an yfiles
   * @param param0
   */
  async removeVault({ vault }: { vault: DVault }) {
    const config = this.config;
    config.vaults = _.reject(config.vaults, { fsPath: vault.fsPath });
    await this.setConfig(config);
  }

  /**
   * Iinitialize workspace with root
   * @param opts
   */
  static async createWorkspace(opts: WorkspaceServiceCreateOpts) {
    const { wsRoot, vaults } = opts;
    const ws = new WorkspaceService({ wsRoot });
    fs.ensureDirSync(wsRoot);
    await Promise.all(
      vaults.map(async (vault) => {
        return ws.createVault({ vault });
      })
    );
    return ws;
  }
}
