import { EventEmitter } from "@dendronhq/common-all";

/**
 * Internal Test Class to help with the thisArg test case
 */
class TestClass {
  internal = "hello";
  done: any;

  constructor(done: any) {
    this.done = done;
  }

  public callback(str: string) {
    if (this.internal === str) {
      this.done();
    } else {
      this.done("THIS arg not properly bound in callback");
    }
  }
}

/**
 * Tests for Event and EventEmitter classes
 */
describe("GIVEN an Event Emitter", () => {
  const testEmitter = new EventEmitter<string>();
  const TEST_STR = "hello";

  describe("WHEN a callback has been registered on the event", () => {
    test("THEN expect callback gets called on event fire", (done) => {
      const disposable = testEmitter.event((str) => {
        if (str !== TEST_STR) {
          done("Unexpected argument passed to callback");
        } else {
          done();
        }
      });

      testEmitter.fire(TEST_STR);
      disposable.dispose();
    });
  });

  describe("WHEN a callback has been disposed", () => {
    test("THEN expect callback not to be fired", (done) => {
      const disposable = testEmitter.event(() => {
        done("Unexpected callback invocation!");
      });

      disposable.dispose();
      testEmitter.fire(TEST_STR);

      setTimeout(done(), 50);
    });
  });

  describe("WHEN multiple callbacks are registered", () => {
    test("THEN expect all of them to fire", (done) => {
      let callbackOneFired = false;
      let callbackTwoFired = false;

      testEmitter.event(() => {
        callbackOneFired = true;

        if (callbackOneFired && callbackTwoFired) {
          done();
        }
      });

      testEmitter.event(() => {
        callbackTwoFired = true;

        if (callbackOneFired && callbackTwoFired) {
          done();
        }
      });

      testEmitter.fire(TEST_STR);
    });
  });

  describe("WHEN emitter is disposed", () => {
    test("THEN no callbacks are fired", (done) => {
      testEmitter.event(() => {
        done("Unexpected callback invocation!");
      });

      testEmitter.dispose();
      testEmitter.fire(TEST_STR);

      setTimeout(done(), 50);
    });
  });

  describe("WHEN a callback is bound with a this argument", () => {
    test("THEN the this context is set correctly ", (done) => {
      const test = new TestClass(done);

      // Set the thisArg context:
      testEmitter.event(test.callback, test);

      testEmitter.fire(TEST_STR);
    });
  });
});
