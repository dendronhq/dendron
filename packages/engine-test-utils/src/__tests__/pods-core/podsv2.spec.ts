import { NoteProps, NoteUtils, Time } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import {
  AirtableExportPodV2,
  ConfigFileUtils,
  ExportPodConfigurationV2,
  ExternalConnectionManager,
  ExternalService,
  GoogleDocsExportPodV2,
  JSONSchemaType,
  MarkdownExportPodV2,
  PodExportScope,
  PodV2ConfigManager,
  PodV2Types,
  RunnableGoogleDocsV2PodConfig,
  RunnableMarkdownV2PodConfig,
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import path from "path";
import { runEngineTestV5 } from "../../engine";

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
      expect(podConfig?.exportScope).toEqual(PodExportScope.Note);
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

      expect(configs.length).toEqual(3);
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
 * MarkdownExportPod
 */
describe("GIVEN a Markdown Export Pod with a particular config", () => {
  describe("WHEN exporting a note", () => {
    test("THEN expect wikilinks to be converted", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableMarkdownV2PodConfig = {
            exportScope: PodExportScope.Note,
            destination: "clipboard",
          };

          const pod = new MarkdownExportPodV2({
            podConfig,
            engine: opts.engine,
            dendronConfig: opts.dendronConfig!,
          });

          const props = NoteUtils.getNoteByFnameFromEngine({
            fname: "simple-wikilink",
            vault: opts.vaults[0],
            engine: opts.engine,
          }) as NoteProps;

          const result = await pod.exportNote(props);
          expect(result.includes("[One](/simple-wikilink/one)")).toBeTruthy();
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
          },
        }
      );
    });
  });
  describe("WHEN convertUserNotesToLinks is not configured explicitly", () => {
    test("THEN expect user tags to remain unchanged", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableMarkdownV2PodConfig = {
            exportScope: PodExportScope.Note,
            destination: "clipboard",
          };

          const pod = new MarkdownExportPodV2({
            podConfig,
            engine: opts.engine,
            dendronConfig: opts.dendronConfig!,
          });

          const props = NoteUtils.getNoteByFnameFromEngine({
            fname: "usertag",
            vault: opts.vaults[0],
            engine: opts.engine,
          }) as NoteProps;

          const result = await pod.exportNote(props);

          expect(result.includes("@johndoe")).toBeTruthy();
          expect(result.includes("[@johndoe](/user/johndoe)")).toBeFalsy();
        },
        {
          expect,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NOTE_PRESETS_V4.NOTE_WITH_USERTAG.create({
              wsRoot,
              vault: vaults[0],
            });
          },
        }
      );
    });
  });

  describe("WHEN addFrontmatterTitle is set to false", () => {
    test("THEN expect title to not be present as h1 header", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableMarkdownV2PodConfig = {
            exportScope: PodExportScope.Note,
            destination: "clipboard",
            addFrontmatterTitle: false,
          };

          const pod = new MarkdownExportPodV2({
            podConfig,
            engine: opts.engine,
            dendronConfig: opts.dendronConfig!,
          });

          const props = NoteUtils.getNoteByFnameFromEngine({
            fname: "usertag",
            vault: opts.vaults[0],
            engine: opts.engine,
          }) as NoteProps;

          const result = await pod.exportNote(props);

          expect(result.indexOf("Usertag")).toEqual(-1);
        },
        {
          expect,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NOTE_PRESETS_V4.NOTE_WITH_USERTAG.create({
              wsRoot,
              vault: vaults[0],
            });
          },
        }
      );
    });
  });
  describe("WHEN convertTagNotesToLinks is set to false", () => {
    test("THEN expect tags to remain unparsed", async () => {
      await runEngineTestV5(
        async (opts) => {
          const podConfig: RunnableMarkdownV2PodConfig = {
            exportScope: PodExportScope.Note,
            destination: "clipboard",
          };

          const pod = new MarkdownExportPodV2({
            podConfig,
            engine: opts.engine,
            dendronConfig: opts.dendronConfig!,
          });

          const props = NoteUtils.getNoteByFnameFromEngine({
            fname: "footag",
            vault: opts.vaults[0],
            engine: opts.engine,
          }) as NoteProps;

          const result = await pod.exportNote(props);
          expect(result.includes("#foobar")).toBeTruthy();
          expect(result.includes("[#foobar](/tags/foobar")).toBeFalsy();
        },
        {
          expect,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NOTE_PRESETS_V4.NOTE_WITH_TAG.create({
              wsRoot,
              vault: vaults[0],
            });
          },
        }
      );
    });
  });
});

/**
 * GoogleDocsExportPod
 */
describe("GIVEN a Google Docs Export Pod with a particular config", () => {
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

          const pod = new GoogleDocsExportPodV2({
            podConfig,
            engine: opts.engine,
            vaults: opts.vaults,
            wsRoot: opts.wsRoot,
          });
          const response = {
            data: {
              documentId: "testdoc",
            },
          };
          pod.createGdoc = jest.fn().mockResolvedValue(response);
          const props = NoteUtils.getNoteByFnameFromEngine({
            fname: "simple-wikilink",
            vault: opts.vaults[0],
            engine: opts.engine,
          }) as NoteProps;

          const result = await pod.exportNote(props);
          expect(result.data?.documentId).toEqual("testdoc");
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
          },
        }
      );
    });
  });
});
