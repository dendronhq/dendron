import { NoteTrait } from "@dendronhq/common-all";
import { describe, afterEach } from "mocha";
import vscode from "vscode";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import { NoteTraitManager } from "../../../../services/NoteTraitService";
import { expect } from "../../../testUtilsv2";
import { setupBeforeAfter } from "../../../testUtilsV3";

//TODO: Expand coverage once other methods of NoteTraitManager are implemented
suite("NoteTraitManager tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describe(`GIVEN a NoteTraitManager`, () => {
    const TRAIT_ID = "test-trait";
    const registrar = new CommandRegistrar(ctx);

    const traitManager = new NoteTraitManager(registrar);

    const trait: NoteTrait = {
      id: TRAIT_ID,
    };

    describe(`WHEN registering a new trait`, () => {
      afterEach(() => {
        registrar.unregisterTrait(trait);
      });
      test(`THEN expect the trait to be found by the manager`, async () => {
        const resp = traitManager.registerTrait(trait);
        expect(resp.error).toBeFalsy();
      });
    });
  });
});
