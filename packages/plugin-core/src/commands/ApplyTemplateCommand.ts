import {
  ConfigUtils,
  DendronError,
  EngagementEvents,
  NoteProps,
} from "@dendronhq/common-all";
import { TemplateUtils } from "@dendronhq/common-server";
import { HistoryEvent } from "@dendronhq/engine-server";
import _ from "lodash";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { BasicCommand } from "./base";

type CommandInput = any;

type CommandOpts = {
  templateNote: NoteProps;
  targetNote: NoteProps;
};

type CommandOutput = {};

const APPLY_TEMPLATE_LOOKUP_ID = "templateApply;";

export class ApplyTemplateCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.APPLY_TEMPLATE.key;

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  private createLookup() {
    const lc = ExtensionProvider.getExtension().lookupControllerFactory.create({
      nodeType: "note",
      buttons: [],
    });
    return lc;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const lc = this.createLookup();
    const extension = ExtensionProvider.getExtension();
    const provider = extension.noteLookupProviderFactory.create(
      APPLY_TEMPLATE_LOOKUP_ID,
      {
        allowNewNote: false,
      }
    );
    const config = extension.getDWorkspace().config;
    const targetNote = WSUtilsV2.instance().getActiveNote();
    if (!targetNote) {
      throw new DendronError({ message: "No Dendron note open" });
    }

    const tempPrefix = ConfigUtils.getWorkspace(config).templateHierarchy;
    const initialValue = tempPrefix ? `${tempPrefix}.` : undefined;

    return new Promise((resolve) => {
      NoteLookupProviderUtils.subscribe({
        id: APPLY_TEMPLATE_LOOKUP_ID,
        controller: lc,
        logger: this.L,
        onDone: (event: HistoryEvent) => {
          const templateNote = event.data.selectedItems[0] as NoteProps;
          resolve({ templateNote, targetNote });
        },
      });
      lc.show({
        title: "Template Apply",
        placeholder: "template",
        provider,
        initialValue,
      });
    });
  }

  async execute(opts: CommandOpts) {
    const ctx = "ApplyTemplateCommand";
    opts = _.defaults(opts, { closeAndOpenFile: true });
    Logger.info({ ctx });
    const { templateNote, targetNote } = opts;
    const engine = ExtensionProvider.getEngine();
    const updatedTargetNote = TemplateUtils.applyTemplate({
      templateNote,
      engine,
      targetNote,
    });
    const resp = await engine.writeNote(updatedTargetNote);
    AnalyticsUtils.track(EngagementEvents.TemplateApplied, {
      source: this.key,
    });
    if (resp.error) {
      throw new DendronError({
        message: "error applying template",
        innerError: resp.error,
      });
    }
    return updatedTargetNote;
  }
}
