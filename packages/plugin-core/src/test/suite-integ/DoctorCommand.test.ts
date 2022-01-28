import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { DoctorCommand, PluginDoctorActionsEnum } from "../../commands/Doctor";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { INCOMPATIBLE_EXTENSIONS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

suite("DoctorCommandTest", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults }) => {
        // create files without frontmatter
        const vaultDirRoot = path.join(
          wsRoot,
          VaultUtils.getRelPath(vaults[0])
        );
        const testFile = path.join(vaultDirRoot, "bar.md");
        fs.writeFileSync(testFile, "bar", { encoding: "utf8" });
        const testFile2 = path.join(vaultDirRoot, "baz.md");
        fs.writeFileSync(testFile2, "baz", { encoding: "utf8" });

        // reload
        await new ReloadIndexCommand().run();
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.FIX_FRONTMATTER,
            scope: "workspace",
          })
        );
        await cmd.run();
        // check that frontmatter is added
        const resp = fs.readFileSync(testFile, { encoding: "utf8" });
        expect(NoteUtils.RE_FM.exec(resp)).toBeTruthy();
        expect(NoteUtils.RE_FM_UPDATED.exec(resp)).toBeTruthy();
        expect(NoteUtils.RE_FM_CREATED.exec(resp)).toBeTruthy();

        const resp2 = fs.readFileSync(testFile2, { encoding: "utf8" });
        expect(NoteUtils.RE_FM.exec(resp2)).toBeTruthy();
        expect(NoteUtils.RE_FM_UPDATED.exec(resp2)).toBeTruthy();
        expect(NoteUtils.RE_FM_CREATED.exec(resp2)).toBeTruthy();
        done();
      },
    });
  });

  test("basic file scoped", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults }) => {
        const vaultDirRoot = path.join(
          wsRoot,
          VaultUtils.getRelPath(vaults[0])
        );
        const testFile = path.join(vaultDirRoot, "bar.md");
        fs.writeFileSync(testFile, "bar", { encoding: "utf8" });
        const testFile2 = path.join(vaultDirRoot, "baz.md");
        fs.writeFileSync(testFile2, "baz", { encoding: "utf8" });

        // reload and run
        await new ReloadIndexCommand().run();
        const testFileUri = vscode.Uri.file(testFile);
        await VSCodeUtils.openFileInEditor(testFileUri);
        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.FIX_FRONTMATTER,
            scope: "file",
          })
        );
        await cmd.run();
        // check that frontmatter is added
        const resp = fs.readFileSync(testFile, { encoding: "utf8" });
        expect(NoteUtils.RE_FM.exec(resp)).toBeTruthy();
        expect(NoteUtils.RE_FM_UPDATED.exec(resp)).toBeTruthy();
        expect(NoteUtils.RE_FM_CREATED.exec(resp)).toBeTruthy();

        const resp2 = fs.readFileSync(testFile2, { encoding: "utf8" });
        expect(NoteUtils.RE_FM.exec(resp2)).toBeFalsy();
        expect(NoteUtils.RE_FM_UPDATED.exec(resp2)).toBeFalsy();
        expect(NoteUtils.RE_FM_CREATED.exec(resp2)).toBeFalsy();
        done();
      },
    });
  });

  test("fixes bad note id", (done) => {
    let note: NoteProps;
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        note = await NoteTestUtilsV4.createNote({
          wsRoot,
          fname: "test",
          vault: vaults[0],
          props: {
            id: "-bad-id",
          },
        });
      },
      onInit: async ({ wsRoot, engine, vaults }) => {
        await WSUtils.openNote(note);

        const ext = ExtensionProvider.getExtension();
        const cmd = new DoctorCommand(ext);
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActionsEnum.FIX_FRONTMATTER,
            scope: "file",
          })
        );
        await cmd.run();
        note = NoteUtils.getNoteByFnameV5({
          wsRoot,
          notes: engine.notes,
          fname: "test",
          vault: vaults[0],
        })!;
        expect(note.id === "-bad-id").toBeFalsy();
        done();
      },
    });
  });
});

suite("CREATE_MISSING_LINKED_NOTES", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this);

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
      onInit: async ({ wsRoot, vaults }) => {
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
        done();
      },
    });
  });

  test("broken link with alias", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults }) => {
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
        done();
      },
    });
  });

  test("xvault broken links", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, vaults }) => {
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
        done();
      },
    });
  });

  test("should do nothing in multivault workspace if vault prefix isn't there", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, vaults }) => {
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
        done();
      },
    });
  });

  test("broken links in multiple vaults with workspace scope", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, vaults }) => {
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
        done();
      },
    });
  });
});

suite("REGENERATE_NOTE_ID", function () {
  const ctx = setupBeforeAfter(this);

  test("file scoped", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults, engine }) => {
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
        done();
      },
    });
  });

  test("workspace scoped", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults, engine }) => {
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
        done();
      },
    });
  });
});

suite("FIND_INCOMPATIBLE_EXTENSIONS", function () {
  const ctx = setupBeforeAfter(this);

  describeMultiWS(
    "GIVEN findIncompatibleExtensions selected",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      ctx,
    },
    () => {
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
