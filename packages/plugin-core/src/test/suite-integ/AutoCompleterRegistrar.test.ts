import { expect } from "../testUtilsv2";
import { AutoCompletableRegistrar } from "../../utils/registers/AutoCompletableRegistrar";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { AutoCompletable } from "../../utils/AutoCompletable";
import { CodeCommandInstance } from "../../commands/base";

suite("AutoCompleterRegistrar tests", function () {
  test(`WHEN accessing registered command THEN retrieve command`, () => {
    const key = "test-key";
    const noteLookupCmd = new NoteLookupCommand();

    const isACommandAndAutoCompletable = (
      cmd: any
    ): cmd is CodeCommandInstance & AutoCompletable => {
      return (
        (cmd as CodeCommandInstance & AutoCompletable).run !== undefined &&
        (cmd as CodeCommandInstance & AutoCompletable).onAutoComplete !==
          undefined
      );
    };

    if (isACommandAndAutoCompletable(noteLookupCmd)) {
      AutoCompletableRegistrar.register("test-key", noteLookupCmd);
      expect(AutoCompletableRegistrar.getCmd(key)).toBeTruthy();
    } else {
      throw new Error(
        `Could not cast to CodeCommandInstance & AutoCompletable`
      );
    }
  });

  test(`WHEN accessing unregistered command THEN throw`, () => {
    expect(() => AutoCompletableRegistrar.getCmd("i-dont-exist")).toThrow();
  });
});
