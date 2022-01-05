import { Event, EventEmitter } from "vscode";
import { Disposable } from "vscode-languageclient";

// declare module "foo" {
//   export namespace testtest {
//     export const onDendronNoteChange: Event<string>;
//   }
// }

export class TestEvent {
  public onNoteChange: Event<string>;

  // private readonly _callbacks: Array<(data: string) => void> = [];

  // public getEvent(): Event<string> {
  //   return (listener, thisArg, disposables) => {
  // 		const remove = this._callbacks.push(listener);
  // 		const result = { dispose: remove };
  // 		if (Array.isArray(disposables)) {
  // 			disposables.push(result);
  // 		}
  // 		return result;
  // 	};
  // }

  public emitter = new EventEmitter<string>();

  private listeners: Array<(data: string) => void> = [];

  public triggerCallback(arg: string): void {
    this.listeners.forEach((fn) => fn(arg));

    this.emitter.fire(arg);
  }

  constructor() {
    this.onNoteChange = function (listener) {
      this.listeners.push(listener);

      // Attempt 1:
      return new DisposableClass(this.listeners, listener);

      // return {
      //   dispose() {},
      // };
    };
  }
}

class DisposableClass implements Disposable {
  _listeners;
  _listener;

  constructor(
    listeners: Array<(data: string) => void>,
    listener: (data: string) => void
  ) {
    this._listeners = listeners;
    this._listener = listener;
  }

  dispose(): void {
    this._listeners = this._listeners.filter((fn) => fn !== this._listener);
  }
}

export class TestSubscriber {
  foo() {
    const crap = new TestEvent();

    const blah = crap.emitter.event(() => {});

    crap.onNoteChange((e) => {
      console.log(e);
    });

    blah.dispose();
  }
}
