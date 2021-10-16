import { DConfig } from "@dendronhq/engine-server";
import {
  DVault,
  genDefaultJournalConfig,
  LegacyLookupConfig,
  StrictV1,
  StrictV2,
  StrictV3,
} from "@dendronhq/common-all";
import _ from "lodash";

describe("DConfig", () => {
  describe("getConfig", () => {
    describe("GIVEN v3 config", () => {
      let config: Partial<StrictV3>;
      beforeEach(() => {
        config = DConfig.genDefaultConfig(3) as Partial<StrictV3>;
      });

      test("WHEN given a v3 path AND value exists, THEN it returns the correct value", () => {
        const expected = [{ fsPath: "foo" }, { fsPath: "bar" }] as DVault[];
        config.workspace!.vaults = expected;

        const vaults = DConfig.getConfig({
          config: config as StrictV3,
          path: "workspace.vaults",
          required: true,
        });

        expect(vaults).toEqual(expected);
      });

      test("WHEN given v3 path AND value doesn't exists, THEN it returns v3 default", () => {
        const expected = genDefaultJournalConfig();
        // @ts-ignore
        delete config.workspace.journal;

        expect(config.workspace!.journal).toBeUndefined();

        const journalConfig = DConfig.getConfig({
          config: config as StrictV3,
          path: "workspace.journal",
          required: true,
        });

        expect(journalConfig).toEqual(expected);
      });
    });

    describe("GIVEN v2 config", () => {
      let config: Partial<StrictV2>;
      beforeEach(() => {
        config = DConfig.genDefaultConfig(2) as Partial<StrictV2>;
      });

      test("WHEN given a required path AND the value exists, THEN it returns the value at v3 path.", () => {
        const expected = DConfig.genDefaultConfig(3).workspace;
        config.workspace = expected;
        const workspaceConfig = DConfig.getConfig({
          config: config as StrictV2,
          path: "workspace",
          required: true,
        });
        expect(workspaceConfig).toEqual(expected);
      });

      test("WHEN given a required path AND value doesn't exist, AND it wasn't mapped, THEN it throws an error with up to date default", () => {
        expect(config.workspace).toBeUndefined();
        const expectedPayload = DConfig.genDefaultConfig(3).workspace;
        const workspaceConfig = DConfig.getConfig({
          config: config as StrictV2,
          path: "workspace",
          required: true,
        });
        expect(workspaceConfig).toEqual(expectedPayload);
      });

      test("WHEN given a required path AND value doesn't exist, AND it was mapped, AND also doesn't exist on mapped path, THEN it returns the default of the mapped path", () => {
        expect(config.workspace).toBeUndefined();
        delete config.vaults;
        const expected = DConfig.genDefaultConfig(2).vaults;
        const vaultsConfig = DConfig.getConfig({
          config: config as StrictV2,
          path: "workspace.vaults",
          required: true,
        });
        expect(config.vaults).toBeUndefined();
        expect(vaultsConfig).toEqual(expected);
      });

      test("WHEN given a required path AND value doesn't exist, AND it was mapped, AND also exist on mapped path, THEN it returns the value of mapped path", () => {
        expect(config.workspace).toBeUndefined();
        const expected = [{ fsPath: "foo" }, { fsPath: "bar" }] as DVault[];
        config.vaults = expected;
        const vaultsConfig = DConfig.getConfig({
          config: config as StrictV2,
          path: "workspace.vaults",
          required: true,
        });
        expect(vaultsConfig).toEqual(expected);
      });

      test("WHEN given an optional path AND value doesn't exist, THEN grabs default from mapped path or undefined.", () => {
        const hooksConfig = DConfig.getConfig({
          config: config as StrictV2,
          path: "workspace.hooks",
          required: false,
        });
        expect(hooksConfig).toBeUndefined();

        // @ts-ignore
        delete config.commands!.insertNote;
        const insertNoteInitialValue = DConfig.getConfig({
          config: config as StrictV2,
          path: "commands.insertNote.initialValue",
        });
        const expected =
          DConfig.genDefaultConfig(2).commands!.insertNote.initialValue;
        expect(insertNoteInitialValue).toEqual(expected);
      });
    });

    describe("GIVEN v1 config", () => {
      let config: Partial<StrictV1>;
      beforeEach(() => {
        config = DConfig.genDefaultConfig(1) as Partial<StrictV1>;
      });

      test("WHEN given a required path AND the value exists, THEN it returns the value at v3 path.", () => {
        const expected = DConfig.genDefaultConfig(2).commands;
        config.commands = expected;
        const commandsConfig = DConfig.getConfig({
          config: config as StrictV1,
          path: "commands",
          required: true,
        });
        expect(commandsConfig).toEqual(expected);
      });

      test("WHEN given a required path AND value doesn't exist, AND it wasn't mapped, THEN it returns up to date default", () => {
        expect(config.commands).toBeUndefined();
        const expectedPayload = DConfig.genDefaultConfig(2).commands;
        const commandsConfig = DConfig.getConfig({
          config: config as StrictV1,
          path: "commands",
          required: true,
        });
        expect(commandsConfig).toEqual(expectedPayload);
      });

      test("WHEN given a required path AND value doesn't exist, AND it was mapped, AND also doesn't exist on mapped path, THEN it returns the default of the mapped path", () => {
        expect(config.commands).toBeUndefined();
        delete config.lookup;
        const expected = DConfig.genDefaultConfig(1).lookup;
        const lookupConfig = DConfig.getConfig({
          config: config as StrictV1,
          path: "commands.lookup",
          required: true,
        });
        expect(config.lookup).toBeUndefined();
        expect(lookupConfig).toEqual(expected);
      });

      test("WHEN given a required path AND value doesn't exist, AND it was mapped, AND also exist on mapped path, THEN it returns the value of mapped path", () => {
        expect(config.commands).toBeUndefined();
        const expected = {
          note: {
            selectionType: "selection2link",
            leaveTrace: false,
          },
        } as LegacyLookupConfig;
        config.lookup = expected;
        const vaultsConfig = DConfig.getConfig({
          config: config as StrictV1,
          path: "commands.lookup",
          required: true,
        });
        expect(vaultsConfig).toEqual(expected);
      });
    });
  });
});
