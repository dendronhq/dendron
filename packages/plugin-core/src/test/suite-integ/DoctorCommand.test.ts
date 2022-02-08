/* eslint-disable no-undef */
import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { NoteUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import {
  EngineTestUtilsUtils,
  ENGINE_HOOKS,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { DoctorCommand, PluginDoctorActionsEnum } from "../../commands/Doctor";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { PodUIControls } from "../../components/pods/PodControls";
import { INCOMPATIBLE_EXTENSIONS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";

async function runDoctor(
  opts: { action: DoctorActionsEnum; scope: "file" | "workspace" },
  cb: () => Promise<void>
) {
  const ext = ExtensionProvider.getExtension();
  const cmd = new DoctorCommand(ext);
  const gatherInputsStub = sinon
    .stub(cmd, "gatherInputs")
    .returns(Promise.resolve(opts));
  const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

  try {
    quickPickStub.onCall(0).returns(
      // eslint-disable-next-line no-undef
      Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
    );
    await cmd.run();
    await cb();
  } finally {
    gatherInputsStub.restore();
    quickPickStub.restore();
  }
}

suite("FIX_FRONTMATTER", function () {
  const ctx = setupBeforeAfter(this);
  const action = DoctorActionsEnum.FIX_FRONTMATTER;

  describeMultiWS(
    "GIVEN note with invalid frontmatter id",
    {
      preSetupHook: async (opts) => {
        EngineTestUtilsUtils.TestDoctorUtils.createNotesWithBadIds(opts);
      },
      ctx,
    },
    () => {
      test("THEN initializes correctly", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        await runDoctor(
          {
            action,
            scope: "workspace",
          },
          async () => {
            const fname = "test";
            const vault = vaults[0];
            const fpath = path.join(
              vault2Path({ vault, wsRoot }),
              `${fname}.md`
            );
            expect(
              await AssertUtils.assertInFile({ fpath, nomatch: ["-bad-id"] })
            ).toBeTruthy();
          }
        );
      });
    }
  );

  describeMultiWS(
    "GIVEN note with missing frontmatter",
    {
      preSetupHook: async (opts) => {
        EngineTestUtilsUtils.TestDoctorUtils.createNotesWithNoFrontmatter(opts);
        EngineTestUtilsUtils.TestDoctorUtils.createNotesWithNoFrontmatter({
          ...opts,
          fname: "test2",
        });
      },
      ctx,
    },
    () => {
      describe("AND WHEN scope is file", () => {
        test("THEN fix only open file", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const fname = "test";
          const vault = vaults[0];
          const fpath = path.join(vault2Path({ vault, wsRoot }), `${fname}.md`);
          const testFileUri = vscode.Uri.file(fpath);
          await VSCodeUtils.openFileInEditor(testFileUri);

          await runDoctor(
            {
              action,
              scope: "file",
            },
            async () => {
              expect(
                await AssertUtils.assertInFile({ fpath, match: ["---", "id:"] })
              ).toBeTruthy();
              expect(
                await AssertUtils.assertInFile({
                  fpath: path.join(vault2Path({ vault, wsRoot }), "test2.md"),
                  nomatch: ["---", "id:"],
                })
              ).toBeTruthy();
            }
          );
        });
      });
      describe("AND WHEN scope is workspace", () => {
        test("THEN fix all files", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          await runDoctor(
            {
              action,
              scope: "workspace",
            },
            async () => {
              const fname = "test";
              const vault = vaults[0];
              const fpath = path.join(
                vault2Path({ vault, wsRoot }),
                `${fname}.md`
              );
              expect(
                await AssertUtils.assertInFile({ fpath, match: ["---", "id:"] })
              ).toBeTruthy();
              expect(
                await AssertUtils.assertInFile({
                  fpath: path.join(vault2Path({ vault, wsRoot }), "test2.md"),
                  match: ["---", "id:"],
                })
              ).toBeTruthy();
            }
          );
        });
      });
    }
  );
});

