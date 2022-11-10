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
import { existsSync } from "fs";
import { ensureFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";

describe("ConfigStore", () => {
  let fileStore: IFileStore;
  describe("GIVEN NodeJSFileStore", () => {
    fileStore = new NodeJSFileStore();
    test("WHEN createConfig, then create new config and persist", async () => {
      const homeDir = tmpDir().name;
      const wsRoot = tmpDir().name;
      const configStore = new ConfigStore(
        fileStore,
        URI.file(wsRoot),
        URI.file(homeDir)
      );

      const createResult = await configStore.createConfig();
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

      const configStore = new ConfigStore(
        fileStore,
        URI.file(wsRoot),
        URI.file(homeDir)
      );

      const readConfigResult = await configStore.readConfig();
      if (readConfigResult.isErr()) {
        throw readConfigResult.error;
      }
      expect(readConfigResult.isOk()).toBeTruthy();
      const config = readConfigResult._unsafeUnwrap();
      expect(config).toEqual(initialConfig);
    });

    describe("AND partial DendronConfig", () => {
      test("WHEN readRaw, then retrieve config as is", async () => {});

      // test("WHEN read with default, then retrieve config with missing defaults filled", async () => {
      //   const homeDir = tmpDir().name;
      //   const wsRoot = tmpDir().name;

      //   // remove some configs initially
      //   let initialConfig: DeepPartial<DendronConfig> =
      //     ConfigUtils.genDefaultConfig();
      //   initialConfig = {
      //     ...initialConfig,
      //     preview: {},
      //   };

      //   const configPath = path.join(wsRoot, "dendron.yml");
      //   ensureFileSync(configPath);
      //   writeYAML(configPath, initialConfig);

      //   const configStore = new ConfigStore(
      //     fileStore,
      //     URI.file(wsRoot),
      //     URI.file(homeDir)
      //   );

      //   const readWithDefaultResult = await configStore.read();

      //   if (readWithDefaultResult.isErr()) {
      //     throw readWithDefaultResult.error;
      //   }
      //   expect(readWithDefaultResult.isOk()).toBeTruthy();
      //   const config = readWithDefaultResult._unsafeUnwrap();
      //   expect(config).toEqual(ConfigUtils.genDefaultConfig());
      // });

      // test("WHEN read with override, then retrieve config with override applied", async () => {
      //   const homeDir = tmpDir().name;
      //   const wsRoot = tmpDir().name;

      //   // move some configs to wsRoot/dendronrc.yml and homeDir/dendronrc.yml
      //   const initialConfig = ConfigUtils.genDefaultConfig();
      //   const globalOverridePayload = {
      //     workspace: {
      //       vaults: [
      //         {
      //           fsPath: "foo",
      //           name: "foo",
      //         },
      //       ],
      //     },
      //   };
      //   const workspaceOverridePayload = {
      //     workspace: {
      //       vaults: [
      //         {
      //           fsPath: "bar",
      //           name: "bar",
      //         },
      //       ],
      //     },
      //   };

      //   writeYAML(
      //     path.join(homeDir, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
      //     globalOverridePayload
      //   );
      //   writeYAML(
      //     path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
      //     workspaceOverridePayload
      //   );

      //   const vaultExcludedInitialConfig = {
      //     ...initialConfig,
      //     workspace: _.omit(initialConfig.workspace, "vaults"),
      //   } as DeepPartial<DendronConfig>;

      //   const configPath = path.join(wsRoot, "dendron.yml");
      //   ensureFileSync(configPath);
      //   writeYAML(configPath, vaultExcludedInitialConfig);

      //   const configStore = new ConfigStore(
      //     fileStore,
      //     URI.file(wsRoot),
      //     URI.file(homeDir)
      //   );

      //   // readRaw returns config with no vaults
      //   const readRawResult = await configStore.readRaw();
      //   if (readRawResult.isErr()) {
      //     throw readRawResult.error;
      //   }
      //   expect(
      //     readRawResult.isOk() &&
      //       readRawResult._unsafeUnwrap().workspace?.vaults === undefined
      //   ).toBeTruthy();

      //   // read with override from workspace override if both exists
      //   const readOverrideResult1 = await configStore.read({
      //     applyOverride: true,
      //   });
      //   if (readOverrideResult1.isErr()) {
      //     throw readOverrideResult1.error;
      //   }
      //   expect(readOverrideResult1.isOk()).toBeTruthy();
      //   const overrideConfig1 = readOverrideResult1._unsafeUnwrap();
      //   expect(overrideConfig1.workspace.vaults).toEqual([
      //     {
      //       fsPath: "bar",
      //       name: "bar",
      //     },
      //   ]);

      //   // read with override from home directory if not found in workspace
      //   unlinkSync(path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE));
      //   const readOverrideResult2 = await configStore.read({
      //     applyOverride: true,
      //   });
      //   if (readOverrideResult2.isErr()) {
      //     throw readOverrideResult2.error;
      //   }
      //   expect(readOverrideResult2.isOk()).toBeTruthy();
      //   const overrideConfig2 = readOverrideResult2._unsafeUnwrap();
      //   expect(overrideConfig2.workspace.vaults).toEqual([
      //     {
      //       fsPath: "foo",
      //       name: "foo",
      //     },
      //   ]);
      // });
    });

    describe("AND write", () => {
      // test("WHEN no override exists, then write given config and persist", async () => {
      //   const homeDir = tmpDir().name;
      //   const wsRoot = tmpDir().name;
      //   const configStore = new ConfigStore(
      //     fileStore,
      //     URI.file(wsRoot),
      //     URI.file(homeDir)
      //   );
      //   await configStore.createConfig();
      //   const defaultConfig = ConfigUtils.genDefaultConfig();
      //   const diff: LookupConfig = {
      //     note: {
      //       ...defaultConfig.commands.lookup.note,
      //       selectionMode: "link",
      //       fuzzThreshold: 1,
      //     },
      //   };
      //   const writePayload: DendronConfig = {
      //     ...defaultConfig,
      //     commands: {
      //       ...defaultConfig.commands,
      //       lookup: diff,
      //     },
      //   };
      //   // make sure we start with a default config
      //   const readResult = await configStore.read();
      //   if (readResult.isErr()) {
      //     throw readResult.error;
      //   }
      //   expect(
      //     readResult.isOk() && readResult._unsafeUnwrap() === defaultConfig
      //   );
      //   // write result contains payload
      //   const writeResult = await configStore.write(writePayload);
      //   if (writeResult.isErr()) {
      //     throw writeResult.error;
      //   }
      //   expect(writeResult.isOk()).toBeTruthy();
      //   expect(writeResult._unsafeUnwrap().commands.lookup).toEqual(diff);
      //   // read again and verify
      //   const readResult2 = await configStore.read();
      //   if (readResult2.isErr()) {
      //     throw readResult2.error;
      //   }
      //   expect(
      //     readResult2.isOk() &&
      //       readResult2._unsafeUnwrap().commands.lookup === diff
      //   );
      // });
      // todo: move to config service tests
      //   test("WHEN override exists, then filter out override vaults before writing", async () => {
      //     const homeDir = tmpDir().name;
      //     const wsRoot = tmpDir().name;
      //     // move some configs to wsRoot/dendronrc.yml
      //     const initialConfig = ConfigUtils.genDefaultConfig();
      //     const workspaceOverridePayload = {
      //       workspace: {
      //         vaults: [
      //           {
      //             fsPath: "bar",
      //             name: "bar",
      //           },
      //         ],
      //       },
      //     };
      //     writeYAML(
      //       path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
      //       workspaceOverridePayload
      //     );
      //     const vaultExcludedInitialConfig = {
      //       ...initialConfig,
      //       workspace: {
      //         ...initialConfig.workspace,
      //         vaults: [
      //           {
      //             fsPath: "foo",
      //             name: "foo",
      //           },
      //         ],
      //       },
      //     } as DeepPartial<DendronConfig>;
      //     const configPath = path.join(wsRoot, "dendron.yml");
      //     ensureFileSync(configPath);
      //     writeYAML(configPath, vaultExcludedInitialConfig);
      //     const configStore = new ConfigStore(
      //       fileStore,
      //       URI.file(wsRoot),
      //       URI.file(homeDir)
      //     );
      //     // read in config with override
      //     const configWithOverride = (
      //       await configStore.read({ applyOverride: true })
      //     )._unsafeUnwrap();
      //     // change some things
      //     ConfigUtils.setCommandsProp(configWithOverride, "lookup", {
      //       note: {
      //         ...configWithOverride.commands.lookup.note,
      //         selectionMode: "none",
      //       },
      //     });
      //     // write, and make sure the changes are there,
      //     await configStore.write(configWithOverride);
      //     const postWriteReadResult = await configStore.readRaw();
      //     if (postWriteReadResult.isErr()) {
      //       throw postWriteReadResult.error;
      //     }
      //     expect(postWriteReadResult.isOk()).toBeTruthy();
      //     expect(
      //       postWriteReadResult._unsafeUnwrap().commands?.lookup?.note
      //         ?.selectionMode
      //     ).toEqual("none");
      //     // and override is filtered out
      //     expect(postWriteReadResult._unsafeUnwrap().workspace?.vaults).toEqual([
      //       {
      //         fsPath: "foo",
      //         name: "foo",
      //       },
      //     ]);
      //   });
    });

    describe("AND get", () => {
      // test("WHEN default mode, then retrieve value of config", async () => {
      //   const homeDir = tmpDir().name;
      //   const wsRoot = tmpDir().name;
      //   const configStore = new ConfigStore(
      //     fileStore,
      //     URI.file(wsRoot),
      //     URI.file(homeDir)
      //   );
      //   const createResult = await configStore.createConfig();
      //   const defaultConfig = createResult._unsafeUnwrap();
      //   const getResult = await configStore.get("commands");
      //   if (getResult.isErr()) {
      //     throw getResult.error;
      //   }
      //   expect(getResult.isOk()).toBeTruthy();
      //   expect(getResult._unsafeUnwrap()).toEqual(defaultConfig.commands);
      // });
      // test("WHEN override mode, then retrieve value of config after override", async () => {
      //   const homeDir = tmpDir().name;
      //   const wsRoot = tmpDir().name;
      //   const configStore = new ConfigStore(
      //     fileStore,
      //     URI.file(wsRoot),
      //     URI.file(homeDir)
      //   );
      //   await configStore.createConfig();
      //   const workspaceOverridePayload = {
      //     workspace: {
      //       vaults: [
      //         {
      //           fsPath: "bar",
      //           name: "bar",
      //         },
      //       ],
      //     },
      //   };
      //   writeYAML(
      //     path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE),
      //     workspaceOverridePayload
      //   );
      //   const getResult = await configStore.get("workspace.vaults", {
      //     applyOverride: true,
      //   });
      //   if (getResult.isErr()) {
      //     throw getResult.error;
      //   }
      //   expect(getResult.isOk()).toBeTruthy();
      //   expect(getResult._unsafeUnwrap()).toEqual([
      //     {
      //       fsPath: "bar",
      //       name: "bar",
      //     },
      //   ]);
      // });
    });

    // test("WHEN update, update key with value, then persist change", async () => {
    //   const homeDir = tmpDir().name;
    //   const wsRoot = tmpDir().name;
    //   const configStore = new ConfigStore(
    //     fileStore,
    //     URI.file(wsRoot),
    //     URI.file(homeDir)
    //   );

    //   await configStore.createConfig();

    //   const updateResult = await configStore.update(
    //     "commands.lookup.note.fuzzThreshold",
    //     100
    //   );

    //   if (updateResult.isErr()) {
    //     throw updateResult.error;
    //   }
    //   expect(updateResult.isOk()).toBeTruthy();
    //   expect(updateResult._unsafeUnwrap()).toEqual(0.2);

    //   const readResult = await configStore.readRaw();
    //   expect(
    //     readResult._unsafeUnwrap().commands?.lookup?.note?.fuzzThreshold
    //   ).toEqual(100);
    // });

    // test("WHEN delete, delete key, then persist", async () => {
    //   const homeDir = tmpDir().name;
    //   const wsRoot = tmpDir().name;
    //   const configStore = new ConfigStore(
    //     fileStore,
    //     URI.file(wsRoot),
    //     URI.file(homeDir)
    //   );

    //   await configStore.createConfig();

    //   const deleteResult = await configStore.delete(
    //     "commands.lookup.note.fuzzThreshold"
    //   );

    //   if (deleteResult.isErr()) {
    //     throw deleteResult.error;
    //   }
    //   expect(deleteResult.isOk()).toBeTruthy();
    //   expect(deleteResult._unsafeUnwrap()).toEqual(0.2);

    //   const readResult = await configStore.readRaw();
    //   expect(
    //     readResult._unsafeUnwrap().commands?.lookup?.note?.fuzzThreshold
    //   ).toBeUndefined();
    // });
  });
});
