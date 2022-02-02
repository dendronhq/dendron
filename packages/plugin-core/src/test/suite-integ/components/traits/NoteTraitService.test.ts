import { NoteTrait } from "@dendronhq/common-all";
import { afterEach, describe } from "mocha";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import vscode from "vscode";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import { NoteTraitManager } from "../../../../services/NoteTraitService";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";
import sinon from "sinon";

//TODO: Expand coverage once other methods of NoteTraitManager are implemented
suite("NoteTraitManager tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describe(`GIVEN a NoteTraitManager`, () => {
    const TRAIT_ID = "test-trait";

    const trait: NoteTrait = {
      id: TRAIT_ID,
    };

    describeSingleWS("WHEN registering a new trait", { ctx }, () => {
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
