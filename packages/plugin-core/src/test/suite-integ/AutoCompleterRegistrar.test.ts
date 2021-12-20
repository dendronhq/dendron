import { expect } from "../testUtilsv2";
import { AutoCompletableRegistrar } from "../../utils/registers/AutoCompletableRegistrar";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";

suite("AutoCompleterRegistrar tests", function () {
  test(`WHEN accessing registered command THEN retrieve command`, () => {
    const key = "test-key";
    AutoCompletableRegistrar.register("test-key", new NoteLookupCommand());
    expect(AutoCompletableRegistrar.getCmd(key)).toBeTruthy();
  });

  test(`WHEN accessing unregistered command THEN throw`, () => {
    expect(() => AutoCompletableRegistrar.getCmd("i-dont-exist")).toThrow();
  });
});
