import { EventEmitter } from "vscode";
import { NoteLookupAutoCompleteCommand } from "../../../../commands/common/NoteLookupAutoCompleteCommand";
import assert from "assert";

suite("GIVEN a NoteLookupAutoCompleteCommand", () => {
  test("WHEN the command is run, THEN subscribed callbacks are invoked", async () => {
    const emitter = new EventEmitter<void>();

    let callbackFired = false;

    emitter.event(() => {
      callbackFired = true;
    });

    const cmd = new NoteLookupAutoCompleteCommand(emitter);
    cmd.run();

    assert(callbackFired);
  });
});
