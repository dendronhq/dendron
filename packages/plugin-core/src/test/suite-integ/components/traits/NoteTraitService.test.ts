import { NoteTrait } from "@dendronhq/common-all";
import { afterEach, describe } from "mocha";
import sinon from "sinon";
import vscode from "vscode";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import { NoteTraitManager } from "../../../../services/NoteTraitManager";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS } from "../../../testUtilsV3";

//TODO: Expand coverage once other methods of NoteTraitManager are implemented
suite("NoteTraitManager tests", () => {
  describe(`GIVEN a NoteTraitManager`, () => {
    const TRAIT_ID = "test-trait";

    const trait: NoteTrait = {
      id: TRAIT_ID,
    };

    describeSingleWS("WHEN registering a new trait", {}, (ctx) => {
      let registrar: CommandRegistrar;
      afterEach(() => {
        if (registrar) {
          registrar.unregisterTrait(trait);
        }
      });

      test(`THEN expect the trait to be found by the manager`, () => {
        const registerCommand = sinon.stub(vscode.commands, "registerCommand");
        const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const mockExtension = new MockDendronExtension({
          engine,
          wsRoot,
          context: ctx,
        });
        registrar = new CommandRegistrar(mockExtension);

        const traitManager = new NoteTraitManager(registrar);
        const resp = traitManager.registerTrait(trait);
        expect(resp.error).toBeFalsy();
        expect(registerCommand.calledOnce).toBeTruthy();
        expect(registerCommand.args[0][0]).toEqual(
          "dendron.customCommand.test-trait"
        );
        registerCommand.restore();
      });
    });
  });
});
