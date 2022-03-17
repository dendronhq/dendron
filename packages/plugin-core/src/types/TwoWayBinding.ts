import { Disposable, EventEmitter } from "vscode";

/**
 * A Two Way Binding implementation for plugin-core UI's that require multiple
 * views over the same view model. A data value T can be represented with an
 * instance of this class, and any 'views' can bind a callback to get updated
 * whenever that value changes. This utilizes vscode EventEmitter under the hood.
 */
export class TwoWayBinding<T> {
  private _value: T;
  private _emitter: EventEmitter<{ newValue: T; previous: T }>;

  constructor(initialValue: T) {
    this._value = initialValue;
    this._emitter = new EventEmitter<{ newValue: T; previous: T }>();
  }

  /**
   * Get the current value
   */
  get value(): T {
    return this._value;
  }

  /**
   * Set the value. If this causes the value to change, then all bound callbacks
   * will get notified.
   */
  set value(newValue: T) {
    if (this._value !== newValue) {
      const previous = this._value;
      this._value = newValue;

      this._emitter.fire({ newValue, previous });
    }
  }

  /**
   * A view or a controller can bind a callback to the viewmodel with this
   * function
   * @param callback
   * @param thisArg
   * @returns
   */
  bind(
    callback: (newValue: T, previous: T) => void,
    thisArg?: any
  ): Disposable {
    return this._emitter.event((data) => {
      const binded = callback.bind(thisArg);
      binded(data.newValue, data.previous);
    });
  }
}
