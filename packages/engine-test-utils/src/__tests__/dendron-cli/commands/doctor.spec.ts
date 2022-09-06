import {
  ConfigUtils,
  ErrorUtils,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  BackupService,
  DConfig,
  file2Note,
  tmpDir,
} from "@dendronhq/common-server";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DoctorCLICommand, DoctorCLICommandOpts } from "@dendronhq/dendron-cli";
import path from "path";
import fs from "fs-extra";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import _ from "lodash";
import { GitTestUtils, TestConfigUtils } from "../../..";

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo",
    body: [`# Foo Header`, `## Foo Content`].join("\n"),
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "bar",
    body: [`# Bar Header`, `## Bar Content`].join("\n"),
  });
};

const setupSingleWithWikilink = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo",
    body: "[[foo.bar]]\n",
  });
};

const setupWithWikilink = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo",
    body: "[[dendron://vault1/foo.bar]]\n",
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo.bar",
    body: ["[[dendron://vault1/fake.link]]", "[[fake.link2]]"].join("\n"),
  });
};

const setupMultiWithWikilink = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo",
    body: "[[dendron://vault1/foo.bar]]\n",
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo.bar",
    body: "[[dendron://vault1/fake.link]]\n",
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[1],
    fname: "baz",
    body: "[[dendron://vault2/baz.qaaz]]\n",
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[1],
    fname: "baz.qaaz",
    body: "[[dendron://vault2/fake]]\n",
  });
};

const setupWithAliasedWikilink = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo",
    body: [
      "[[foo bar|dendron://vault1/foo.bar]]",
      "[[foobaz|dendron://vault1/foo.baz]]",
    ].join("\n"),
  });
};

const setupWithInvalidFilename = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "bar..('foo',)",
  });
};

const setupWithXVaultWikilink = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo",
    body: [
      "[[dendron://vault2/bar]]",
      "[[baz|dendron://vault2/baz]]",
      "[[qaaaz note|dendron://vault2/qaaaz]]",
    ].join("\n"),
  });
};

const setupWithTags = async ({ wsRoot, vaults }: WorkspaceOpts) => {
  await NoteTestUtilsV4.createNote({
    vault: vaults[0],
    wsRoot,
    fname: "foo",
    body: "\n\nSed nulla et aut @nostrum necessitatibus ipsam #reiciendis earum.",
  });
};

const runDoctor = (opts: Omit<DoctorCLICommandOpts, "server">) => {
  const cmd = new DoctorCLICommand();
  return cmd.execute({
    exit: false,
    ...opts,
    server: {} as any,
  });
};

describe("h1 to h2", () => {
  const action = DoctorActionsEnum.HI_TO_H2;

  test("basic", async () => {
    // this test can run a bit long
    jest.setTimeout(8000);
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const names = ["Foo", "Bar"];
        await Promise.all(
          names.map(async (nm) => {
            const fpath = path.join(
              wsRoot,
              vault.fsPath,
              `${nm.toLowerCase()}.md`
            );
            const resp = file2Note(fpath, vault);
            if (ErrorUtils.isErrorResp(resp)) {
              throw resp.error;
            }
            const note = resp.data;
            expect(note).toMatchSnapshot();
            expect(
              await AssertUtils.assertInString({
                body: note.body,
                match: [`## ${nm} Header`],
              })
            ).toBeTruthy();
          })
        );
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });

  test("basic pass candidates opt", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const fooFile = (
          await engine.findNotes({
            fname: "foo",
            vault,
          })
        )[0];
        await runDoctor({
          candidates: [fooFile!],
          wsRoot,
          engine,
          action,
        });

        const fpathFoo = path.join(wsRoot, vault.fsPath, "foo.md");
        const resp1 = file2Note(fpathFoo, vault);
        if (ErrorUtils.isErrorResp(resp1)) {
          throw resp1.error;
        }
        const noteFoo = resp1.data;
        expect(noteFoo).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: noteFoo.body,
            match: [`## Foo Header`],
          })
        ).toBeTruthy();

        // bar.md should be untouched.
        const fpathBar = path.join(wsRoot, vault.fsPath, "bar.md");
        const resp2 = file2Note(fpathBar, vault);
        if (ErrorUtils.isErrorResp(resp2)) {
          throw resp2.error;
        }
        const note = resp2.data;
        expect(note).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: note.body,
            match: [`# Bar Header`],
          })
        ).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });

  test("dry run", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
          dryRun: true,
        });
        const names = ["Foo", "Bar"];
        await Promise.all(
          names.map(async (nm) => {
            const fpath = path.join(
              wsRoot,
              vault.fsPath,
              `${nm.toLowerCase()}.md`
            );
            const resp = file2Note(fpath, vault);
            if (ErrorUtils.isErrorResp(resp)) {
              throw resp.error;
            }
            const note = resp.data;
            expect(note).toMatchSnapshot();
            expect(
              await AssertUtils.assertInString({
                body: note.body,
                nomatch: [`## ${nm} Header`],
              })
            ).toBeTruthy();
          })
        );
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});

