import { NoteTrait } from "@dendronhq/common-all";
import { beforeEach, describe, afterEach } from "mocha";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import vscode from "vscode";
import { expect } from "../../../testUtilsv2";
import { setupBeforeAfter } from "../../../testUtilsV3";

suite("CommandRegistrar tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describe(`GIVEN a Command Registrar`, () => {
    const TRAIT_ID = "test-trait";
    const registrar = new CommandRegistrar(ctx);
    const expectedCmdName = registrar.CUSTOM_COMMAND_PREFIX + TRAIT_ID;

    const trait: NoteTrait = {
      id: TRAIT_ID,
    };

    describe(`WHEN registering a command for a new trait`, () => {
      beforeEach(() => {});

      afterEach(() => {
        registrar.unregisterTrait(trait);
      });

      test(`THEN the command has been registered`, async () => {
        const cmd = registrar.registerCommandForTrait(trait);
        expect(cmd).toEqual(expectedCmdName);

        expect(registrar.registeredCommands[TRAIT_ID]).toEqual(expectedCmdName);

        const allCmds = await vscode.commands.getCommands(true);

        expect(allCmds.includes(expectedCmdName)).toBeTruthy();
      });
    });

    describe(`WHEN unregistering a command`, () => {
      beforeEach(() => {
        registrar.registerCommandForTrait(trait);
      });

      test(`THEN the command has been unregistered`, async () => {
        registrar.unregisterTrait(trait);

        expect(registrar.registeredCommands[expectedCmdName]).toBeFalsy();

        const allCmds = await vscode.commands.getCommands();

        expect(allCmds.includes(expectedCmdName)).toBeFalsy();
      });
    });
  });
});
