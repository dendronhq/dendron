import { NoteTrait } from "@dendronhq/common-all";
import { afterEach, beforeEach, describe } from "mocha";
import vscode from "vscode";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import {
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../../../testUtilsV3";

suite("CommandRegistrar tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describe(`GIVEN a Command Registrar`, () => {
    const TRAIT_ID = "test-trait";

    const trait: NoteTrait = {
      id: TRAIT_ID,
    };

    describe(`WHEN registering a command for a new trait`, () => {
      let _registrar: CommandRegistrar | undefined;

      beforeEach(() => {});

      afterEach(() => {
        _registrar?.unregisterTrait(trait);
      });

      test(`THEN the command has been registered`, async () => {
        runLegacySingleWorkspaceTest({
          ctx,
          onInit: async ({ engine, wsRoot }) => {
            const mockExtension = new MockDendronExtension(engine, wsRoot, ctx);
            _registrar = new CommandRegistrar(mockExtension);
            const expectedCmdName = _registrar.CUSTOM_COMMAND_PREFIX + TRAIT_ID;

            const cmd = _registrar.registerCommandForTrait(trait);
            expect(cmd).toEqual(expectedCmdName);

            expect(_registrar.registeredCommands[TRAIT_ID]).toEqual(
              expectedCmdName
            );

            const allCmds = await vscode.commands.getCommands(true);

            expect(allCmds.includes(expectedCmdName)).toBeTruthy();
          },
        });
      });
    });

    describe(`WHEN unregistering a command`, () => {
      let _registrar: CommandRegistrar | undefined;

      test(`THEN the command has been unregistered`, async () => {
        runLegacySingleWorkspaceTest({
          ctx,
          onInit: async ({ engine, wsRoot }) => {
            const mockExtension = new MockDendronExtension(engine, wsRoot, ctx);
            _registrar = new CommandRegistrar(mockExtension);
            const expectedCmdName = _registrar.CUSTOM_COMMAND_PREFIX + TRAIT_ID;

            _registrar.registerCommandForTrait(trait);

            _registrar.unregisterTrait(trait);

            expect(_registrar.registeredCommands[expectedCmdName]).toBeFalsy();

            const allCmds = await vscode.commands.getCommands();

            expect(allCmds.includes(expectedCmdName)).toBeFalsy();
          },
        });
      });
    });
  });
});
