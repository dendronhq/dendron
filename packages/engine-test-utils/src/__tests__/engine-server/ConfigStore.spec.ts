import {
  ConfigStore,
  ConfigUtils,
  CONSTANTS,
  DeepPartial,
  DendronConfig,
  IFileStore,
  URI,
} from "@dendronhq/common-all";
import { tmpDir, writeYAML } from "@dendronhq/common-server";
import { NodeJSFileStore } from "@dendronhq/engine-server";
import { existsSync, ensureFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";
import * as YAML from "js-yaml";

describe("ConfigStore", () => {
  let fileStore: IFileStore;
  describe("GIVEN NodeJSFileStore", () => {
    fileStore = new NodeJSFileStore();
    test("WHEN createConfig, then create new config and persist", async () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;
      const configStore = new ConfigStore(fileStore, URI.file(homeDir));

      const createResult = await configStore.createConfig(URI.file(wsRoot));
      if (createResult.isErr()) {
        throw createResult.error;
      }
      expect(createResult.isOk()).toBeTruthy();
      const config = createResult._unsafeUnwrap();
      expect(config).toMatchSnapshot();
      const isConfigPersisted = existsSync(
        path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE)
      );
      expect(isConfigPersisted).toBeTruthy();
    });

    test("WHEN readConfig, then read config as-is", async () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;

      // remove some configs initially
      let initialConfig: DeepPartial<DendronConfig> =
        ConfigUtils.genDefaultConfig();
      initialConfig = {
        ...initialConfig,
        preview: {},
      };

      const configPath = path.join(wsRoot, "dendron.yml");
      ensureFileSync(configPath);
      writeYAML(configPath, initialConfig);

      const configStore = new ConfigStore(fileStore, URI.file(homeDir));

      const readConfigResult = await configStore.readConfig(URI.file(wsRoot));
      if (readConfigResult.isErr()) {
        throw readConfigResult.error;
      }
      expect(readConfigResult.isOk()).toBeTruthy();
      const config = readConfigResult._unsafeUnwrap();
      expect(config).toEqual(initialConfig);
    });

    describe("WHEN readOverride", () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;
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
      test("AND workspace mode, then read override from workspace root", async () => {
        const configStore = new ConfigStore(fileStore, URI.file(homeDir));

        const readOverrideResult = await configStore.readOverride(
          URI.file(wsRoot),
          "workspace"
        );
        expect(readOverrideResult.isOk()).toBeTruthy();
        expect(readOverrideResult._unsafeUnwrap()).toEqual(
          YAML.dump(workspaceOverridePayload, {
            indent: 4,
            schema: YAML.JSON_SCHEMA,
          })
        );
      });
      test("AND global mode, then read override from homeDir", async () => {
        const configStore = new ConfigStore(fileStore, URI.file(homeDir));

        const readOverrideResult = await configStore.readOverride(
          URI.file(wsRoot),
          "global"
        );
        expect(readOverrideResult.isOk()).toBeTruthy();
        expect(readOverrideResult._unsafeUnwrap()).toEqual(
          YAML.dump(globalOverridePayload, {
            indent: 4,
            schema: YAML.JSON_SCHEMA,
          })
        );
      });
    });

    test("WHEN writeConfig, then write given config and persist", async () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;
      const configStore = new ConfigStore(fileStore, URI.file(homeDir));

      const defaultConfig = ConfigUtils.genDefaultConfig();
      const payload: DendronConfig = {
        ...defaultConfig,
        commands: {
          ...defaultConfig.commands,
          lookup: {
            note: {
              ...defaultConfig.commands.lookup.note,
              leaveTrace: true,
            },
          },
        },
      };

      const writeResult = await configStore.writeConfig(
        URI.file(wsRoot),
        payload
      );
      expect(writeResult.isOk()).toBeTruthy();
      const config = writeResult._unsafeUnwrap();
      expect(config).toMatchSnapshot();
      expect(config.commands.lookup.note.leaveTrace).toEqual(true);
      expect(_.omit(config, "commands.lookup.note.leaveTrace")).toEqual(
        _.omit(defaultConfig, "commands.lookup.note.leaveTrace")
      );
      const isConfigPersisted = existsSync(
        path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE)
      );
      expect(isConfigPersisted).toBeTruthy();
    });
  });
});