suite("CREATE_MISSING_LINKED_NOTES", function () {
  const ctx = setupBeforeAfter(this);

  test("basic proceed, file scoped", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        const file = await NoteTestUtilsV4.createNote({
          fname: "real",
          body: "[[real.fake]]\n",
          vault,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "real2",
          body: "[[real.fake2]]\n",
          vault,
          wsRoot,
        });
        await WSUtils.openNote(file);
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const vaultPath = vault2Path({ vault, wsRoot });
          const created = _.includes(fs.readdirSync(vaultPath), "real.fake.md");
          expect(created).toBeTruthy();
          const didNotCreate = !_.includes(
            fs.readdirSync(vaultPath),
            "real.fake2.md"
          );
          expect(didNotCreate).toBeTruthy();
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
        done();
      },
    });
  });

  test("basic cancelled", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN create no notes", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vault = vaults[0];
        const file = await NoteTestUtilsV4.createNote({
          fname: "real",
          body: "[[real.fake]]\n",
          vault,
          wsRoot,
        });
        await WSUtils.openNote(file);
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("cancelled") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const vaultPath = vault2Path({ vault, wsRoot });
          const containsNew = _.includes(
            fs.readdirSync(vaultPath),
            "real.fake.md"
          );
          expect(containsNew).toBeFalsy();
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
      });
    }
  );

  describeSingleWS(
    "GIVEN broken link with alias",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN fix link", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vault = vaults[0];
        const file = await NoteTestUtilsV4.createNote({
          fname: "real",
          body: [
            "[[something|real.fake]]",
            "[[something something|real.something]]",
          ].join("\n"),
          vault,
          wsRoot,
        });
        await WSUtils.openNote(file);
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const vaultPath = vault2Path({ vault, wsRoot });
          const fileNames = ["real.fake.md", "real.something.md"];
          _.forEach(fileNames, (fileName) => {
            const containsNew = _.includes(fs.readdirSync(vaultPath), fileName);
            expect(containsNew).toBeTruthy();
          });
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
      });
    }
  );

  describeMultiWS(
    "GIVEN xvault broken links",
    {
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
    },
    () => {
      test("THEN fix links", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        const file = await NoteTestUtilsV4.createNote({
          fname: "first",
          body: [
            "[[dendron://vault2/second]]",
            "[[somenote|dendron://vault2/somenote]]",
            "[[some note|dendron://vault2/something]]",
          ].join("\n"),
          vault: vault1,
          wsRoot,
        });
        await WSUtils.openNote(file);
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const sVaultPath = vault2Path({ vault: vault1, wsRoot });
          const xVaultPath = vault2Path({ vault: vault2, wsRoot });
          const fileNames = ["second.md", "somenote.md", "something.md"];
          _.forEach(fileNames, (fileName) => {
            const inSVault = _.includes(fs.readdirSync(sVaultPath), fileName);
            const inXVault = _.includes(fs.readdirSync(xVaultPath), fileName);
            expect(inSVault).toBeFalsy();
            expect(inXVault).toBeTruthy();
          });
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
      });
    }
  );

  describeMultiWS(
    "GIVEN missing vault prefix",
    {
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
    },
    () => {
      test("THEN do nothing", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "first",
          body: [
            "[[broken]]",
            "[[somenote|somenote]]",
            "[[some note|something]]",
          ].join("\n"),
          vault: vault1,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "second",
          body: [
            "[[broken2]]",
            "[[somenote|somenote2]]",
            "[[some note|something2]]",
          ].join("\n"),
          vault: vault2,
          wsRoot,
        });
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
            scope: "workspace",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");
        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const firstVaultPath = vault2Path({ vault: vault1, wsRoot });
          const firstVaultFileNames = [
            "broken.md",
            "somenote.md",
            "something.md",
          ];
          _.forEach(firstVaultFileNames, (fileName) => {
            const containsNew = _.includes(
              fs.readdirSync(firstVaultPath),
              fileName
            );
            expect(containsNew).toBeFalsy();
          });
          const secondVaultPath = vault2Path({ vault: vault2, wsRoot });
          const secondVaultFileNames = [
            "broken2.md",
            "somenote2.md",
            "something2.md",
          ];
          _.forEach(secondVaultFileNames, (fileName) => {
            const containsNew = _.includes(
              fs.readdirSync(secondVaultPath),
              fileName
            );
            expect(containsNew).toBeFalsy();
          });
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
      });
    }
  );

  describeMultiWS(
    "GIVEN broken links in multiple vaults with workspace scope",
    {
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      // this test can take up to 3s to run
      timeout: 3e3,
    },
    () => {
      test("THEN fix all links", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "first",
          body: [
            "[[dendron://vault2/cross2]]",
            "[[dendron://vault1/broken]]",
            "[[somenote|dendron://vault1/somenote]]",
            "[[some note|dendron://vault1/something]]",
          ].join("\n"),
          vault: vault1,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "second",
          body: [
            "[[dendron://vault1/cross1]]",
            "[[dendron://vault2/broken2]]",
            "[[somenote|dendron://vault2/somenote2]]",
            "[[some note|dendron://vault2/something2]]",
          ].join("\n"),
          vault: vault2,
          wsRoot,
        });
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
            scope: "workspace",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const firstVaultPath = vault2Path({ vault: vault1, wsRoot });
          const firstVaultFileNames = [
            "cross1.md",
            "broken.md",
            "somenote.md",
            "something.md",
          ];
          _.forEach(firstVaultFileNames, (fileName) => {
            const containsNew = _.includes(
              fs.readdirSync(firstVaultPath),
              fileName
            );
            expect(containsNew).toBeTruthy();
          });
          const secondVaultPath = vault2Path({ vault: vault2, wsRoot });
          const secondVaultFileNames = [
            "cross2.md",
            "broken2.md",
            "somenote2.md",
            "something2.md",
          ];
          _.forEach(secondVaultFileNames, (fileName) => {
            const containsNew = _.includes(
              fs.readdirSync(secondVaultPath),
              fileName
            );
            expect(containsNew).toBeTruthy();
          });
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
      });
    }
  );
});

