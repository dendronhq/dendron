import { ResponseUtil, Time } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { EngineUtils, openPortFile } from "@dendronhq/engine-server";
import {
  AirtableExportPodV2,
  ConfigFileUtils,
  ExportPodConfigurationV2,
  ExternalConnectionManager,
  ExternalService,
  GoogleDocsExportPodV2,
  JSONExportPodV2,
  JSONSchemaType,
  MarkdownExportPodV2,
  NotionExportPodV2,
  PodExportScope,
  PodV2ConfigManager,
  PodV2Types,
  RunnableGoogleDocsV2PodConfig,
  RunnableNotionV2PodConfig,
  RunnableJSONV2PodConfig,
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

/**
 * ConfigFileUtils
 */
describe("GIVEN a ConfigFileUtils class", () => {
  type testType = {
    foo: string;
    bar: number;
    nonEssential?: string;
  };

  const configSchema: JSONSchemaType<testType> = {
    required: ["foo", "bar"],
    type: "object",
    additionalProperties: true,
    properties: {
      foo: {
        description: "foo",
        type: "string",
      },
      bar: {
        description: "bar",
        type: "number",
      },
      nonEssential: {
        description: "optional",
        type: "string",
        nullable: true,
      },
    },
  };

  describe("WHEN generating a config file with a basic schema", () => {
    const fPath = path.join(tmpDir().name, "test_config.yml");

    afterAll(() => {
      fs.removeSync(fPath);
    });

    ConfigFileUtils.genConfigFileV2({
      fPath,
      configSchema,
    });

    test("THEN expect required properties to be present", () => {
      const readData = ConfigFileUtils.getConfigByFPath({ fPath });
      expect(readData).toBeDefined();
      expect(readData.foo).toEqual("TODO");
      expect(readData.bar).toEqual("TODO");
    });

    test("AND optional properties to be present, but commented out", () => {
      const configFile = fs.readFileSync(fPath, { encoding: "utf8" });
      expect(configFile).toMatchSnapshot();
    });
  });

  describe("WHEN there are pre-set properties", () => {
    const fPath = path.join(tmpDir().name, "test_config_with_presets.yml");

    afterAll(() => {
      fs.removeSync(fPath);
    });

    ConfigFileUtils.genConfigFileV2({
      fPath,
      configSchema,
      setProperties: {
        foo: "foo",
      },
    });

    test("THEN expect those properties to be set in the config", () => {
      const readData = ConfigFileUtils.getConfigByFPath({ fPath });
      expect(readData).toBeDefined();
      expect(readData.foo).toEqual("foo");
      expect(readData.bar).toEqual("TODO");
    });
  });
});

/**
 * PodV2ConfigManager
 */
describe("GIVEN a PodV2ConfigManager class", () => {
  const podsDir = tmpDir().name;

  afterAll(() => {
    fs.removeSync(podsDir);
  });

  const podConfig1: ExportPodConfigurationV2 = {
    podId: "foo",
    podType: PodV2Types.AirtableExportV2,
    exportScope: PodExportScope.Note,
  };

  const podConfig2: ExportPodConfigurationV2 = {
    podId: "bar",
    podType: PodV2Types.MarkdownExportV2,
    exportScope: PodExportScope.Hierarchy,
  };

  const podConfig3: ExportPodConfigurationV2 = {
    podId: "foo-bar",
    podType: PodV2Types.GoogleDocsExportV2,
    exportScope: PodExportScope.Note,
  };

  const podConfig4: ExportPodConfigurationV2 = {
    podId: "foo-bar",
    podType: PodV2Types.NotionExportV2,
    exportScope: PodExportScope.Note,
  };

  ConfigFileUtils.genConfigFileV2({
    fPath: path.join(podsDir, "foo.yml"),
    configSchema: AirtableExportPodV2.config(),
    setProperties: podConfig1,
  });

  ConfigFileUtils.genConfigFileV2({
    fPath: path.join(podsDir, "bar.yml"),
    configSchema: MarkdownExportPodV2.config(),
    setProperties: podConfig2,
  });

  ConfigFileUtils.genConfigFileV2({
    fPath: path.join(podsDir, "foo-bar.yml"),
    configSchema: GoogleDocsExportPodV2.config(),
    setProperties: podConfig3,
  });

  ConfigFileUtils.genConfigFileV2({
    fPath: path.join(podsDir, "notion.yml"),
    configSchema: NotionExportPodV2.config(),
    setProperties: podConfig4,
  });

  const podConfigWithoutExportScope = {
    podId: "test-config",
    podType: PodV2Types.MarkdownExportV2,
  };

  ConfigFileUtils.genConfigFileV2({
    fPath: path.join(podsDir, "test-config.yml"),
    configSchema: MarkdownExportPodV2.config(),
    setProperties: podConfigWithoutExportScope,
  });

  describe("WHEN getting a pod config by an existing ID", () => {
    test("THEN expect the pod config to be retrieved", () => {
      const podConfig = PodV2ConfigManager.getPodConfigById({
        podsDir,
        opts: {
          podId: "foo",
        },
      });
      expect(podConfig).toBeDefined();
      expect(podConfig?.podId).toEqual("foo");
      expect(podConfig?.podType).toEqual(PodV2Types.AirtableExportV2);
    });
  });

  describe("WHEN getting a pod config by a non-existent ID", () => {
    test("THEN expect nothing to be returned", () => {
      const podConfig = PodV2ConfigManager.getPodConfigById({
        podsDir,
        opts: {
          podId: "Invalid",
        },
      });

      expect(podConfig).toBeUndefined();
    });
  });

  describe("WHEN getting all pod configs", () => {
    test("THEN expect all pod configs to be returned", () => {
      const configs = PodV2ConfigManager.getAllPodConfigs(podsDir);

      expect(configs.length).toEqual(5);
    });
  });
});

/**
 * ExternalConnectionManager
 */
describe("GIVEN an ExternalConnectionManager class", () => {
  const testDir = tmpDir().name;
  const connectionManager = new ExternalConnectionManager(testDir);

  afterAll(() => {
    fs.removeSync(testDir);
  });

  afterEach(() => {
    fs.removeSync(path.join(testDir, ExternalConnectionManager.subPath));
  });

  describe("WHEN creating a new config with an existing ID", () => {
    test("THEN expect an error to be thrown", async () => {
      const fn = async () => {
        await connectionManager.createNewConfig({
          serviceType: ExternalService.Airtable,
          id: "foo",
        });

        await connectionManager.createNewConfig({
          serviceType: ExternalService.Airtable,
          id: "foo",
        });
      };

      expect(fn).rejects.toThrowError();
    });
  });

  describe("WHEN creating an AirtableConnection config with a unique ID", () => {
    test("THEN expect the config to be created", async () => {
      await connectionManager.createNewConfig({
        serviceType: ExternalService.Airtable,
        id: "foo",
      });

      const config = connectionManager.getConfigById({ id: "foo" });
      expect(config?.connectionId).toEqual("foo");
      expect(config?.serviceType).toEqual(ExternalService.Airtable);
    });
  });

  describe("WHEN creating a GoogleDocs config with a unique ID", () => {
    test("THEN expect the config to be created", async () => {
      await connectionManager.createNewConfig({
        serviceType: ExternalService.GoogleDocs,
        id: "foo",
      });

      const config = connectionManager.getConfigById({ id: "foo" });
      expect(config?.connectionId).toEqual("foo");
      expect(config?.serviceType).toEqual(ExternalService.GoogleDocs);
    });
  });

  describe("WHEN multiple configs of different types exist", () => {
    test("THEN expect type-matching configs to be returned", async () => {
      await connectionManager.createNewConfig({
        serviceType: ExternalService.Airtable,
        id: "airtable-one",
      });

      await connectionManager.createNewConfig({
        serviceType: ExternalService.Airtable,
        id: "airtable-two",
      });

      const configs = await connectionManager.getAllConfigsByType(
        ExternalService.Airtable
      );
      expect(configs.length).toEqual(2);
    });

    test("AND non type-matching configs to NOT be returned", async () => {
      await connectionManager.createNewConfig({
        serviceType: ExternalService.Airtable,
        id: "airtable",
      });

      await connectionManager.createNewConfig({
        serviceType: ExternalService.GoogleDocs,
        id: "googledocs",
      });

      const configs = await connectionManager.getAllConfigsByType(
        ExternalService.Airtable
      );
      expect(configs.length).toEqual(1);
    });
  });
});

/**
 * GoogleDocsExportPod
 */
describe("GIVEN a Google Docs Export Pod with a particular config", () => {
  // pod tests can take a long time to run
  jest.setTimeout(60000);

  describe("WHEN exporting a note", () => {
    test("THEN expect gdoc to be created", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableGoogleDocsV2PodConfig = {
            exportScope: PodExportScope.Note,
            accessToken: "test",
            refreshToken: "test",
            expirationTime: Time.now().toSeconds() + 5000,
            connectionId: "foo",
          };
          const { wsRoot } = opts;
          const fpath = EngineUtils.getPortFilePathForCLI({ wsRoot });
          const port = openPortFile({ fpath });
          const pod = new GoogleDocsExportPodV2({
            podConfig,
            engine: opts.engine,
            port,
          });
          const response = {
            data: [
              {
                documentId: "testdoc",
                revisionId: "test",
                dendronId: "foo",
              },
            ],
            errors: [],
          };
          pod.createGdoc = jest.fn().mockResolvedValue(response);
          const props = (
            await opts.engine.findNotes({
              fname: "simple-wikilink",
              vault: opts.vaults[0],
            })
          )[0];

          const result = await pod.exportNotes([props]);
          const entCreate = result.data?.created!;
          const entUpdate = result.data?.updated!;
          expect(entCreate.length).toEqual(1);
          expect(entCreate[0]?.documentId).toEqual("testdoc");
          expect(entUpdate.length).toEqual(0);
        },
        {
          expect,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_SIMPLE.create({
              wsRoot,
              vault: vaults[0],
            });
            await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_SIMPLE_TARGET.create({
              wsRoot,
              vault: vaults[0],
            });
            await fs.writeFileSync(
              path.join(wsRoot, ".dendron.port.cli"),
              "300"
            );
          },
        }
      );
    });
  });

  describe("WHEN there is an error in response", () => {
    test("THEN expect gdoc to return error message", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableGoogleDocsV2PodConfig = {
            exportScope: PodExportScope.Note,
            accessToken: "test",
            refreshToken: "test",
            expirationTime: Time.now().toSeconds() + 5000,
            connectionId: "foo",
          };
          const { wsRoot } = opts;
          const fpath = EngineUtils.getPortFilePathForCLI({ wsRoot });
          const port = openPortFile({ fpath });
          const pod = new GoogleDocsExportPodV2({
            podConfig,
            engine: opts.engine,
            port,
          });
          const response = {
            data: [],
            errors: [
              {
                data: {},
                error: "error with status code 501",
              },
            ],
          };
          pod.createGdoc = jest.fn().mockResolvedValue(response);
          const props = (
            await opts.engine.findNotes({
              fname: "simple-wikilink",
              vault: opts.vaults[0],
            })
          )[0];

          const result = await pod.exportNotes([props]);
          const entCreate = result.data?.created!;
          expect(entCreate.length).toEqual(0);
          expect(ResponseUtil.hasError(result)).toBeTruthy();
        },
        {
          expect,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_SIMPLE.create({
              wsRoot,
              vault: vaults[0],
            });
            await fs.writeFileSync(
              path.join(wsRoot, ".dendron.port.cli"),
              "300"
            );
          },
        }
      );
    });
  });
});

