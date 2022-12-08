import { inject, injectable } from "tsyringe";
import { LookupControllerCreateOpts } from "./lookup/LookupController";
import { type ILookupProvider } from "./lookup/ILookupProvider";
import { DENDRON_COMMANDS } from "../../constants";
import { JournalBtn } from "../../components/lookup/buttons";
import { LookupNoteTypeEnum } from "@dendronhq/common-all";
import { type ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
import { NoteLookupCmd } from "./NoteLookupCmd";

@injectable()
export class CreateJournalNoteCmd {
  static key = DENDRON_COMMANDS.CREATE_JOURNAL.key;
  constructor(
    @inject("NoteProvider") private noteProvider: ILookupProvider,
    @inject("ITelemetryClient") private analytics: ITelemetryClient,
    private lookupCmd: NoteLookupCmd
  ) {}

  async run() {
    this.analytics.track(CreateJournalNoteCmd.key);
    const createJournalOpts: LookupControllerCreateOpts = {
      provider: this.noteProvider,
      noteType: LookupNoteTypeEnum.journal,
      buttons: [JournalBtn.create({ pressed: true, canToggle: false })],
      title: "Create Journal Note",
    };
    await this.lookupCmd.run(createJournalOpts);
  }
}