describe("H1_TO_TITLE", () => {
  const action = DoctorActionsEnum.H1_TO_TITLE;
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const names = ["Foo", "Bar"];
        await Promise.all(
          names.map(async (nm) => {
            const fpath = path.join(
              wsRoot,
              vault.fsPath,
              `${nm.toLowerCase()}.md`
            );
            const resp = file2Note(fpath, vault);
            if (ErrorUtils.isErrorResp(resp)) {
              throw resp.error;
            }
            const note = resp.data;
            expect(note).toMatchSnapshot();
            expect(note.title).toEqual(`${nm} Header`);
          })
        );
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });

  test("basic pass candidates opts", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const fooFile = (
          await engine.findNotes({
            fname: "foo",
            vault,
          })
        )[0];
        await runDoctor({
          candidates: [fooFile!],
          wsRoot,
          engine,
          action,
        });
        const fpathFoo = path.join(wsRoot, vault.fsPath, "foo.md");
        const resp1 = file2Note(fpathFoo, vault);
        if (ErrorUtils.isErrorResp(resp1)) {
          throw resp1.error;
        }
        const noteFoo = resp1.data;
        expect(noteFoo).toMatchSnapshot();
        expect(noteFoo.title).toEqual("Foo Header");

        const fpathBar = path.join(wsRoot, vault.fsPath, "bar.md");
        const resp2 = file2Note(fpathBar, vault);
        if (ErrorUtils.isErrorResp(resp2)) {
          throw resp2.error;
        }
        const noteBar = resp2.data;
        expect(noteBar).toMatchSnapshot();
        expect(noteBar.title).toEqual("Bar");
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});

