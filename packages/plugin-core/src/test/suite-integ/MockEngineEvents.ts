import { NoteProps } from "@dendronhq/common-all";
import { Event, EventEmitter } from "vscode";
import { EngineEvents } from "../../services/EngineEvents";

/**
 * Convenience class for testing classes that rely on EngineEvents signaling
 */
export class MockEngineEvents implements EngineEvents {
  _onNoteChangeEmitter = new EventEmitter<NoteProps>();
  _onNoteCreatedEmitter = new EventEmitter<NoteProps>();
  _onNoteDeletedEmitter = new EventEmitter<NoteProps>();

  get onNoteChange(): Event<NoteProps> {
    return this._onNoteChangeEmitter.event;
  }

  get onNoteCreated(): Event<NoteProps> {
    return this._onNoteCreatedEmitter.event;
  }

  get onNoteDeleted(): Event<NoteProps> {
    return this._onNoteDeletedEmitter.event;
  }

  public testFireonNoteChange(noteProps: NoteProps) {
    this._onNoteChangeEmitter.fire(noteProps);
  }

  public testFireonNoteCreated(noteProps: NoteProps) {
    this._onNoteCreatedEmitter.fire(noteProps);
  }

  public testFireonNoteDeleted(noteProps: NoteProps) {
    this._onNoteDeletedEmitter.fire(noteProps);
  }

  dispose() {
    this._onNoteChangeEmitter.dispose();
    this._onNoteCreatedEmitter.dispose();
    this._onNoteDeletedEmitter.dispose();
  }
}
