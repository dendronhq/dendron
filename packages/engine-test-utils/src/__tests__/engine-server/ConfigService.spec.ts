import {
  ConfigService,
  ConfigUtils,
  CONSTANTS,
  DeepPartial,
  DendronConfig,
  DendronError,
  URI,
} from "@dendronhq/common-all";
import { tmpDir, writeYAML } from "@dendronhq/common-server";
import { NodeJSFileStore } from "@dendronhq/engine-server";
import { existsSync, ensureFileSync, unlinkSync } from "fs-extra";
import _ from "lodash";
import path from "path";

const writeGlobalOverride = (homeDir: string) => {
  writeOverride(homeDir, {
    workspace: {
      vaults: [
        {
          fsPath: "foo",
          name: "foo",
        },
      ],
    },
  });
};

const writeWorkspaceOverride = (wsRoot: string) => {
  writeOverride(wsRoot, {
    workspace: {
      vaults: [
        {
          fsPath: "bar",
          name: "bar",
        },
      ],
    },
  });
};

const writeOverride = (oPath: string, payload: DeepPartial<DendronConfig>) => {
  writeYAML(path.join(oPath, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE), payload);
};

const deleteOverride = (oPath: string) => {
  unlinkSync(path.join(oPath, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE));
};

describe("GIVEN ConfigService", () => {
  describe("WHEN instance never created", () => {
    test("THEN a bare .instance() call throws", async () => {
      let cs: ConfigService | undefined;
      try {
        ConfigService.instance();
      } catch (error: any) {
        expect((error as unknown as DendronError).message).toEqual(
          "Unable to retrieve or create config service instance."
        );
      }
      expect(cs).toEqual(undefined);
    });
    test("THEN .instance() call creates and returns created instance", async () => {
      const homeDir = tmpDir().name;
      const cs = ConfigService.instance({
        homeDir: URI.file(homeDir),
        fileStore: new NodeJSFileStore(),
      });
      expect(cs).toBeTruthy();
      ConfigService._singleton = undefined;
    });
  });

  describe("WHEN instance already exists", () => {
    let wsRoot: string;
    let homeDir: string;
    let instance: ConfigService;
    beforeAll(() => {
      wsRoot = tmpDir().name;
      homeDir = tmpDir().name;
      instance = ConfigService.instance({
        homeDir: URI.file(homeDir),
        fileStore: new NodeJSFileStore(),
      });
    });
    describe("WHEN configPath", () => {
      test("THEN correct path of dendron.yml is returned", async () => {
        expect(instance.configPath(URI.file(wsRoot))).toEqual(
          URI.file(path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE))
        );
      });
    });

    describe("WHEN createConfig is called", () => {
      test("THEN new config is created", async () => {
        const createResult = await instance.createConfig(URI.file(wsRoot));
        expect(createResult.isOk()).toBeTruthy();
        expect(createResult._unsafeUnwrap()).toMatchSnapshot();
        expect(
          existsSync(path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE))
        ).toBeTruthy();
      });
    });

    describe("WHEN readRaw is called", () => {
      test("THEN config in fs is returned as-is", async () => {
        let initialConfig: DeepPartial<DendronConfig> =
          ConfigUtils.genDefaultConfig();
        initialConfig = {
          ...initialConfig,
          preview: {},
        };

        const configPath = path.join(wsRoot, "dendron.yml");
        ensureFileSync(configPath);
        writeYAML(configPath, initialConfig);

        const readRawResult = await instance.readRaw(URI.file(wsRoot));
        expect(readRawResult.isOk()).toBeTruthy();
        expect(readRawResult._unsafeUnwrap()).toEqual(initialConfig);
      });
    });

    describe("WHEN readConfig", () => {
      describe("AND applyOverride", () => {
        describe("AND override exists", () => {
          test("THEN read config, apply defaults, and merged with override", async () => {
            writeWorkspaceOverride(wsRoot);
            writeGlobalOverride(homeDir);

            const readResult1 = await instance.readConfig(URI.file(wsRoot), {
              applyOverride: true,
            });
            expect(readResult1.isOk()).toBeTruthy();
            expect(
              readResult1._unsafeUnwrap().workspace.vaults[0].fsPath
            ).toEqual("bar");

            deleteOverride(wsRoot);

            const readResult2 = await instance.readConfig(URI.file(wsRoot), {
              applyOverride: true,
            });
            expect(readResult2.isOk()).toBeTruthy();
            expect(
              readResult2._unsafeUnwrap().workspace.vaults[0].fsPath
            ).toEqual("foo");

            deleteOverride(homeDir);
          });
        });
        describe("AND override does not exist", () => {
          test("THEN read config, apply defaults", async () => {
            const readResult = await instance.readConfig(URI.file(wsRoot), {
              applyOverride: true,
            });
            expect(readResult.isOk()).toBeTruthy();
            expect(readResult._unsafeUnwrap().workspace.vaults).toEqual([]);
          });
        });
      });
      describe("AND not applyOverride", () => {
        test("THEN read config, apply defaults", async () => {
          const readResult = await instance.readConfig(URI.file(wsRoot), {
            applyOverride: false,
          });
          expect(readResult.isOk()).toBeTruthy();
          expect(readResult._unsafeUnwrap().workspace.vaults).toEqual([]);
        });
      });
    });

    describe("WHEN writeConfig", () => {
      describe("AND override exists", () => {
        beforeAll(() => {
          writeGlobalOverride(homeDir);
        });
        afterAll(() => {
          deleteOverride(homeDir);
        });
        describe("AND payload contains content from override", () => {
          test("THEN difference of payload and override is written", async () => {
            const readResult = await instance.readConfig(URI.file(wsRoot), {
              applyOverride: true,
            });
            const configWithOverride = readResult._unsafeUnwrap();

            configWithOverride.commands.lookup.note.leaveTrace = true;

            const writeResult = await instance.writeConfig(
              URI.file(wsRoot),
              configWithOverride
            );

            expect(writeResult.isOk()).toBeTruthy();
            expect(
              writeResult._unsafeUnwrap().commands.lookup.note.leaveTrace
            ).toEqual(true);
            expect(writeResult._unsafeUnwrap().workspace.vaults).toEqual([]);
          });
        });
        describe("AND payload does not contain content from override", () => {
          test("THEN payload is written", async () => {
            const readResult = await instance.readConfig(URI.file(wsRoot), {
              applyOverride: false,
            });
            const config = readResult._unsafeUnwrap();

            config.commands.lookup.note.leaveTrace = false;

            const writeResult = await instance.writeConfig(
              URI.file(wsRoot),
              config
            );

            expect(writeResult.isOk()).toBeTruthy();
            expect(
              writeResult._unsafeUnwrap().commands.lookup.note.leaveTrace
            ).toEqual(false);
            expect(writeResult._unsafeUnwrap().workspace.vaults).toEqual([]);
          });
        });
      });
      describe("AND override does not exist", () => {
        test("THEN payload is written", async () => {
          const readResult = await instance.readConfig(URI.file(wsRoot), {
            applyOverride: false,
          });
          const config = readResult._unsafeUnwrap();

          config.commands.lookup.note.leaveTrace = true;

          const writeResult = await instance.writeConfig(
            URI.file(wsRoot),
            config
          );

          expect(writeResult.isOk()).toBeTruthy();
          expect(
            writeResult._unsafeUnwrap().commands.lookup.note.leaveTrace
          ).toEqual(true);
          expect(writeResult._unsafeUnwrap().workspace.vaults).toEqual([]);
        });
      });
    });

    describe("WHEN getConfig", () => {
      describe("AND applyOverride", () => {
        describe("AND override exists", () => {
          test("THEN get value of key after merging config with override", async () => {
            writeGlobalOverride(homeDir);
            const getResult = await instance.getConfig(
              URI.file(wsRoot),
              "workspace.vaults",
              {
                applyOverride: true,
              }
            );
            expect(getResult.isOk()).toBeTruthy();
            expect(getResult._unsafeUnwrap()[0].fsPath).toEqual("foo");
            deleteOverride(homeDir);
          });
        });
        describe("AND override does not exist", () => {
          test("THEN get value of key from config after applying defaults", async () => {
            const getResult = await instance.getConfig(
              URI.file(wsRoot),
              "workspace.vaults",
              {
                applyOverride: true,
              }
            );
            expect(getResult.isOk()).toBeTruthy();
            expect(getResult._unsafeUnwrap()).toEqual([]);
          });
        });
      });
      describe("AND not applyOverride", () => {
        test("THEN get value of key from config", async () => {
          writeGlobalOverride(homeDir);
          const getResult = await instance.getConfig(
            URI.file(wsRoot),
            "workspace.vaults",
            {
              applyOverride: false,
            }
          );
          expect(getResult.isOk()).toBeTruthy();
          expect(getResult._unsafeUnwrap()).toEqual([]);
          deleteOverride(homeDir);
        });
      });
    });

    describe("WHEN updateConfig", () => {
      test("THEN update key with value", async () => {
        const updateResult = await instance.updateConfig(
          URI.file(wsRoot),
          "commands.lookup.note.leaveTrace",
          false
        );

        expect(updateResult.isOk()).toBeTruthy();
        expect(updateResult._unsafeUnwrap()).toEqual(true);
      });
    });

    describe("WHEN deleteConfig", () => {
      describe("AND value exists for key", () => {
        test("THEN unset key", async () => {
          const deleteResult = await instance.deleteConfig(
            URI.file(wsRoot),
            "commands.lookup.note.leaveTrace"
          );
          expect(deleteResult.isOk()).toBeTruthy();
          expect(deleteResult._unsafeUnwrap()).toEqual(false);
          const postDeleteRaw = (
            await instance.readRaw(URI.file(wsRoot))
          )._unsafeUnwrap();
          expect(
            postDeleteRaw.commands?.lookup?.note?.leaveTrace
          ).toBeUndefined();
        });
      });
      describe("AND value does not exist", () => {
        test("THEN return error", async () => {
          const deleteResult = await instance.deleteConfig(
            URI.file(wsRoot),
            "foo"
          );
          expect(deleteResult.isErr()).toBeTruthy();
        });
      });
    });
  });
});