/**
 * Notion Export Pod
 */

describe("GIVEN a Notion Export Pod with a particular config", () => {
  describe("WHEN exporting a note", () => {
    test("THEN expect notion doc to be created", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableNotionV2PodConfig = {
            exportScope: PodExportScope.Note,
            apiKey: "test",
            parentPageId: "test",
          };

          const pod = new NotionExportPodV2({
            podConfig,
          });
          const props = (
            await opts.engine.findNotes({
              fname: "bar",
              vault: opts.vaults[0],
            })
          )[0];
          const response = {
            data: [
              {
                dendronId: `${props.id}`,
                notionId: "test",
              },
            ],
            errors: [],
          };
          pod.convertMdToNotionBlock = jest.fn();
          pod.createPagesInNotion = jest.fn().mockResolvedValue(response);
          const result = await pod.exportNotes([props]);
          const entCreate = result.data?.created!;
          expect(entCreate.length).toEqual(1);
          expect(entCreate[0]?.notionId).toEqual("test");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});

/**
 * JSONExportPod
 */

describe("GIVEN a JSON Export Pod with a particular config", () => {
  describe("WHEN exporting a note and destination is clipboard", () => {
    test("THEN expect note to be exported", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableJSONV2PodConfig = {
            exportScope: PodExportScope.Note,
            destination: "clipboard",
          };
          const pod = new JSONExportPodV2({
            podConfig,
          });
          const props = (
            await opts.engine.findNotes({
              fname: "bar",
              vault: opts.vaults[0],
            })
          )[0];
          const result = await pod.exportNotes([props]);
          const data = result.data?.exportedNotes!;
          expect(_.isString(data)).toBeTruthy();
          if (_.isString(data)) {
            expect(result.data?.exportedNotes).toEqual(
              JSON.stringify(props, null, 4)
            );
          }
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("When the destination is file system", () => {
    let exportDest: string;
    beforeAll(() => {
      exportDest = path.join(tmpDir().name, "export.json");
    });
    describe("WHEN exporting a note", () => {
      test("THEN expect note to be exported", async () => {
        await runEngineTestV5(
          async (opts) => {
            const podConfig: RunnableJSONV2PodConfig = {
              exportScope: PodExportScope.Note,
              destination: exportDest,
            };
            const pod = new JSONExportPodV2({
              podConfig,
            });

            const props = (
              await opts.engine.findNotes({
                fname: "bar",
                vault: opts.vaults[0],
              })
            )[0];

            await pod.exportNotes([props]);
            const content = fs.readFileSync(path.join(exportDest), {
              encoding: "utf8",
            });
            expect(content).toContain(JSON.stringify(props));
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupBasic,
          }
        );
      });
    });
  });
});
