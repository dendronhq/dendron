import { DVault } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { CreateDailyJournalCommand } from "../commands/CreateDailyJournal";
import { GLOBAL_STATE, WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { DendronClientUtilsV2, VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BlankInitializer } from "./blankInitializer";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Template Workspace Initializer
 */
 export class TemplateInitializer extends BlankInitializer implements WorkspaceInitializer {

  createVaults = () => {
    return [{ fsPath: "journal" }]; // TODO: Fix journal hardcoding for vault name
  };

  onWorkspaceCreation = async (opts: { vaults: DVault[]; wsRoot: string, svc?: WorkspaceService }) => {
    const ctx = "TemplateInitializer.onWorkspaceCreation";
    super.onWorkspaceCreation(opts);

    const ws = DendronWorkspace.instance();
    
    await ws.updateGlobalState(
      GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
      WORKSPACE_ACTIVATION_CONTEXT.JOURNAL.toString()
    );

    const dendronWSTemplate = VSCodeUtils.joinPath(
      ws.extensionAssetsDir,
      "templates"
    );

    const vpath = vault2Path({ vault: opts.vaults[0], wsRoot: opts.wsRoot });
    fs.copySync(path.join(dendronWSTemplate.fsPath, "journal"), vpath);
  };

  /**
   * Creates a placeholder daily journal entry
   * @param opts 
   */
  onWorkspaceOpen: (opts: { ws: DendronWorkspace }) => void = async (opts: {
    ws: DendronWorkspace;
  }) => {
    const ctx = "TemplateInitializer.onWorkspaceOpen";

    const dailyJournalDomain = opts.ws.config.journal.dailyDomain;
    let fname = DendronClientUtilsV2.genNoteName("JOURNAL", {
      overrides: { domain: dailyJournalDomain },
    });

    new CreateDailyJournalCommand().execute({fname});
  };
 }