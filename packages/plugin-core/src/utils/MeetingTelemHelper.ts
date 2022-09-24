import { NoteProps, EngagementEvents } from "@dendronhq/common-all";
import _ from "lodash";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { AnalyticsUtils } from "./analytics";

/**
 * Send a special telemetry marker if a note is being created from a Meeting
 * Note. If the current active editor isn't a meeting note, nothing is sent.
 *
 * This functionality can be removed after enough data is collected.
 *
 * @param type - will be attached to the telemetry data payload
 * @returns
 */
export async function maybeSendMeetingNoteTelemetry(type: string) {
  const maybeEditor = VSCodeUtils.getActiveTextEditor()!;
  if (_.isUndefined(maybeEditor)) {
    return;
  }

  const activeNote = (await ExtensionProvider.getWSUtils().getNoteFromDocument(
    maybeEditor.document
  )) as NoteProps & { traitIds?: string[] };

  if (_.isUndefined(activeNote)) {
    return;
  }

  if (
    activeNote &&
    activeNote.traitIds &&
    activeNote.traitIds.includes("meetingNote")
  ) {
    AnalyticsUtils.track(
      EngagementEvents.AdditionalNoteFromMeetingNoteCreated,
      {
        type,
      }
    );
  }
}
