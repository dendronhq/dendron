import { ENGINE_HOOKS } from "../../presets";
import { runEngineTestV5 } from "../../engine";
import {
  GithubIssueImportPod,
  GithubIssuePublishPod,
} from "@dendronhq/pods-core";
import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
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

        const note = NoteUtils.getNoteOrThrow({
          fname,
          notes: engine.notes,
          vault: vaults[0],
          wsRoot,
        });
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
        const note = NoteUtils.getNoteOrThrow({
          fname,
          notes: engine.notes,
          vault: vaults[0],
          wsRoot,
        });
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
        const note = NoteUtils.getNoteOrThrow({
          fname,
          notes: engine.notes,
          vault: vaults[0],
          wsRoot,
        });
        expect(note.custom.type).toEqual("issue");
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});

describe("github publish pod", () => {
  let issue: NoteProps;
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
        status: "OPEN",
        issueID: "hsahdla",
      },
    };
  });

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubIssuePublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        pod.getLabelsFromGithub = jest
          .fn()
          .mockReturnValue({ "area.misc": "sfgdjio", "type.bug": "gsfahhj" });
        pod.updateIssue = jest.fn().mockReturnValue("Issue Updated");
        await engine.writeNote(issue, { newNode: true });
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
        });
        expect(resp).toEqual("Github: Issue Updated");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });

  test("with invalid tags", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubIssuePublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        pod.getLabelsFromGithub = jest
          .fn()
          .mockReturnValue({ question: "abcdwe", enhancement: "kighxx" });
        pod.updateIssue = jest.fn().mockReturnValue("Issue Updated");
        await engine.writeNote(issue, { newNode: true });
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
        });
        expect(resp).toEqual(
          "Github: The labels in the tag does not belong to selected repository"
        );
      },

      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });

  test("create Issue", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubIssuePublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        pod.getLabelsFromGithub = jest
          .fn()
          .mockReturnValue({ "area.misc": "sfgdjio", "type.bug": "gsfahhj" });
        pod.createIssue = jest.fn().mockReturnValue("Issue Created");
        const scratchIssue: NoteProps = _.omit(issue, "custom");
        scratchIssue.custom = {};
        await engine.writeNote(scratchIssue, { newNode: true });
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
        });
        expect(resp).toEqual("Github: Issue Created");
      },

      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
