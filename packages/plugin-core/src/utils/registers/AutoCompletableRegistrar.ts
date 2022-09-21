import { Event, EventEmitter } from "vscode";

/**
 * Singleton - TODO get rid of singleton in favor of injection in local ext -
 * this requires us to be able to construct local commands via injection first
 */
export class AutoCompletableRegistrar {
  private static _eventEmitter: EventEmitter<void> | undefined;

  /**
   * Event that fires when 'Tab' is pressed when the
   * DendronContext.NOTE_LOOK_UP_ACTIVE context is set to true.
   */
  public static get OnAutoComplete(): Event<void> {
    if (!this._eventEmitter) {
      this._eventEmitter = new EventEmitter();
    }

    return this._eventEmitter.event;
  }

  /**
   * NOTE: ONLY NoteLookupAutoCompleteCommand should call this method.
   */
  public static fire(): void {
    if (!this._eventEmitter) {
      this._eventEmitter = new EventEmitter();
    }

    this._eventEmitter.fire();
  }
}