describe("CREATE_MISSING_LINKED_NOTES", () => {
  const action = DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES;
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const fileExists = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "fake.link.md")
        );
        expect(fileExists).toBeTruthy();

        const shouldNotExist = !(await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "fake.link2.md")
        ));
        expect(shouldNotExist).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithWikilink,
      }
    );
  });

  test("basic single vault", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const fileExists = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "foo.bar.md")
        );
        expect(fileExists).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        vaults: [{ fsPath: "vault1" }],
        preSetupHook: setupSingleWithWikilink,
      }
    );
  });

  test("basic pass candidates opts", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const fooFile = (
          await engine.findNotes({
            fname: "foo",
            vault,
          })
        )[0];
        await runDoctor({
          candidates: [fooFile!],
          wsRoot,
          engine,
          action,
        });
        const fileExists = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "fake.link.md")
        );
        expect(fileExists).toBeFalsy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithWikilink,
      }
    );
  });

  test("dry run", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
          dryRun: true,
        });
        const fileExists = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "fake.link.md")
        );
        expect(fileExists).toBeFalsy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithWikilink,
      }
    );
  });

  test("dry run", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const fooFile = (
          await engine.findNotes({
            fname: "foo",
            vault,
          })
        )[0];
        await runDoctor({
          candidates: [fooFile!],
          wsRoot,
          engine,
          action,
          dryRun: true,
        });
        const fileExists = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "fake.link.md")
        );
        expect(fileExists).toBeFalsy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithWikilink,
      }
    );
  });

  test("broken link with alias", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const fileNames = ["foo.bar.md", "foo.baz.md"];
        _.forEach(fileNames, async (fileName) => {
          const fileExists = await fs.pathExists(
            path.join(wsRoot, vault.fsPath, fileName)
          );
          expect(fileExists).toBeTruthy();
        });
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithAliasedWikilink,
      }
    );
  });

  test("broken link with alias pass candidates opts", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const fooFile = (
          await engine.findNotes({
            fname: "foo",
            vault,
          })
        )[0];
        await runDoctor({
          candidates: [fooFile!],
          wsRoot,
          engine,
          action,
        });
        const fileExists = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "foo.bar.md")
        );
        expect(fileExists).toBeTruthy();
        const fileDoesntExist = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "foo.baz.md")
        );
        expect(fileDoesntExist).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithAliasedWikilink,
      }
    );
  });

  test("missing notes in multiple vaults", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const fileExistsVault1 = await fs.pathExists(
          path.join(wsRoot, vault1.fsPath, "fake.link.md")
        );
        expect(fileExistsVault1).toBeTruthy();
        const fileExistsVault2 = await fs.pathExists(
          path.join(wsRoot, vault2.fsPath, "fake.md")
        );
        expect(fileExistsVault2).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupMultiWithWikilink,
      }
    );
  });

  test("xvaults broken links", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const fileExistsVault1 = await fs.pathExists(
          path.join(wsRoot, vault1.fsPath, "bar.md")
        );
        expect(fileExistsVault1).toBeFalsy();
        const fileNames = ["bar.md", "baz.md", "qaaaz.md"];
        _.forEach(fileNames, async (fileName) => {
          const fileExistsVault2 = await fs.pathExists(
            path.join(wsRoot, vault2.fsPath, fileName)
          );
          expect(fileExistsVault2).toBeTruthy();
        });
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithXVaultWikilink,
      }
    );
  });

  test("xvaults broken links pass candidates opts", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vault1,
          fname: "foo2",
          body: [
            "[[dendron://vault2/bar2]]",
            "[[baz|dendron://vault2/baz2]]",
            "[[qaaaz note|dendron://vault2/qaaaz2]]",
          ].join("\n"),
        });
        const fooFile = (
          await engine.findNotes({
            fname: "foo",
            vault: vault1,
          })
        )[0];
        await runDoctor({
          candidates: [fooFile!],
          wsRoot,
          engine,
          action,
        });
        const fileExistsVault1 = await fs.pathExists(
          path.join(wsRoot, vault1.fsPath, "bar.md")
        );
        expect(fileExistsVault1).toBeFalsy();
        const fileNames = ["bar.md", "baz.md", "qaaaz.md"];
        _.forEach(fileNames, async (fileName) => {
          const fileExistsVault2 = await fs.pathExists(
            path.join(wsRoot, vault2.fsPath, fileName)
          );
          expect(fileExistsVault2).toBeTruthy();
        });
        const fileNames2 = ["bar2.md", "baz2.md", "qaaaz2.md"];
        _.forEach(fileNames2, async (fileName) => {
          const fileExistsVault2 = await fs.pathExists(
            path.join(wsRoot, vault2.fsPath, fileName)
          );
          expect(fileExistsVault2).toBeFalsy();
        });
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupWithXVaultWikilink,
      }
    );
  });

  test("Creates missing user tags and hashtags", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
        });
        const userTag = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "user.nostrum.md")
        );
        expect(userTag).toBeTruthy();

        const hashTag = await fs.pathExists(
          path.join(wsRoot, vault.fsPath, "tags.reiciendis.md")
        );
        expect(hashTag).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        vaults: [{ fsPath: "vault1" }],
        preSetupHook: setupWithTags,
      }
    );
  });

  describe("WHEN user tags and hashtags are disabled", () => {
    test("THEN user and tag notes are not created", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          await runDoctor({
            wsRoot,
            engine,
            action,
          });
          const userTag = await fs.pathExists(
            path.join(wsRoot, vault.fsPath, "user.nostrum.md")
          );
          expect(userTag).toBeFalsy();

          const hashtag = await fs.pathExists(
            path.join(wsRoot, vault.fsPath, "tags.reiciendis.md")
          );
          expect(hashtag).toBeFalsy();
        },
        {
          createEngine: createEngineFromServer,
          expect,
          vaults: [{ fsPath: "vault1" }],
          preSetupHook: setupWithTags,
          modConfigCb: (config) => {
            config.workspace!.enableHashTags = false;
            config.workspace!.enableUserTags = false;
            return config;
          },
        }
      );
    });
  });
});