suite("REGENERATE_NOTE_ID", function () {
  describeMultiWS(
    "GIVEN file scope",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN fix file", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const vault = vaults[0];
        const oldNote = NoteUtils.getNoteOrThrow({
          fname: "foo",
          notes: engine.notes,
          vault,
          wsRoot,
        });
        const oldId = oldNote.id;
        await WSUtils.openNote(oldNote);
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.REGENERATE_NOTE_ID,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const note = NoteUtils.getNoteByFnameV5({
            fname: "foo",
            notes: engine.notes,
            vault,
            wsRoot,
          });
          expect(note?.id).toNotEqual(oldId);
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
      });
    }
  );

  describeMultiWS(
    "GIVEN workspace scoped",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN regenerate note id", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const vault = vaults[0];
        const oldRootId = NoteUtils.getNoteOrThrow({
          fname: "root",
          notes: engine.notes,
          vault,
          wsRoot,
        }).id;
        const oldFooId = NoteUtils.getNoteOrThrow({
          fname: "foo",
          notes: engine.notes,
          vault,
          wsRoot,
        }).id;
        const oldBarId = NoteUtils.getNoteOrThrow({
          fname: "bar",
          notes: engine.notes,
          vault,
          wsRoot,
        }).id;

        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.REGENERATE_NOTE_ID,
            scope: "workspace",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");

        try {
          quickPickStub
            .onCall(0)
            .returns(
              Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
            );
          await cmd.run();
          const root = NoteUtils.getNoteByFnameV5({
            fname: "root",
            notes: engine.notes,
            vault,
            wsRoot,
          });
          const foo = NoteUtils.getNoteByFnameV5({
            fname: "foo",
            notes: engine.notes,
            vault,
            wsRoot,
          });
          const bar = NoteUtils.getNoteByFnameV5({
            fname: "bar",
            notes: engine.notes,
            vault,
            wsRoot,
          });
          expect(root?.id).toNotEqual(oldRootId);
          expect(foo?.id).toNotEqual(oldFooId);
          expect(bar?.id).toNotEqual(oldBarId);
        } finally {
          gatherInputsStub.restore();
          quickPickStub.restore();
        }
      });
    }
  );
});

