import { ENGINE_HOOKS } from "../../presets";
import { runEngineTestV5 } from "../../engine";
import { GDocImportPod } from "@dendronhq/pods-core";
import { VaultUtils } from "@dendronhq/common-all";
import {response, comments} from "../../utils/GDocMockResult";
import axios from 'axios';

jest.mock('axios');


describe("GDoc import pod", () => {
  let result: any;

  test("Import GDoc as Markdown", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GDocImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result=response;
        mockedAxios.get.mockResolvedValue(result);

        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src: "foo",
            token: "xyzabcd",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
          },
        });
          expect(importedNotes[0].body).toMatch("\n\n## Testing GDoc Pod\n\nThis is the first line\n\n\n");
          
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
            documentId: 'sjkakauwu',
            revisionId: 'ALm37BXFqAKco_'
          },
          body: '\n\n## Testing GDoc Pod\n\nThis is the first line\n\n\n'
        };
        pod.getDataFromGDoc = jest.fn().mockReturnValue(response);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result=comments;
        mockedAxios.get.mockResolvedValue(result);

        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src: "foo",
            token: "xyzabcd",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
            importComments: {
              enable: true,
              format: "json"
            }
          },
        });
          expect(importedNotes[0].body).toMatchSnapshot()
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
            documentId: 'sjkakauwu',
            revisionId: 'ALm37BXFqAKco_'
          },
          body: '\n\n## Testing GDoc Pod\n\nThis is the first line\n\n\n'
        };
        pod.getDataFromGDoc = jest.fn().mockReturnValue(response);
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        result=comments;
        mockedAxios.get.mockResolvedValue(result);

        const { importedNotes } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src: "foo",
            token: "xyzabcd",
            vaultName,
            documentId: "sdhdoj",
            hierarchyDestination: "gdoc.meet",
            importComments: {
              enable: true,
              format: "text"
            }
          },
        });
          expect(importedNotes[0].body).toMatchSnapshot()
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});
