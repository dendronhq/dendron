import {
  ConfigUtils,
  OnCreateContext,
  NoteTrait,
  NoteUtils,
  onCreateProps,
  SetNameModifierResp,
} from "@dendronhq/common-all";
import { DendronClientUtilsV2 } from "../utils";
import { getDWorkspace } from "../workspace";

export class JournalNote implements NoteTrait {
  id: string = "journalNote";
  getTemplateType: any;

  OnWillCreate = {
    setNameModifier(_opts: OnCreateContext): SetNameModifierResp {
      const config = getDWorkspace().config;
      const journalConfig = ConfigUtils.getJournal(config);
      const dailyJournalDomain = journalConfig.dailyDomain;
      const { noteName: fname } = DendronClientUtilsV2.genNoteName("JOURNAL", {
        overrides: { domain: dailyJournalDomain },
      });

      return { name: fname, promptUserForModification: false };
    },
  };

  OnCreate: onCreateProps = {
    setTitle(opts: OnCreateContext): string {
      const config = getDWorkspace().config;
      const journalConfig = ConfigUtils.getJournal(config);
      const journalName = journalConfig.name;
      const title = NoteUtils.genJournalNoteTitle({
        fname: opts.currentNoteName!,
        journalName,
      });

      return title;
    },
  };
}