suite("FIND_INCOMPATIBLE_EXTENSIONS", function () {
  describeMultiWS(
    "GIVEN findIncompatibleExtensions selected",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN reload is not called", async () => {
        const extension = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(extension);
        const reloadSpy = sinon.spy(cmd, "reload" as keyof DoctorCommand);
        await cmd.execute({
          action: PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
          scope: "workspace",
        });

        expect(reloadSpy.called).toBeFalsy();
      });

      test("THEN List all as not installed if found none", async () => {
        const extension = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(extension);
        const previewSpy = sinon.spy(cmd, "showIncompatibleExtensionPreview");
        await cmd.execute({
          action: PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
          scope: "workspace",
        });

        const out = await previewSpy.returnValues[0];
        expect(out.installStatus.length).toEqual(10);
        expect(
          out.installStatus.every((status) => !status.installed)
        ).toBeTruthy();
        expect(previewSpy.calledOnce).toBeTruthy();
      });

      test("THEN List all extension that are incompatible", async () => {
        const extension = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(extension);
        const previewSpy = sinon.spy(cmd, "showIncompatibleExtensionPreview");
        await cmd.execute({
          action: PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
          scope: "workspace",
          data: {
            installStatus: INCOMPATIBLE_EXTENSIONS.map((id) => {
              return {
                id,
                installed: true,
              };
            }),
          },
        });

        const out = await previewSpy.returnValues[0];
        expect(out.installStatus.length).toEqual(10);
        expect(
          out.installStatus.every((status) => status.installed)
        ).toBeTruthy();
        expect(
          await AssertUtils.assertInString({
            body: out.contents,
            match: ["[View Extension]"],
            nomatch: ["Not Installed"],
          })
        ).toBeTruthy();
      });
    }
  );
});

suite("FIX_AIRTABLE_METADATA", function () {
  describeMultiWS(
    "GIVEN fixAirtableMetadata selected",
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          fname: "foo.bar",
          vault: vaults[0],
          custom: {
            airtableId: "airtableId-one",
          },
        });
      },
    },
    () => {
      test("THEN remove airtableId from note FM and update it with pods namespace", async () => {
        const ext = ExtensionProvider.getExtension();
        const engine = ext.getEngine();
        const { vaults } = engine;
        const cmd = new DoctorCommand(ext);
        const gatherInputsStub = sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.FIX_AIRTABLE_METADATA,
            scope: "workspace",
          })
        );
        const hierarchyQuickPickStub = sinon.stub(cmd, "getHierarchy");
        const podIdQuickPickStub = sinon.stub(
          PodUIControls,
          "promptToSelectCustomPodId"
        );
        try {
          hierarchyQuickPickStub
            .onFirstCall()
            .returns(
              Promise.resolve({ hierarchy: "foo.bar", vault: engine.vaults[0] })
            );
          podIdQuickPickStub.onCall(0).returns(Promise.resolve("dendron.task"));
          await cmd.run();
          const note = NoteUtils.getNoteByFnameFromEngine({
            fname: "foo.bar",
            engine,
            vault: vaults[0],
          });
          expect(note?.custom.airtableId).toBeFalsy();
          expect(note?.custom.pods.airtable["dendron.task"]).toEqual(
            "airtableId-one"
          );
        } finally {
          gatherInputsStub.restore();
          hierarchyQuickPickStub.restore();
          podIdQuickPickStub.restore();
        }
      });
    }
  );
});
