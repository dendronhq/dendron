import {
  ConfigUtils,
  DNodeProps,
  NoteType,
  NoteUtils,
  onCreateProps,
} from "@dendronhq/common-all";
import { DendronClientUtilsV2 } from "../utils";
import { getDWorkspace } from "../workspace";

export class JournalNote implements NoteType {
  id: string = "journalNote";
  getTemplateType: any;
  // onWillCreate?: onWillCreateProps | undefined;

  onWillCreate = {
    setNameModifier(_noteProps: Partial<DNodeProps>): string {
      const config = getDWorkspace().config;
      const journalConfig = ConfigUtils.getJournal(config);
      const dailyJournalDomain = journalConfig.dailyDomain;
      const { noteName: fname } = DendronClientUtilsV2.genNoteName("JOURNAL", {
        overrides: { domain: dailyJournalDomain },
      });

      return fname;
    }
  };

  onCreate: onCreateProps = {
    setTitle(fname: string, _hierarchy: string, _vault: string): string {
      const config = getDWorkspace().config;
      const journalConfig = ConfigUtils.getJournal(config);
      const journalName = journalConfig.name;
      // this.L.info({ ctx, journalName, fname });
      const title = NoteUtils.genJournalNoteTitle({
        fname,
        journalName,
      });

      return title;
    },
  };
}
