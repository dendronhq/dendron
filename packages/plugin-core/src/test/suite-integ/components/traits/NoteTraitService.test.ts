import { NoteTrait } from "@dendronhq/common-all";
import { afterEach, describe } from "mocha";
import vscode from "vscode";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import { NoteTraitManager } from "../../../../services/NoteTraitService";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import {
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../../../testUtilsV3";

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

    describe(`WHEN registering a new trait`, () => {
      let registrar: CommandRegistrar;
      afterEach(() => {
        if (registrar) {
          registrar.unregisterTrait(trait);
        }
      });
      test(`THEN expect the trait to be found by the manager`, async () => {
        runLegacySingleWorkspaceTest({
          ctx,
          onInit: async ({ engine, wsRoot }) => {
            const mockExtension = new MockDendronExtension({
              engine,
              wsRoot,
              context: ctx,
            });
            registrar = new CommandRegistrar(mockExtension);

            const traitManager = new NoteTraitManager(registrar);
            const resp = traitManager.registerTrait(trait);

            expect(resp.error).toBeFalsy();
          },
        });
      });
    });
  });
});
