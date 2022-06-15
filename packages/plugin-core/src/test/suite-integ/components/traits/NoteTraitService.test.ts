import { NoteTrait, OnCreateContext } from "@dendronhq/common-all";
import { beforeEach, afterEach, describe } from "mocha";
import sinon from "sinon";
import vscode from "vscode";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import { CommandRegistrar } from "../../../../services/CommandRegistrar";
import { NoteTraitManager } from "../../../../services/NoteTraitManager";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS } from "../../../testUtilsV3";
import { UserDefinedTraitV1 } from "../../../../traits/UserDefinedTraitV1";
import * as path from "path";

//TODO: Expand coverage once other methods of NoteTraitManager are implemented
suite("NoteTraitManager tests", () => {
  const createContext: OnCreateContext = {
    clipboard: "clipboard-text",
    currentNoteName: "current.note.name",
  };

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

        const traitManager = new NoteTraitManager(wsRoot, registrar);
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

  describe(`GIVEN a user defined trait in a JS file`, () => {
    describeSingleWS("WHEN registering the trait", {}, () => {
      let trait: NoteTrait;

      beforeEach(() => {
        trait = new UserDefinedTraitV1(
          "foo",
          path.resolve(
            __dirname,
            "../../../../../../src/test/suite-integ/components/traits/testJSTraits/UserTestTrait.js"
          )
        );
      });

      test(`THEN setNameModifier can be properly invoked AND context props can be accessed`, () => {
        const nameModifierResp =
          trait.OnWillCreate!.setNameModifier!(createContext);

        expect(nameModifierResp.name).toEqual("clipboard-text");
        expect(nameModifierResp.promptUserForModification).toBeTruthy();
      });

      test(`THEN setTitle can be properly invoked AND context props can be accessed`, () => {
        const modifiedTitle = trait.OnCreate!.setTitle!(createContext);
        expect(modifiedTitle).toEqual("current.note.name");
      });

      test(`THEN setTemplate can be properly invoked`, () => {
        expect(trait.OnCreate!.setTemplate!()).toEqual("foo");
      });
    });
  });

  describe(`GIVEN a user defined trait with module requires`, () => {
    describeSingleWS("WHEN registering the trait", {}, (ctx) => {
      let registrar: CommandRegistrar;
      let trait: NoteTrait;

      afterEach(() => {
        if (registrar && trait) {
          registrar.unregisterTrait(trait);
        }
      });

      test(`THEN registration succeeds and lodash and luxon modules can be invoked`, () => {
        const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const mockExtension = new MockDendronExtension({
          engine,
          wsRoot,
          context: ctx,
        });
        registrar = new CommandRegistrar(mockExtension);

        trait = new UserDefinedTraitV1(
          "foo",
          path.resolve(
            __dirname,
            "../../../../../../src/test/suite-integ/components/traits/testJSTraits/TestTraitUsingModules.js"
          )
        );

        const traitManager = new NoteTraitManager(wsRoot, registrar);
        const resp = traitManager.registerTrait(trait);

        expect(resp.error).toBeFalsy();

        // setTitle uses lodash
        expect(trait.OnCreate!.setTitle!(createContext)).toEqual(2);

        // setTemplate uses luxon
        expect(trait.OnCreate!.setTemplate!()).toEqual(
          "2022-01-01T00:00:00.000+08:00"
        );
      });
    });
  });
});
