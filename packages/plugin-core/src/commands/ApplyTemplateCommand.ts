import {
  DendronError,
  EngagementEvents,
  NoteProps,
} from "@dendronhq/common-all";
import { TemplateUtils } from "@dendronhq/common-server";
import _ from "lodash";
import { QuickPickTemplateSelector } from "../components/lookup/QuickPickTemplateSelector";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { BasicCommand } from "./base";
import * as vscode from "vscode";

type CommandInput = CommandOpts;

type CommandOpts = {
  templateNote: NoteProps;
  targetNote: NoteProps;
};

type CommandOutput = {
  updatedTargetNote?: NoteProps;
};

const APPLY_TEMPLATE_LOOKUP_ID = "templateApply;";

export class ApplyTemplateCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.APPLY_TEMPLATE.key;

  async sanityCheck() {
    const activeDoc = VSCodeUtils.getActiveTextEditor();
    if (_.isUndefined(activeDoc)) {
      return "No document open";
    }
    // because apply tempalte writes to the note out of band (using fs.write), this will cause
    // conflicts if the document is dirty
    if (activeDoc.document.isDirty) {
      return "Please save the current document before applying a template";
    }
    return;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const targetNote = await WSUtilsV2.instance().getActiveNote();
    if (_.isUndefined(targetNote)) {
      throw new DendronError({ message: "No Dendron note open" });
    }

    const selector = new QuickPickTemplateSelector();
    const templateNote = await selector.getTemplate({
      logger: this.L,
      providerId: APPLY_TEMPLATE_LOOKUP_ID,
    });
    if (_.isUndefined(templateNote)) {
      throw new DendronError({ message: `Template not found` });
    }

    return { templateNote, targetNote };
  }

  async execute(opts: CommandOpts) {
    const ctx = "ApplyTemplateCommand";
    opts = _.defaults(opts, { closeAndOpenFile: true });
    Logger.info({ ctx });
    const { templateNote, targetNote } = opts;
    const engine = ExtensionProvider.getEngine();
    if (templateNote === undefined) {
      vscode.window.showInformationMessage("No template selected");
      return { updatedTargetNote: undefined };
    }
    const updatedTargetNote = TemplateUtils.applyTemplate({
      templateNote,
      engine,
      targetNote,
    });
    const resp = await engine.writeNote(updatedTargetNote);
    AnalyticsUtils.track(EngagementEvents.TemplateApplied, {
      source: this.key,
      ...TemplateUtils.genTrackPayload(templateNote),
    });
    if (resp.error) {
      throw new DendronError({
        message: "error applying template",
        innerError: resp.error,
      });
    }
    return { updatedTargetNote };
  }
}
