import {
  asyncLoopOneAtATime,
  DendronError,
  DVault,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import { HistoryService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { LookupControllerV3CreateOpts } from "../../components/lookup/LookupControllerV3Interface";
import {
  CONTEXT_DETAIL,
  FULL_MATCH_DETAIL,
  HIERARCHY_MATCH_DETAIL,
  PickerUtilsV2,
} from "../../components/lookup/utils";
import { Logger } from "../../logger";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import sinon from "sinon";
import _ from "lodash";
import { ExtensionProvider } from "../../ExtensionProvider";
import {
  ILookupProviderV3,
  OnAcceptHook,
} from "../../components/lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../../components/lookup/NoteLookupProviderUtils";

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
    asyncLoopOneAtATime(vault1, async (str) => {
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
    asyncLoopOneAtATime(vault2, async (str) => {
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
    asyncLoopOneAtATime(vault3, async (str) => {
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
        onInit: async ({ engine, vaults }) => {
          const vaultCtx = vaults[0];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            vaults,
            engine,
            fname: "hello",
          });
          expect(recs.length === 3);

          expect(recs[0].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs[0].detail).toEqual(CONTEXT_DETAIL);
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
        onInit: async ({ engine, vaults }) => {
          const vaultCtx = vaults[0];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            vaults,
            engine,
            fname: "alpha.one",
          });
          expect(recs.length === 1);

          expect(recs[0].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs[0].detail).toEqual(FULL_MATCH_DETAIL);
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
        onInit: async ({ engine, vaults }) => {
          const vaultCtx = vaults[1];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            vaults,
            engine,
            fname: "alpha.one",
          });
          expect(recs.length === 3);

          expect(recs[0].vault.fsPath).toEqual(vaults[0].fsPath);
          expect(recs[0].detail).toEqual(HIERARCHY_MATCH_DETAIL);

          expect(recs[1].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs[1].detail).toEqual(CONTEXT_DETAIL);

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
        onInit: async ({ engine, vaults }) => {
          const vaultCtx = vaults[0];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            vaults,
            engine,
            fname: "alpha.one",
          });
          expect(recs.length).toEqual(3);

          expect(recs[0].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs[0].detail).toEqual(FULL_MATCH_DETAIL);
          expect(recs[0].label).toEqual(VaultUtils.getName(vaultCtx));

          expect(recs[1].vault.fsPath).toEqual(vaults[1].fsPath);
          expect(recs[1].detail).toEqual(HIERARCHY_MATCH_DETAIL);
          expect(recs[1].label).toEqual(VaultUtils.getName(vaults[1]));

          expect(recs[2].vault.fsPath).toEqual(vaults[2].fsPath);
          expect(recs[2].detail).toBeFalsy();
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
        onInit: async ({ engine, vaults }) => {
          const vaultCtx = vaults[2];

          const recs = await PickerUtilsV2.getVaultRecommendations({
            vault: vaultCtx,
            vaults,
            engine,
            fname: "alpha.one",
          });
          expect(recs.length === 3);

          expect(recs[0].vault.fsPath).toEqual(vaults[0].fsPath);
          expect(recs[0].detail).toEqual(HIERARCHY_MATCH_DETAIL);

          expect(recs[1].vault.fsPath).toEqual(vaults[1].fsPath);
          expect(recs[1].detail).toEqual(HIERARCHY_MATCH_DETAIL);

          expect(recs[2].vault.fsPath).toEqual(vaultCtx.fsPath);
          expect(recs[2].detail).toEqual(CONTEXT_DETAIL);
          done();
        },
      });
    });
  });

  describe("getVaultRecommendations", () => {
    describe("GIVEN vaults with same fsPath", () => {
      test("THEN correctly outputs all vaults", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          },
          onInit: async ({ engine, vaults }) => {
            sinon.stub(engine, "vaults").value([
              ...engine.vaults,
              {
                fsPath: "vault3",
                name: "anotherVaultThree",
              },
            ]);
            const out = await PickerUtilsV2.getVaultRecommendations({
              vault: vaults[1],
              vaults,
              engine,
              fname: "foo",
            });
            const vaultsWithSameFSPath = out.filter((item) => {
              return item.vault.fsPath === "vault3";
            });
            expect(vaultsWithSameFSPath.length).toEqual(2);
            sinon.restore();
            done();
          },
        });
      });
    });
  });
});

async function createTestLookupController(
  lookupCreateOpts: LookupControllerV3CreateOpts
) {
  return ExtensionProvider.getExtension().lookupControllerFactory.create(
    lookupCreateOpts
  );
}