describe("FIND_BROKEN_LINKS", () => {
  const action = DoctorActionsEnum.FIND_BROKEN_LINKS;

  describe("WHEN broken link exists", () => {
    test("THEN findBrokenLinks finds it", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const out = await runDoctor({
            wsRoot,
            engine,
            action,
          });
          const foundBrokenLinks = out.resp;
          expect(foundBrokenLinks).toEqual([
            {
              file: "foo.bar",
              vault: "vault1",
              links: [{ column: 1, line: 1, value: "fake.link" }],
            },
            {
              file: "baz.qaaz",
              vault: "vault2",
              links: [{ column: 1, line: 1, value: "fake" }],
            },
          ]);
        },
        {
          createEngine: createEngineFromServer,
          expect,
          preSetupHook: setupMultiWithWikilink,
        }
      );
    });
  });
});

describe("GIVEN fixRemoteVaults", () => {
  const action = DoctorActionsEnum.FIX_REMOTE_VAULTS;
  describe("WHEN a vault has a remote", () => {
    describe("AND the vault was not marked as remote", () => {
      test("THEN it is marked as a remote vault", async () => {
        await runEngineTestV5(
          async ({ wsRoot, vaults, engine }) => {
            const vault = vaults[0];
            const remoteDir = tmpDir().name;
            await GitTestUtils.createRepoForRemoteVault({
              wsRoot,
              vault,
              remoteDir,
            });

            await runDoctor({
              wsRoot,
              engine,
              action,
            });
            const configAfter = TestConfigUtils.getConfig({ wsRoot });
            const vaultsAfter = ConfigUtils.getVaults(configAfter);
            const vaultAfter = VaultUtils.getVaultByName({
              vaults: vaultsAfter,
              vname: VaultUtils.getName(vault),
            });
            expect(vaultAfter?.remote?.type).toEqual("git");
            expect(vaultAfter?.remote?.url).toEqual(remoteDir);
          },
          {
            expect,
          }
        );
      });
    });
  });

  describe("WHEN a vault does not have a remote", () => {
    test("THEN it is NOT marked as a remote vault", async () => {
      await runEngineTestV5(
        async ({ wsRoot, vaults, engine }) => {
          const vault = vaults[0];
          await GitTestUtils.createRepoForVault({
            wsRoot,
            vault,
          });

          await runDoctor({ action, engine, wsRoot });

          const configAfter = TestConfigUtils.getConfig({ wsRoot });
          const vaultsAfter = ConfigUtils.getVaults(configAfter);
          const vaultAfter = VaultUtils.getVaultByName({
            vaults: vaultsAfter,
            vname: VaultUtils.getName(vault),
          });
          expect(vaultAfter?.remote).toBeFalsy();
        },
        { expect }
      );
    });
  });

  describe("WHEN a repo contains the whole workspace and not just one vault", () => {
    test("THEN it is NOT marked as a remote vault", async () => {
      // In this case, we don't want to mark it because the whole workspace
      // is in the repository and not just this vault. Someone who has the
      // workspace doesn't need to also clone the vault.
      await runEngineTestV5(
        async ({ wsRoot, vaults, engine }) => {
          const vault = vaults[0];
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);

          await runDoctor({ action, engine, wsRoot });

          const configAfter = TestConfigUtils.getConfig({ wsRoot });
          const vaultsAfter = ConfigUtils.getVaults(configAfter);
          const vaultAfter = VaultUtils.getVaultByName({
            vaults: vaultsAfter,
            vname: VaultUtils.getName(vault),
          });
          expect(vaultAfter?.remote).toBeFalsy();
        },
        { expect }
      );
    });
  });
});

