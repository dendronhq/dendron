import { runEngineTestV5 } from "../../engine";
import axios from "axios";
import { VaultUtils } from "@dendronhq/common-all";
import { MergeConflictOptions, OrbitImportPod } from "@dendronhq/pods-core";
import { ENGINE_HOOKS } from "../../presets";

jest.mock("axios");

const utilityMethods = {
  handleConflict: jest.fn().mockReturnValue(MergeConflictOptions.OVERWRITE),
};

describe("Given Orbit Import Pod", () => {
  let response: any;
  beforeEach(() => {
    response = {
      data: {
        data: [
          {
            attributes: {
              name: "John Doe",
              github: "johndoe",
              discord: "johndoe",
              linkedin: null,
              id: "sddsnjdek",
              twitter: null,
              hn: null,
              website: null,
            },
          },
          {
            attributes: {
              name: null,
              github: "foobar",
              discord: "foobar23",
              linkedin: null,
              id: "njdek",
              twitter: null,
              hn: null,
              website: null,
            },
          },
        ],
      },
    };
  });
  describe("WHEN execute for a workspace", () => {
    test("THEN all the members in orbit workspace should be imported in people.{name} hierarchy", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const pod = new OrbitImportPod();
          const vaultName = VaultUtils.getName(vaults[0]);
          const mockedAxios = axios as jest.Mocked<typeof axios>;
          mockedAxios.get.mockResolvedValue(response);
          const { importedNotes } = await pod.execute({
            engine,
            vaults,
            wsRoot,
            utilityMethods,
            config: {
              src: "orbit",
              token: "xyzabcd",
              vaultName,
              workspaceSlug: "dendron-discord",
            },
          });
          expect(importedNotes.length).toEqual(2);
          expect(importedNotes[0].fname).toContain("people");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
  describe("WHEN name is present for an orbit member", () => {
    test("THEN note should have people.{name} as fname", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const pod = new OrbitImportPod();
          const vaultName = VaultUtils.getName(vaults[0]);
          const mockedAxios = axios as jest.Mocked<typeof axios>;
          mockedAxios.get.mockResolvedValue(response);
          const { importedNotes } = await pod.execute({
            engine,
            vaults,
            wsRoot,
            utilityMethods,
            config: {
              src: "orbit",
              token: "xyzabcd",
              vaultName,
              workspaceSlug: "dendron-discord",
            },
          });
          expect(importedNotes[0].fname).toEqual("people.john-doe");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("WHEN name is not present for an orbit member and github attribute is not null", () => {
    test("THEN note should have people.{github-username} as fname", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const pod = new OrbitImportPod();
          const vaultName = VaultUtils.getName(vaults[0]);
          const mockedAxios = axios as jest.Mocked<typeof axios>;
          mockedAxios.get.mockResolvedValue(response);
          const { importedNotes } = await pod.execute({
            engine,
            vaults,
            wsRoot,
            utilityMethods,
            config: {
              src: "orbit",
              token: "xyzabcd",
              vaultName,
              workspaceSlug: "dendron-discord",
            },
          });
          expect(importedNotes[1].fname).toEqual("people.foobar");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});
