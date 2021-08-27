import { ENGINE_HOOKS } from "../../presets";
import { runEngineTestV5 } from "../../engine";
import { GDocImportPod, PROMPT } from "@dendronhq/pods-core";
import { VaultUtils } from "@dendronhq/common-all";
import { response, comments, existingNote } from "../../utils/GDocMockResult";
import axios from "axios";
import sinon from "sinon";
import { window } from "../../__mocks__/vscode";

jest.mock("axios");

const stubWindow = (resp: any) => {
  sinon.stub(window, "showInformationMessage").resolves(resp);
};

describe("GDoc import pod", () => {
  let result: any;
  const onPrompt = async (type?: PROMPT) => {
    const resp =
      type === PROMPT.USERPROMPT
        ? await window.showInformationMessage(
            "Do you want to overwrite",
            { modal: true },
            { title: "Yes" }
          )
        : window.showInformationMessage(
            "Note is already in sync with the google doc"
          );
    return resp;
  };
  afterEach(() => {
    sinon.restore();
  });
  test("Import GDoc as Markdown", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = response;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          onPrompt,
          config: {
            src: "foo",
            token: "xyzabcd",
            refreshToken: "dhdjdjs",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
          },
        });
        expect(importedNotes[0].body).toMatch(
          "\n\n## Testing GDoc Pod\n\nThis is the first line\n\n\n"
        );
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("Import Comments in Markdown as json", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const response = {
          fname: "gdoc.meet",
          custom: {
            documentId: "sjkakauwu",
            revisionId: "ALm37BXFqAKco_",
          },
          body: "\n\n## Testing GDoc Pod\n\nThis is the first line\n\n\n",
        };
        pod.getDataFromGDoc = jest.fn().mockReturnValue(response);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = comments;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          onPrompt,
          config: {
            src: "foo",
            token: "xyzabcd",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
            refreshToken: "hksall",
            importComments: {
              enable: true,
              format: "json",
            },
          },
        });
        expect(importedNotes[0].body).toMatchSnapshot();
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("Import Comments in Markdown as text", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const response = {
          fname: "gdoc.meet",
          custom: {
            documentId: "sjkakauwu",
            revisionId: "ALm37BXFqAKco_",
          },
          body: "\n\n## Testing GDoc Pod\n\nThis is the first line\n\n\n",
        };
        pod.getDataFromGDoc = jest.fn().mockReturnValue(response);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = comments;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          onPrompt,
          config: {
            src: "foo",
            token: "xyzabcd",
            refreshToken: "emeiice",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
            importComments: {
              enable: true,
              format: "text",
            },
          },
        });
        expect(importedNotes[0].body).toMatchSnapshot();
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("confirmOverwrite to false", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = response;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          onPrompt,
          config: {
            src: "foo",
            token: "xyzabcd",
            refreshToken: "akSAal",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
            confirmOverwrite: false,
          },
        });
        expect(importedNotes).toHaveLength(1);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
  test("with same revision ID of notes", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = response;
        await engine.writeNote(existingNote, { newNode: true });
        mockedAxios.get.mockResolvedValue(result);
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          onPrompt,
          config: {
            src: "foo",
            token: "xyzabcd",
            refreshToken: "LalaLAL",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
          },
        });

        expect.assertions(1);
        return expect(window.showInformationMessage).toHaveBeenCalledWith(
          "Note is already in sync with the google doc"
        );
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("with confirmOverwrite true and selecting cancel from prompt", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = response;
        existingNote.custom.revisionId = "jslkdhsal";
        await engine.writeNote(existingNote, { newNode: true });
        mockedAxios.get.mockResolvedValue(result);
        stubWindow(undefined);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          onPrompt,
          config: {
            src: "foo",
            token: "xyzabcd",
            refreshToken: "hjsjisw",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
          },
        });
        return expect(importedNotes).toEqual([]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("with confirmOverwrite true and selecting Yes from prompt", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = response;
        existingNote.custom.revisionId = "jslkdhsa";
        await engine.writeNote(existingNote, { newNode: true });
        mockedAxios.get.mockResolvedValue(result);
        const resp = {
          title: "Yes",
        };
        stubWindow(resp);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          onPrompt,
          config: {
            src: "foo",
            token: "xyzabcd",
            refreshToken: "kqSLA",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
          },
        });
        expect.assertions(1);
        expect(importedNotes).toHaveLength(1);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});
