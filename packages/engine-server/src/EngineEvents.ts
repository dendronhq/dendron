import { Disposable, Event, NoteChangeEntry } from "@dendronhq/common-all";

/**
 * Interface for events signaling changes that have been made to engine state
 */
export interface EngineEvents extends Disposable {
  /**
   * Event that fires after a set of NoteProps has been changed AND those
   * changes have been reflected on the engine side. Note creation, deletion,
   * and updates are all fired from this event.
   */
  get onNoteChanged(): Event<NoteChangeEntry[]>;
}
