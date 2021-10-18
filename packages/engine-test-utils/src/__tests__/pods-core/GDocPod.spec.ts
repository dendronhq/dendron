import { ENGINE_HOOKS } from "../../presets";
import { runEngineTestV5 } from "../../engine";
import { GDocImportPod, PodUtils, PROMPT } from "@dendronhq/pods-core";
import { Time, VaultUtils } from "@dendronhq/common-all";
import { response, comments, existingNote } from "../../utils/GDocMockResult";
import axios from "axios";
import sinon from "sinon";
import { window } from "../../__mocks__/vscode";
import path from "path";

jest.mock("axios");

const stubWindow = (resp: any) => {
  sinon.stub(window, "showInformationMessage").resolves(resp);
};

describe("GDoc import pod", () => {
  let result: any;
  const text = "\n\n## Testing GDoc Pod\n\nThis is the first line\n\n\n";
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
  const docIdsHashMap = { foo: "1dejjityws", bar: "skdeugndk" };
  const utilityMethods = {
    showInputBox: jest.fn().mockResolvedValue("gdoc.meet"),
    getGlobalState: jest.fn().mockResolvedValue(undefined),
    updateGlobalState: jest.fn().mockResolvedValue(undefined),
    openFileInEditor: jest.fn().mockResolvedValue(undefined),
    showDocumentQuickPick: jest.fn().mockResolvedValue({ label: "foo" }),
  };

  afterEach(() => {
    sinon.restore();
  });
  test("Import GDoc as Markdown", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        PodUtils.downloadImage = jest.fn().mockReturnValue(`${text}`);
        result = response;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            refreshToken: "dhdjdjs",
            expirationTime: Time.now().toSeconds() + 500,
            vaultName,
          },
        });
        expect(importedNotes[0].body).toMatch(text);
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
          body: text,
        };
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
        pod.getDataFromGDoc = jest.fn().mockReturnValue(response);
        PodUtils.downloadImage = jest.fn();
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = comments;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            vaultName,
            refreshToken: "hksall",
            expirationTime: Time.now().toSeconds() + 500,
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
          body: text,
        };
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
        pod.getDataFromGDoc = jest.fn().mockReturnValue(response);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = comments;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            refreshToken: "emeiice",
            expirationTime: Time.now().toSeconds() + 500,
            vaultName,
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
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            refreshToken: "akSAal",
            expirationTime: Time.now().toSeconds() + 500,
            vaultName,
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
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
        await engine.writeNote(existingNote, { newNode: true });
        mockedAxios.get.mockResolvedValue(result);
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            refreshToken: "LalaLAL",
            expirationTime: Time.now().toSeconds() + 500,
            vaultName,
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
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
        await engine.writeNote(existingNote, { newNode: true });
        mockedAxios.get.mockResolvedValue(result);
        stubWindow(undefined);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            refreshToken: "hjsjisw",
            expirationTime: Time.now().toSeconds() + 500,
            vaultName,
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
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
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
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            refreshToken: "kqSLA",
            expirationTime: Time.now().toSeconds() + 500,
            vaultName,
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

  test("documents containg an image", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        PodUtils.downloadImage = jest
          .fn()
          .mockReturnValue(
            `${text}![image](${path.join("assets", `image.png`)})`
          );
        pod.getAllDocuments = jest.fn().mockReturnValue({ docIdsHashMap });
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result = response;
        mockedAxios.get.mockResolvedValue(result);
        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          utilityMethods,
          onPrompt,
          config: {
            src: "foo",
            accessToken: "xyzabcd",
            refreshToken: "dhdjdjs",
            expirationTime: Time.now().toSeconds() + 500,
            vaultName,
          },
        });
        expect(importedNotes[0].body).toMatch(
          `\n\n## Testing GDoc Pod\n\nThis is the first line\n\n![image](${path.join(
            "assets",
            `image.png`
          )})`
        );
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});
