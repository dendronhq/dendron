import { ENGINE_HOOKS } from "../../presets";
import { runEngineTestV5 } from "../../engine";
import {
  GithubIssueImportPod,
  GithubIssuePublishPod,
  GITHUBMESSAGE,
} from "@dendronhq/pods-core";
import { NoteProps, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";

describe("GithubIssuePod import pod", () => {
  let result: any;
  let fname: string;
  beforeEach(() => {
    result = {
      search: {
        pageInfo: {
          hasNextPage: false,
        },
        edges: [
          {
            node: {
              title: "Test Issue",
              url: "https://github.com/dendronhq/dendron/issues/902",
              number: 902,
              state: "OPEN",
              id: "sddsnjdek",
              author: {
                url: "https://github.com/xyzuser",
              },
              labels: {
                edges: [
                  {
                    node: {
                      name: "area.misc",
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    };
    fname = "github.issues.902-test-issue";
  });

  test("Import Issue with status: open", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubIssueImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);

        pod.getDataFromGithub = jest.fn().mockReturnValue(result);

        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src: "github",
            token: "xyzabcd",
            owner: "dendronhq",
            repository: "dendron-site",
            status: "open",
            vaultName,
            fname: "github.issues",
          },
        });

        const note = (
          await engine.findNotes({
            fname,
            vault: vaults[0],
          })
        )[0];
        expect(note.custom.status).toEqual("OPEN");
        expect(note.custom.author).toEqual("https://github.com/xyzuser");
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("fname as id", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubIssueImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);

        pod.getDataFromGithub = jest.fn().mockReturnValue(result);

        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src: "github",
            token: "xyzabcd",
            owner: "dendronhq",
            repository: "dendron-site",
            status: "open",
            vaultName,
            fname: "github.issues",
            fnameAsId: true,
          },
        });
        const note = (
          await engine.findNotesMeta({
            fname,
            vault: vaults[0],
          })
        )[0];
        expect(note.id).toEqual(fname);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("with frontmatter", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubIssueImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);

        pod.getDataFromGithub = jest.fn().mockReturnValue(result);

        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src: "github",
            token: "xyzabcd",
            owner: "dendronhq",
            repository: "dendron-site",
            status: "open",
            vaultName,
            fname: "github.issues",
            frontmatter: {
              type: "issue",
            },
          },
        });
        const note = (
          await engine.findNotesMeta({
            fname,
            vault: vaults[0],
          })
        )[0];
        expect(note.custom.type).toEqual("issue");
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});

