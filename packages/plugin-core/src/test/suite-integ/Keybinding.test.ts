import { describe, beforeEach, afterEach } from "mocha";
import { KeybindingUtils } from "../../KeybindingUtils";
import { describeMultiWS } from "../testUtilsV3";
import sinon, { SinonStub } from "sinon";
import fs from "fs-extra";
import { expect } from "../testUtilsv2";
import { KNOWN_KEYBINDING_CONFLICTS } from "../../constants";
import { tmpDir } from "@dendronhq/common-server";
import { VSCodeUtils } from "../../vsCodeUtils";

function mockUserConfigDir() {
  const dir = tmpDir().name;
  const getCodeUserConfigDurStub = sinon.stub(
    VSCodeUtils,
    "getCodeUserConfigDir"
  );
  getCodeUserConfigDurStub.callsFake(() => {
    const wrappedMethod = getCodeUserConfigDurStub.wrappedMethod;
    const originalOut = wrappedMethod();
    return {
      userConfigDir: [dir, originalOut.delimiter].join(""),
      delimiter: originalOut.delimiter,
      osName: originalOut.osName,
    };
  });
  return getCodeUserConfigDurStub;
}

suite("KeybindingUtils", function () {
  const DUMMY_KEYBINDING_CONFLICTS = [
    {
      extensionId: "dummyExt",
      commandId: "dummyExt.cmd",
      conflictsWith: "dendron.lookupNote",
    },
  ];
  describeMultiWS(
    "GIVEN conflicting extension installed AND keybinding exists",
    {},
    () => {
      let installStatusStub: SinonStub;
      let userConfigDirStub: SinonStub;
      beforeEach(() => {
        userConfigDirStub = mockUserConfigDir();
        installStatusStub = sinon
          .stub(KeybindingUtils, "getInstallStatus")
          .returns([{ id: "dummyExt", installed: true }]);
      });

      afterEach(() => {
        installStatusStub.restore();
        userConfigDirStub.restore();
      });

      test("THEN conflict is detected", async () => {
        const out = KeybindingUtils.getConflictingKeybindings({
          knownConflicts: DUMMY_KEYBINDING_CONFLICTS,
        });
        expect(out).toEqual(DUMMY_KEYBINDING_CONFLICTS);
      });

      test("THEN conflict is not detected if resolution exists in keybindings.json", async () => {
        const { keybindingConfigPath, osName } =
          KeybindingUtils.getKeybindingConfigPath();
        const keyCombo = osName === "Darwin" ? "cmd+l" : "ctrl+l";
        const remapCombo = osName === "Darwin" ? "cmd+shift+l" : "ctrl+shift+l";
        const disableConflictCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${keyCombo}",
            "command": "-dummyExt.cmd",
          }
        ]`;
        const remapConflictCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${remapCombo}",
            "command": "dummyExt.cmd",
          }
        ]`;
        const remapDendronCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${remapCombo}",
            "command": "dendron.lookupNote",
          }
        ]`;
        [
          disableConflictCaseConfig,
          remapConflictCaseConfig,
          remapDendronCaseConfig,
        ].forEach((config) => {
          fs.ensureFileSync(keybindingConfigPath);
          fs.writeFileSync(keybindingConfigPath, config);
          const out = KeybindingUtils.getConflictingKeybindings({
            knownConflicts: DUMMY_KEYBINDING_CONFLICTS,
          });
          expect(out).toEqual([]);
          fs.removeSync(keybindingConfigPath);
        });
      });
    }
  );

  describeMultiWS("GIVEN no conflicting extension installed", {}, () => {
    test("THEN no conflict is detected", async () => {
      const out = KeybindingUtils.getConflictingKeybindings({
        knownConflicts: KNOWN_KEYBINDING_CONFLICTS,
      });
      expect(out).toEqual([]);
    });
  });

  describe("GIVEN a keybinding entry", () => {
    test("THEN correct JSON for disable block is generated", () => {
      const disableBlock = KeybindingUtils.generateKeybindingBlockForCopy({
        entry: {
          key: "ctrl+l",
          command: "dummyExt.cmd",
        },
        disable: true,
      });
      expect(disableBlock).toEqual(
        `{\n  "key": "ctrl+l",\n  "command": "-dummyExt.cmd",\n}\n`
      );
    });
    test("THEN correct JSON for remap block is generated", () => {
      const disableBlock = KeybindingUtils.generateKeybindingBlockForCopy({
        entry: {
          key: "ctrl+l",
          command: "dummyExt.cmd",
        },
      });
      expect(disableBlock).toEqual(
        `{\n  "key": "",\n  "command": "dummyExt.cmd",\n}\n`
      );
    });
  });
});
