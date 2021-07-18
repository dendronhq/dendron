import { DVault } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import * as vscode from "vscode";
import {
  CONTEXT_DETAIL,
  FULL_MATCH_DETAIL,
  HIERARCHY_MATCH_DETAIL,
  PickerUtilsV2
} from "../../components/lookup/utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

function setupNotesForTest({
  wsRoot,
  vaults,
  vault1,
  vault2,
  vault3,
}: {
  wsRoot: string;
  vaults: DVault[];
  vault1?: string[];
  vault2?: string[];
  vault3?: string[];
}) {
  if (vault1) {
    vault1.forEach(async (str) => {
      await NoteTestUtilsV4.createNote({
        vault: TestEngineUtils.vault1(vaults),
        wsRoot,
        fname: str,
        body: "",
        genRandomId: true,
      });
    });
  }

  if (vault2) {
    vault2.forEach(async (str) => {
      await NoteTestUtilsV4.createNote({
        vault: TestEngineUtils.vault2(vaults),
        wsRoot,
        fname: str,
        body: "",
        genRandomId: true,
      });
    });
  }

  if (vault3) {
    vault3.forEach(async (str) => {
      await NoteTestUtilsV4.createNote({
        vault: TestEngineUtils.vault3(vaults),
        wsRoot,
        fname: str,
        body: "",
        genRandomId: true,
      });
    });
  }
}

/**
 * Tests the Vault Recommendation For New Notes Functionality in Utils
 */
suite("Lookup Utils Test", function runSuite() {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  describe("single", () => {
    test("no hierarchy matches; context only", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          setupNotesForTest({ wsRoot, vaults, vault1: ["alpha"] });
        },
        onInit: async ({ vaults }) => {
          const vaultCtx = vaults[0];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            fname: "hello",
          });
          expect(recs!.length === 3);

          expect(recs![0].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs![0].detail).toEqual(CONTEXT_DETAIL);
          done();
        },
      });
    });

    test("single hierarchy match and same context", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          setupNotesForTest({ wsRoot, vaults, vault1: ["alpha"] });
        },
        onInit: async ({ vaults }) => {
          const vaultCtx = vaults[0];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            fname: "alpha.one",
          });
          expect(recs!.length === 1);

          expect(recs![0].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs![0].detail).toEqual(FULL_MATCH_DETAIL);
          done();
        },
      });
    });

    test("single hierarchy match and different context", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          setupNotesForTest({ wsRoot, vaults, vault1: ["alpha"] });
        },
        onInit: async ({ vaults }) => {
          const vaultCtx = vaults[1];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            fname: "alpha.one",
          });
          expect(recs!.length === 3);

          expect(recs![0].vault.fsPath).toEqual(vaults[0].fsPath);
          expect(recs![0].detail).toEqual(HIERARCHY_MATCH_DETAIL);

          expect(recs![1].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs![1].detail).toEqual(CONTEXT_DETAIL);

          done();
        },
      });
    });

    test("multiple hierarchy matches with matching context", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          setupNotesForTest({
            wsRoot,
            vaults,
            vault1: ["alpha"],
            vault2: ["alpha"],
          });
        },
        onInit: async ({ vaults }) => {
          const vaultCtx = vaults[0];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            fname: "alpha.one",
          });
          expect(recs!.length).toEqual(3);

          expect(recs![0].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs![0].detail).toEqual(FULL_MATCH_DETAIL);

          expect(recs![1].vault.fsPath).toEqual(vaults[1].fsPath);
          expect(recs![1].detail).toEqual(HIERARCHY_MATCH_DETAIL);

          expect(recs![2].vault.fsPath).toEqual(vaults[2].fsPath);
          expect(recs![2].detail).toBeFalsy();
          done();
        },
      });
    });

    test("multiple hierarchy matches with different context", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          setupNotesForTest({
            wsRoot,
            vaults,
            vault1: ["alpha"],
            vault2: ["alpha"],
          });
        },
        onInit: async ({ vaults }) => {
          const vaultCtx = vaults[2];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            fname: "alpha.one",
          });
          expect(recs!.length === 3);

          expect(recs![0].vault.fsPath).toEqual(vaults[0].fsPath);
          expect(recs![0].detail).toEqual(HIERARCHY_MATCH_DETAIL);

          expect(recs![1].vault.fsPath).toEqual(vaults[1].fsPath);
          expect(recs![1].detail).toEqual(HIERARCHY_MATCH_DETAIL);

          expect(recs![2].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs![2].detail).toEqual(CONTEXT_DETAIL);
          done();
        },
      });
    });
  });
});
