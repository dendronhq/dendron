import { genUUID, NoteTrait } from "@dendronhq/common-all";
import { afterEach, describe } from "mocha";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import vscode from "vscode";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";

suite("CommandRegistrar tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describe(`GIVEN a Command Registrar`, () => {
    const traitId = genUUID();
    const trait: NoteTrait = {
      id: traitId,
    };

    describeSingleWS(
      "WHEN registering a command for a new trait",
      { ctx },
      () => {
        let _registrar: CommandRegistrar | undefined;
        afterEach(() => {
          _registrar?.unregisterTrait(trait);
        });

        test("THEN the command has been registered", async () => {
          const { engine, wsRoot } = ExtensionProvider.getDWorkspace();
          const mockExtension = new MockDendronExtension({
            engine,
            wsRoot,
            context: ctx,
          });
          _registrar = new CommandRegistrar(mockExtension);
          const expectedCmdName = _registrar.CUSTOM_COMMAND_PREFIX + traitId;

          const cmd = _registrar.registerCommandForTrait(trait);
          expect(cmd).toEqual(expectedCmdName);

          expect(_registrar.registeredCommands[traitId]).toEqual(
            expectedCmdName
          );

          const allCmds = await vscode.commands.getCommands(true);

          expect(allCmds.includes(expectedCmdName)).toBeTruthy();
        });
      }
    );

    describeSingleWS("WHEN unregistering a command", { ctx }, () => {
      let _registrar: CommandRegistrar | undefined;

      test("THEN the command has been unregistered", async () => {
        const { engine, wsRoot } = ExtensionProvider.getDWorkspace();
        const mockExtension = new MockDendronExtension({
          engine,
          wsRoot,
          context: ctx,
        });

        _registrar = new CommandRegistrar(mockExtension);
        const expectedCmdName = _registrar.CUSTOM_COMMAND_PREFIX + traitId;

        _registrar.registerCommandForTrait(trait);
        _registrar.unregisterTrait(trait);
        expect(_registrar.registeredCommands[expectedCmdName]).toBeFalsy();
        const allCmds = await vscode.commands.getCommands();
        expect(allCmds.includes(expectedCmdName)).toBeFalsy();
      });
    });
  });
});