suite("NoteLookupProviderUtils", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  describeMultiWS(
    "GIVEN a subscription to provider id foo",
    {
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      let lookupCreateOpts: LookupControllerV3CreateOpts;
      let provider: ILookupProviderV3;
      let showOpts: any;
      this.beforeEach(() => {
        lookupCreateOpts = {
          nodeType: "note",
        };
        const extension = ExtensionProvider.getExtension();
        provider = extension.noteLookupProviderFactory.create("foo", {
          allowNewNote: true,
        });
        showOpts = {
          title: "foo",
          placeholder: "foo",
          provider,
          initialValue: "foo",
        };
        sinon.stub(PickerUtilsV2, "hasNextPicker").returns(false);
      });

      this.afterEach(() => {
        sinon.restore();
      });

      describe("WHEN event.done", () => {
        test("THEN returns bare event if onDone callback isn't specified", async () => {
          const controller = await createTestLookupController(lookupCreateOpts);

          controller.show({
            ...showOpts,
            nonInteractive: true,
          });

          const result = await NoteLookupProviderUtils.subscribe({
            id: "foo",
            controller,
            logger: Logger,
          });

          expect(result.source).toEqual("lookupProvider");
          expect(result.action).toEqual("done");

          controller.onHide();
        });

        test("THEN returns onDone callback output if onDone is specificed", async () => {
          const controller = await createTestLookupController(lookupCreateOpts);
          controller.show({
            ...showOpts,
            nonInteractive: true,
          });

          const result = await NoteLookupProviderUtils.subscribe({
            id: "foo",
            controller,
            logger: Logger,
            onDone: () => {
              return { foo: "custom onDone" };
            },
          });
          expect(result.foo).toEqual("custom onDone");

          controller.onHide();
        });
      });

      describe("WHEN event.error", async () => {
        const dummyHook: OnAcceptHook = async (): Promise<RespV2<any>> => {
          return {
            error: new DendronError({ message: "foo error" }),
          };
        };
        test("THEN returns undefined in onError is not specified", async () => {
          const controller = await createTestLookupController(lookupCreateOpts);
          provider.registerOnAcceptHook(dummyHook);
          controller.show({
            ...showOpts,
            nonInteractive: true,
          });
          const result = await NoteLookupProviderUtils.subscribe({
            id: "foo",
            controller,
            logger: Logger,
          });
          expect(_.isUndefined(result)).toBeTruthy();

          controller.onHide();
        });

        test("THEN returns onError callback output if onError is specified", async () => {
          const controller = await createTestLookupController(lookupCreateOpts);
          provider.registerOnAcceptHook(dummyHook);
          controller.show({
            ...showOpts,
            nonInteractive: true,
          });
          const result = await NoteLookupProviderUtils.subscribe({
            id: "foo",
            controller,
            logger: Logger,
            onError: () => {
              return { foo: "custom onError" };
            },
          });
          expect(result.foo).toEqual("custom onError");

          controller.onHide();
        });
      });

      describe("WHEN event.changeState", () => {
        test("THEN onChangeState callback output is returned if onChangeState is provided", (done) => {
          const controller = createTestLookupController(lookupCreateOpts);
          controller.then((controller) => {
            controller.show({
              ...showOpts,
              nonInteractive: false,
            });
            const result = NoteLookupProviderUtils.subscribe({
              id: "foo",
              controller,
              logger: Logger,
              onChangeState: () => {
                return { foo: "custom onChangeState" };
              },
            });
            setTimeout(async () => {
              HistoryService.instance().add({
                source: "lookupProvider",
                action: "changeState",
                id: "foo",
                data: { action: "hide" },
              });
              expect((await result).foo).toEqual("custom onChangeState");

              controller.onHide();
              done();
            }, 1000);
          });
        });
        describe("AND action.hide", () => {
          test("THEN onHide callback output is returned if onHide is provided", (done) => {
            const controller = createTestLookupController(lookupCreateOpts);
            controller.then((controller) => {
              controller.show({
                ...showOpts,
                nonInteractive: false,
              });
              const result = NoteLookupProviderUtils.subscribe({
                id: "foo",
                controller,
                logger: Logger,
                onHide: () => {
                  return { foo: "custom onHide" };
                },
              });
              setTimeout(async () => {
                controller.quickPick.hide();
                expect((await result).foo).toEqual("custom onHide");

                controller.onHide();
                done();
              }, 1000);
            });
          });
        });
      });
    }
  );
});