describe("GIVEN addMissingDefaultConfigs", () => {
  const action = DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS;
  describe("WHEN missing a default key", () => {
    test("THEN adds missing default and create backup", async () => {
      await runEngineTestV5(
        async ({ wsRoot, engine }) => {
          const rawConfigBefore = DConfig.getRaw(wsRoot);
          expect(rawConfigBefore.workspace?.workspaceVaultSyncMode).toBeFalsy();
          const out = await runDoctor({
            wsRoot,
            engine,
            action,
          });
          expect(out.resp.backupPath).toBeTruthy();
          const backupPathExists = await fs.pathExists(out.resp.backupPath);
          expect(backupPathExists).toBeTruthy();
          const rawConfig = DConfig.getRaw(wsRoot);
          const defaultConfig = ConfigUtils.genDefaultConfig();
          expect(rawConfig.workspace?.workspaceVaultSyncMode).toEqual(
            defaultConfig.workspace.workspaceVaultSyncMode
          );
        },
        {
          expect,
          modConfigCb: (config) => {
            // @ts-ignore
            delete config.workspace.workspaceVaultSyncMode;
            return config;
          },
        }
      );
    });
  });

  describe("WHEN not missing a default key", () => {
    test("THEN doesn't add missing default and backup is not created", async () => {
      await runEngineTestV5(
        async ({ wsRoot, engine }) => {
          const rawConfigBefore = DConfig.getRaw(wsRoot);
          expect(
            rawConfigBefore.workspace?.workspaceVaultSyncMode
          ).toBeTruthy();
          const out = await runDoctor({
            wsRoot,
            engine,
            action,
          });
          expect(out).toEqual({ exit: true });
          const rawConfig = DConfig.getRaw(wsRoot);
          expect(rawConfigBefore).toEqual(rawConfig);

          const backupService = new BackupService({ wsRoot });
          try {
            const configBackups = backupService.getBackupsWithKey({
              key: "config",
            });
            expect(configBackups.length).toEqual(0);
          } finally {
            backupService.dispose();
          }
        },
        {
          expect,
        }
      );
    });
  });
});

describe("GIVEN removeDeprecatedConfigs", () => {
  const action = DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS;
  describe("WHEN deprecated key exists", () => {
    test("THEN removes deprecated key and create backup", async () => {
      await runEngineTestV5(
        async ({ wsRoot, engine }) => {
          const rawConfigBefore = DConfig.getRaw(wsRoot);
          expect((rawConfigBefore.dev as any).enableWebUI).toBeTruthy();
          const out = await runDoctor({
            wsRoot,
            engine,
            action,
          });
          expect(out.resp.backupPath).toBeTruthy();
          const backupPathExists = await fs.pathExists(out.resp.backupPath);
          expect(backupPathExists).toBeTruthy();
          const rawConfigAfter = DConfig.getRaw(wsRoot);
          expect(_.has(rawConfigAfter.dev, "enableWebUI")).toBeFalsy();
        },
        {
          expect,
          modConfigCb: (config) => {
            // @ts-ignore
            config.dev = { enableWebUI: true };
            return config;
          },
        }
      );
    });
  });

  describe("WHEN deprecated config doesn't exist", () => {
    test("THEN config doesn't change and backup is not created.", async () => {
      await runEngineTestV5(
        async ({ wsRoot, engine }) => {
          const rawConfigBefore = DConfig.getRaw(wsRoot);
          expect(_.has(rawConfigBefore.dev, "enableWebUI")).toBeFalsy();
          const out = await runDoctor({
            wsRoot,
            engine,
            action,
          });
          expect(out).toEqual({ exit: true });
          const rawConfig = DConfig.getRaw(wsRoot);
          expect(rawConfigBefore).toEqual(rawConfig);

          const backupService = new BackupService({ wsRoot });
          try {
            const configBackups = backupService.getBackupsWithKey({
              key: "config",
            });
            expect(configBackups.length).toEqual(0);
          } finally {
            backupService.dispose();
          }
        },
        {
          expect,
        }
      );
    });
  });
});

describe("GIVEN fixInvalidFilenames", () => {
  const action = DoctorActionsEnum.FIX_INVALID_FILENAMES;
  describe("WHEN workspace with note that has invalid filename", () => {
    test("THEN invalid file name is automatically fixed", async () => {
      await runEngineTestV5(
        async ({ wsRoot, engine }) => {
          await runDoctor({
            wsRoot,
            engine,
            action,
          });
          const getNoteResp = await engine.getNote("bar..('foo',)");
          expect(getNoteResp.data).toBeTruthy();
          expect(getNoteResp.data?.fname).toEqual("bar.foo");
        },
        {
          preSetupHook: setupWithInvalidFilename,
          expect,
        }
      );
    });
  });
});
