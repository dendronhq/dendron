import {
  ConfigStore,
  ConfigUtils,
  CONSTANTS,
  DeepPartial,
  DendronConfig,
  IFileStore,
  LookupConfig,
  URI,
} from "@dendronhq/common-all";
import { tmpDir, writeYAML } from "@dendronhq/common-server";
import { NodeJSFileStore } from "@dendronhq/engine-server";
import { existsSync, unlinkSync } from "fs";
import { ensureFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";

describe("ConfigStore", () => {
  let fileStore: IFileStore;
  describe("GIVEN NodeJSFileStore", () => {
    fileStore = new NodeJSFileStore();
    test("WHEN create, then create new config and persist", async () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;
      const configStore = new ConfigStore(
        fileStore,
        URI.parse(wsRoot),
        URI.parse(homeDir)
      );

      const createResult = await configStore.create();
      expect(createResult.isOk()).toBeTruthy();
      const config = createResult._unsafeUnwrap();
      expect(config).toMatchSnapshot();
      const isConfigPersisted = existsSync(
        path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE)
      );
      expect(isConfigPersisted).toBeTruthy();
    });

    describe("AND partial DendronConfig", () => {
      test("WHEN readRaw, then retrieve config as is", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;

        // remove some configs initially
        const initialConfig = ConfigUtils.genDefaultConfig();
        ConfigUtils.unsetProp(initialConfig, "preview");
        ConfigUtils.unsetProp(initialConfig, "commands");

        const configPath = path.join(wsRoot, "dendron.yml");
        ensureFileSync(configPath);
        writeYAML(configPath, initialConfig);

        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        const readRawResult = await configStore.readRaw();
        expect(readRawResult.isOk()).toBeTruthy();
        const rawConfig = readRawResult._unsafeUnwrap();
        expect(rawConfig).toEqual(initialConfig);
      });

      test("WHEN read with default, then retrieve config with missing defaults filled", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;

        // remove some configs initially
        const initialConfig = ConfigUtils.genDefaultConfig();
        ConfigUtils.unsetProp(initialConfig, "preview");
        ConfigUtils.unsetProp(initialConfig, "commands");

        const configPath = path.join(wsRoot, "dendron.yml");
        ensureFileSync(configPath);
        writeYAML(configPath, initialConfig);

        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        const readWithDefaultResult = await configStore.read({
          mode: "default",
        });

        expect(readWithDefaultResult.isOk()).toBeTruthy();
        const config = readWithDefaultResult._unsafeUnwrap();
        expect(config).toEqual(ConfigUtils.genDefaultConfig());

        // test cache

        // make sure dendron.yml is deleted
        unlinkSync(configPath);
        const rawResultIsError = (
          await configStore.readRaw()
        )._unsafeUnwrapErr();
        expect(
          rawResultIsError.message.includes(`Failed to read from ${configPath}`)
        ).toBeTruthy();
        const readWithDefaultCacheResult = await configStore.read({
          mode: "default",
          useCache: true,
        });

        // test if useCache returns ok
        expect(readWithDefaultCacheResult.isOk()).toBeTruthy();
        const configCached = readWithDefaultCacheResult._unsafeUnwrap();
        expect(configCached).toEqual(ConfigUtils.genDefaultConfig());
      });

      test("WHEN read with override, then retrieve config with override applied", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;

        // move some configs to wsRoot/dendronrc.yml and homeDir/dendronrc.yml
        const initialConfig = ConfigUtils.genDefaultConfig();
        const globalOverridePayload = {
          workspace: {
            vaults: [
              {
                fsPath: "foo",
                name: "foo",
              },
            ],
          },
        };
        const workspaceOverridePayload = {
          workspace: {
            vaults: [
              {
                fsPath: "bar",
                name: "bar",
              },
            ],
          },
        };

        writeYAML(
          path.join(homeDir, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
          globalOverridePayload
        );
        writeYAML(
          path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
          workspaceOverridePayload
        );

        const vaultExcludedInitialConfig = {
          ...initialConfig,
          workspace: _.omit(initialConfig.workspace, "vaults"),
        } as DeepPartial<DendronConfig>;

        const configPath = path.join(wsRoot, "dendron.yml");
        ensureFileSync(configPath);
        writeYAML(configPath, vaultExcludedInitialConfig);

        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        // readRaw returns config with no vaults
        const readRawResult = await configStore.readRaw();
        expect(
          readRawResult.isOk() &&
            readRawResult._unsafeUnwrap().workspace?.vaults === undefined
        ).toBeTruthy();

        // read with override from workspace override if both exists
        const readOverrideResult1 = await configStore.read({
          mode: "override",
        });
        expect(readOverrideResult1.isOk()).toBeTruthy();
        const overrideConfig1 = readOverrideResult1._unsafeUnwrap();
        expect(overrideConfig1.workspace.vaults).toEqual([
          {
            fsPath: "bar",
            name: "bar",
          },
        ]);

        // read with override from home directory if not found in workspace
        unlinkSync(path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE));
        const readOverrideResult2 = await configStore.read({
          mode: "override",
        });
        expect(readOverrideResult2.isOk()).toBeTruthy();
        const overrideConfig2 = readOverrideResult2._unsafeUnwrap();
        expect(overrideConfig2.workspace.vaults).toEqual([
          {
            fsPath: "foo",
            name: "foo",
          },
        ]);
      });
    });

    describe("AND write", () => {
      test("WHEN no override exists, then write given config and persist", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;
        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        await configStore.create();

        const defaultConfig = ConfigUtils.genDefaultConfig();
        const diff: LookupConfig = {
          note: {
            ...defaultConfig.commands.lookup.note,
            selectionMode: "link",
            fuzzThreshold: 1,
          },
        };
        const writePayload: DendronConfig = {
          ...defaultConfig,
          commands: {
            ...defaultConfig.commands,
            lookup: diff,
          },
        };

        // make sure we start with a default config
        const readResult = await configStore.read({ mode: "default" });
        expect(
          readResult.isOk() && readResult._unsafeUnwrap() === defaultConfig
        );

        // write result contains payload
        const writeResult = await configStore.write(writePayload);
        expect(writeResult.isOk()).toBeTruthy();
        expect(writeResult._unsafeUnwrap().commands.lookup).toEqual(diff);

        // read again and verify
        const readResult2 = await configStore.read({ mode: "default" });
        expect(
          readResult2.isOk() &&
            readResult2._unsafeUnwrap().commands.lookup === diff
        );
      });

      test("WHEN override exists, then filter out override vaults before writing", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;

        // move some configs to wsRoot/dendronrc.yml
        const initialConfig = ConfigUtils.genDefaultConfig();
        const workspaceOverridePayload = {
          workspace: {
            vaults: [
              {
                fsPath: "bar",
                name: "bar",
              },
            ],
          },
        };

        writeYAML(
          path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
          workspaceOverridePayload
        );

        const vaultExcludedInitialConfig = {
          ...initialConfig,
          workspace: {
            ...initialConfig.workspace,
            vaults: [
              {
                fsPath: "foo",
                name: "foo",
              },
            ],
          },
        } as DeepPartial<DendronConfig>;

        const configPath = path.join(wsRoot, "dendron.yml");
        ensureFileSync(configPath);
        writeYAML(configPath, vaultExcludedInitialConfig);

        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        // read in config with override
        const configWithOverride = (
          await configStore.read({ mode: "override" })
        )._unsafeUnwrap();

        // change some things
        ConfigUtils.setCommandsProp(configWithOverride, "lookup", {
          note: {
            ...configWithOverride.commands.lookup.note,
            selectionMode: "none",
          },
        });

        // write, and make sure the changes are there,
        await configStore.write(configWithOverride);

        const postWriteReadResult = await configStore.readRaw();
        expect(postWriteReadResult.isOk()).toBeTruthy();
        expect(
          postWriteReadResult._unsafeUnwrap().commands?.lookup?.note
            ?.selectionMode
        ).toEqual("none");

        // and override is filtered out
        expect(postWriteReadResult._unsafeUnwrap().workspace?.vaults).toEqual([
          {
            fsPath: "foo",
            name: "foo",
          },
        ]);
      });
    });

    describe("AND get", () => {
      test("WHEN default mode, then retrieve value of config", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;
        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        const createResult = await configStore.create();

        const defaultConfig = createResult._unsafeUnwrap();

        const getResult = await configStore.get("commands", {
          mode: "default",
        });
        expect(getResult.isOk()).toBeTruthy();
        expect(getResult._unsafeUnwrap()).toEqual(defaultConfig.commands);
      });

      test("WHEN useCache, then retrieve value from cached config", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;
        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        await configStore.create();

        const getResult = await configStore.get("commands", {
          mode: "default",
        });

        unlinkSync(configStore.path.fsPath);

        const cachedGetResult = await configStore.get("commands", {
          mode: "default",
        });

        expect(
          cachedGetResult.isOk() &&
            cachedGetResult._unsafeUnwrap() === getResult._unsafeUnwrap()
        );
      });

      test("WHEN override mode, then retrieve value of config after override", async () => {
        const homeDir = tmpDir().name;
        const wsRoot = tmpDir().name;
        const configStore = new ConfigStore(
          fileStore,
          URI.parse(wsRoot),
          URI.parse(homeDir)
        );

        await configStore.create();

        const workspaceOverridePayload = {
          workspace: {
            vaults: [
              {
                fsPath: "bar",
                name: "bar",
              },
            ],
          },
        };

        writeYAML(
          path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
          workspaceOverridePayload
        );

        const getResult = await configStore.get("workspace.vaults", {
          mode: "override",
        });

        expect(getResult.isOk()).toBeTruthy();
        expect(getResult._unsafeUnwrap()).toEqual([
          {
            fsPath: "bar",
            name: "bar",
          },
        ]);
      });
    });

    test("WHEN update, update key with value, then persist change", async () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;
      const configStore = new ConfigStore(
        fileStore,
        URI.parse(wsRoot),
        URI.parse(homeDir)
      );

      await configStore.create();

      const updateResult = await configStore.update(
        "commands.lookup.note.fuzzThreshold",
        100
      );
      expect(updateResult.isOk()).toBeTruthy();
      expect(updateResult._unsafeUnwrap()).toEqual(0.2);

      const readResult = await configStore.readRaw();
      expect(
        readResult._unsafeUnwrap().commands?.lookup?.note?.fuzzThreshold
      ).toEqual(100);
    });

    test("WHEN delete, delete key, then persist/cache", async () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;
      const configStore = new ConfigStore(
        fileStore,
        URI.parse(wsRoot),
        URI.parse(homeDir)
      );

      await configStore.create();

      const deleteResult = await configStore.delete(
        "commands.lookup.note.fuzzThreshold"
      );
      expect(deleteResult.isOk()).toBeTruthy();
      expect(deleteResult._unsafeUnwrap()).toEqual(0.2);

      const readResult = await configStore.readRaw();
      expect(
        readResult._unsafeUnwrap().commands?.lookup?.note?.fuzzThreshold
      ).toBeUndefined();
    });
  });
});
