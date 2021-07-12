import { ENGINE_HOOKS } from "../../presets";
import { runEngineTestV5 } from "../../engine";
import { GithubImportPod } from "@dendronhq/pods-core";
import { NoteUtils, VaultUtils } from "@dendronhq/common-all";

describe("GithubPod import pod", () => {
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
    fname = "github.issues.902-Test Issue";
  });

  test.skip("Bad Credentials", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const resp = async () => {
          return await pod.execute({
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
        };
        expect.assertions(1);
        return expect(resp()).rejects.toThrowError();
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("Import Issue with status: open", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GithubImportPod();
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
        const pod = new GithubImportPod();
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
        const pod = new GithubImportPod();
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