describe("GIVEN: Github publish pod is run for a note", () => {
  let issue: NoteProps;
  let pod: GithubIssuePublishPod;
  beforeEach(() => {
    issue = {
      id: "nCobWD86N10jWq6r",
      title: "Test",
      vault: { fsPath: "vault1" },
      type: "note",
      desc: "",
      links: [],
      anchors: {},
      fname: "foo",
      updated: 1627283357535,
      created: 1627283357535,
      parent: null,
      children: [],
      body: "\n\n## Testing Github Publish Pod",
      data: {},
      contentHash: undefined,
      tags: ["area.misc", "type.bug"],
      custom: {
        status: "CLOSED",
        issueID: "hsahdla",
      },
    };
    pod = new GithubIssuePublishPod();
    pod.createDiscussion = jest.fn();
    pod.createIssue = jest.fn();
    pod.updateIssue = jest.fn();
    pod.getDataFromGithub = jest.fn().mockReturnValue({
      labelsHashMap: { "area.misc": "sfgdjio", "type.bug": "gsfahhj" },
      discussionCategoriesHashMap: { Ideas: "sfgdjio", General: "gsfahhj" },
      assigneesHashMap: { john: "dhdjdj", doe: "dhdjdk" },
    });
  });

  const utilityMethods = {
    showMessage: {
      info: jest.fn(),
      warning: jest.fn(),
    },
  };
  describe("WHEN a note has issueID and status in FM", () => {
    test("THEN issue status is updated and response is issue URL", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const vaultName = VaultUtils.getName(vaults[0]);
          pod.updateIssue = jest.fn().mockReturnValue("https://github.com/foo");

          const rootNote = (
            await engine.findNotesMeta({
              fname: "root",
              vault: issue.vault,
            })
          )[0];
          if (!rootNote) {
            throw new Error("No root note found.");
          }
          issue.parent = rootNote.id;
          await engine.writeNote(issue);
          const resp = await pod.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              fname: "foo",
              vaultName,
              dest: "stdout",
              token: "asjska",
              repository: "dendron",
              owner: "dendronhq",
            },
            utilityMethods,
          });
          expect(resp).toEqual("https://github.com/foo");
          expect(pod.updateIssue).toHaveBeenCalledTimes(1);
          expect(pod.createDiscussion).toHaveBeenCalledTimes(0);
          expect(pod.createIssue).toHaveBeenCalledTimes(0);
        },
        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });
  });

  describe("WHEN note has invalid tags", () => {
    test("THEN warning message is sent and response is empty", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const vaultName = VaultUtils.getName(vaults[0]);
          const scratchIssue: NoteProps = _.omit(issue, "tags");
          scratchIssue.tags = "documentation";
          const rootNote = (
            await engine.findNotesMeta({
              fname: "root",
              vault: scratchIssue.vault,
            })
          )[0];
          if (!rootNote) {
            throw new Error("No root note found.");
          }
          scratchIssue.parent = rootNote.id;
          await engine.writeNote(scratchIssue);
          const resp = await pod.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              fname: "foo",
              vaultName,
              dest: "stdout",
              token: "asjska",
              repository: "dendron",
              owner: "dendronhq",
            },
            utilityMethods,
          });
          expect(utilityMethods.showMessage.warning).toHaveBeenCalledTimes(1);
          expect(utilityMethods.showMessage.warning).toHaveBeenCalledWith(
            GITHUBMESSAGE.INVALID_TAG
          );
          expect(pod.createDiscussion).toHaveBeenCalledTimes(0);
          expect(pod.createIssue).toHaveBeenCalledTimes(0);
          expect(pod.updateIssue).toHaveBeenCalledTimes(0);
          expect(resp).toEqual("");
        },

        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });
  });

  describe("WHEN Note does not have any custom FM", () => {
    test("THEN new issue is created and issue url is returned", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const vaultName = VaultUtils.getName(vaults[0]);
          pod.createIssue = jest.fn().mockReturnValue("https://github.com/foo");
          const scratchIssue: NoteProps = _.omit(issue, "custom");
          const rootNote = (
            await engine.findNotesMeta({
              fname: "root",
              vault: issue.vault,
            })
          )[0];
          if (!rootNote) {
            throw new Error("No root note found.");
          }
          scratchIssue.parent = rootNote.id;
          scratchIssue.custom = {};
          await engine.writeNote(scratchIssue);
          const resp = await pod.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              fname: "foo",
              vaultName,
              dest: "stdout",
              token: "asjska",
              repository: "dendron",
              owner: "dendronhq",
            },
            utilityMethods,
          });
          expect(resp).toEqual("https://github.com/foo");
          expect(utilityMethods.showMessage.warning).toHaveBeenCalledTimes(0);
          expect(pod.createIssue).toHaveBeenCalledTimes(1);
          expect(pod.createDiscussion).toHaveBeenCalledTimes(0);
          expect(pod.updateIssue).toHaveBeenCalledTimes(0);
        },

        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });
  });

  describe("WHEN Note has category in FM", () => {
    test("THEN discussion is created and response is discussion URL", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const vaultName = VaultUtils.getName(vaults[0]);
          pod.createDiscussion = jest
            .fn()
            .mockReturnValue("https://github.com/foo");
          issue.custom.category = "Ideas";
          const rootNote = (
            await engine.findNotesMeta({
              fname: "root",
              vault: issue.vault,
            })
          )[0];
          if (!rootNote) {
            throw new Error("No root note found.");
          }
          issue.parent = rootNote.id;
          await engine.writeNote(issue);
          const resp = await pod.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              fname: "foo",
              vaultName,
              dest: "stdout",
              token: "asjska",
              repository: "dendron",
              owner: "dendronhq",
            },
            utilityMethods,
          });
          expect(resp).toEqual("https://github.com/foo");
          expect(utilityMethods.showMessage.warning).toHaveBeenCalledTimes(0);
          expect(pod.createDiscussion).toHaveBeenCalledTimes(1);
          expect(pod.createIssue).toHaveBeenCalledTimes(0);
          expect(pod.updateIssue).toHaveBeenCalledTimes(0);
        },
        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });
  });

  describe("WHEN Note has invalid category in FM", () => {
    test("THEN warning message is shown and response is empty", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const vaultName = VaultUtils.getName(vaults[0]);
          pod.createDiscussion = jest
            .fn()
            .mockReturnValue("https://github.com/foo");
          issue.custom.category = "abcd";
          const rootNote = (
            await engine.findNotesMeta({
              fname: "root",
              vault: issue.vault,
            })
          )[0];
          if (!rootNote) {
            throw new Error("No root note found.");
          }
          issue.parent = rootNote.id;
          await engine.writeNote(issue);
          const resp = await pod.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              fname: "foo",
              vaultName,
              dest: "stdout",
              token: "asjska",
              repository: "dendron",
              owner: "dendronhq",
            },
            utilityMethods,
          });
          expect(resp).toEqual("");
          expect(utilityMethods.showMessage.warning).toHaveBeenCalledTimes(1);
          expect(utilityMethods.showMessage.warning).toHaveBeenCalledWith(
            GITHUBMESSAGE.INVALID_CATEGORY
          );
          expect(pod.createDiscussion).toHaveBeenCalledTimes(0);
          expect(pod.createIssue).toHaveBeenCalledTimes(0);
          expect(pod.updateIssue).toHaveBeenCalledTimes(0);
        },
        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });
  });

  describe("WHEN Note is updated with assignees in FM", () => {
    test("THEN issue is updated and response is issue URL", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const vaultName = VaultUtils.getName(vaults[0]);
          pod.updateIssue = jest.fn().mockReturnValue("https://github.com/foo");
          issue.custom.assignees = ["john", "doe"];
          const rootNote = (
            await engine.findNotesMeta({
              fname: "root",
              vault: issue.vault,
            })
          )[0];
          if (!rootNote) {
            throw new Error("No root note found.");
          }
          issue.parent = rootNote.id;
          await engine.writeNote(issue);
          const resp = await pod.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              fname: "foo",
              vaultName,
              dest: "stdout",
              token: "asjska",
              repository: "dendron",
              owner: "dendronhq",
            },
            utilityMethods,
          });
          expect(resp).toEqual("https://github.com/foo");
          expect(utilityMethods.showMessage.warning).toHaveBeenCalledTimes(0);
          expect(pod.createDiscussion).toHaveBeenCalledTimes(0);
          expect(pod.createIssue).toHaveBeenCalledTimes(0);
          expect(pod.updateIssue).toHaveBeenCalledTimes(1);
        },
        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });
  });
});
