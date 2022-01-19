import { NoteProps } from "@dendronhq/common-all";
import { Disposable, Event } from "vscode";

/**
 * Interface for events signaling changes that have been made to engine state
 */
export interface EngineEvents extends Disposable {
  /**
   * Event that fires after a set of NoteProps has been changed AND those
   * changes have been reflected on the engine side
   */
  get onNoteChange(): Event<NoteProps>;

  /**
   * Event that fires after a new note has been created AND those changes have
   * been reflected on the engine side
   */
  get onNoteCreated(): Event<NoteProps>;

  /**
   * Event that fires after a new note has been deleted AND those changes have
   * been reflected on the engine side
   */
  get onNoteDeleted(): Event<NoteProps>;
}
