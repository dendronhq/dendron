import {
  ConfigUtils,
  DendronPublishingConfig,
  DEngineClient,
  DVault,
  DVaultVisibility,
  PublishUtils,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { NextjsExportConfig, NextjsExportPod } from "@dendronhq/pods-core";
import path from "path";
import { TestConfigUtils } from "../../config";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../presets";
import {
  checkDir,
  checkFile,
  checkNotInDir,
  TestUnifiedUtils,
} from "../../utils";
import fs from "fs-extra";
import _ from "lodash";

async function setupExport(
  opts: WorkspaceOpts & {
    engine: DEngineClient;
    podConfig?: Partial<NextjsExportConfig>;
  }
) {
  const { wsRoot, vaults, engine, podConfig } = opts;
  const dest = tmpDir().name;
  const pod = new NextjsExportPod();
  await pod.execute({
    engine,
    vaults,
    wsRoot,
    config: {
      dest,
      ...podConfig,
    },
  });
  return dest;
}

async function verifyExport(dest: string) {
  await checkDir({ fpath: dest }, "data", "public");
  await checkDir(
    { fpath: path.join(dest, "data") },
    "dendron.json",
    "meta",
    "notes",
    "notes.json",
    "tree.json"
  );
}

async function verifyExportedAssets(dest: string) {
  await checkDir({ fpath: path.join(dest, "public", "assets") }, "foo.jpg");
}

async function verifyNoExportedAssets(dest: string) {
  await checkNotInDir({ fpath: path.join(dest, "public") }, "assets");
}

async function createAssetsInVault({
  wsRoot,
  vault,
}: {
  wsRoot: string;
  vault: DVault;
}) {
  const vaultDir = path.join(wsRoot, VaultUtils.getRelPath(vault));
  const assetsDir = path.join(vaultDir, "assets");
  await fs.ensureDir(assetsDir);
  await fs.ensureFile(path.join(assetsDir, "foo.jpg"));
}

const setupConfig = ({
  wsRoot,
  siteConfig,
}: {
  wsRoot: string;
  siteConfig?: Partial<DendronPublishingConfig>;
}) => {
  TestConfigUtils.withConfig(
    (config) => {
      ConfigUtils.setPublishProp(config, "siteUrl", "https://foo.com");
      const mergedPublishingConfig = _.merge(
        config.publishing,
        siteConfig
      ) as DendronPublishingConfig;
      ConfigUtils.overridePublishingConfig(config, mergedPublishingConfig);
      return config;
    },
    { wsRoot }
  );
};

describe("GIVEN NextExport pod", () => {
  describe("WHEN copyAssets", () => {
    describe("AND WHEN assets exist", () => {
      test("THEN assets are copied", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            const dest = await setupExport({ engine, wsRoot, vaults });
            await verifyExport(dest);
            await verifyExportedAssets(dest);
            await checkDir(
              { fpath: path.join(dest, "data", "notes") },
              "foo.md",
              "foo.html"
            );
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              await createAssetsInVault({
                wsRoot: opts.wsRoot,
                vault: opts.vaults[0],
              });
              setupConfig({
                ...opts,
                siteConfig: {
                  copyAssets: true,
                },
              });
            },
          }
        );
      });
    });
    describe("WHEN copy assets is skipped", () => {
      test("THEN no assets are copied over", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            const dest = await setupExport({ engine, wsRoot, vaults });
            await verifyExport(dest);
            await verifyNoExportedAssets(dest);
            await checkDir(
              { fpath: path.join(dest, "data", "notes") },
              "foo.md",
              "foo.html"
            );
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              await createAssetsInVault({
                wsRoot: opts.wsRoot,
                vault: opts.vaults[0],
              });
              setupConfig({
                ...opts,
                siteConfig: {
                  copyAssets: false,
                },
              });
            },
          }
        );
      });
    });
  });

  describe("WHEN copy siteBanner", () => {
    async function createBannerInVault({
      wsRoot,
    }: {
      wsRoot: string;
      vault: DVault;
    }) {
      const bannerPath =
        PublishUtils.getCustomSiteBannerPathFromWorkspace(wsRoot);
      await fs.ensureFile(bannerPath);
      await fs.writeFile(
        bannerPath,
        "export default function Banner { return <div> Banner </div> };"
      );
    }

    async function verifyExportedBanner(dest: string) {
      checkFile(
        {
          fpath: PublishUtils.getCustomSiteBannerPathToPublish(dest),
          snapshot: true,
        },
        "Banner"
      );
    }

    describe("AND WHEN siteBanner exist", () => {
      test("THEN banner is copied", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            const dest = await setupExport({ engine, wsRoot, vaults });
            await verifyExport(dest);
            await verifyExportedBanner(dest);
            await checkDir(
              { fpath: path.join(dest, "data", "notes") },
              "foo.md",
              "foo.html"
            );
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              await createBannerInVault({
                wsRoot: opts.wsRoot,
                vault: opts.vaults[0],
              });
              setupConfig({
                ...opts,
                siteConfig: {
                  siteBanner: "custom",
                },
              });
            },
          }
        );
      });
    });
    describe("WHEN site banner does not exist", () => {
      test("THEN throw error", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            await expect(
              setupExport({ engine, wsRoot, vaults })
            ).rejects.toThrowError();
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              setupConfig({
                ...opts,
                siteConfig: {
                  siteBanner: "custom",
                },
              });
            },
          }
        );
      });
    });
  });

  describe("WHEN logoPath is set", () => {
    describe("AND the logo file exists", () => {
      test("THEN logo is copied over", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            const dest = await setupExport({ engine, wsRoot, vaults });
            await verifyExport(dest);
            await checkDir(
              { fpath: path.join(dest, "public", "assets") },
              "logo.png"
            );
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              const logoPath = path.join(
                opts.vaults[0].fsPath,
                "assets",
                "logo.png"
              );
              await fs.ensureFile(path.join(opts.wsRoot, logoPath));
              setupConfig({
                ...opts,
                siteConfig: {
                  logoPath,
                },
              });
            },
          }
        );
      });
    });

    describe("AND the logo file is missing", () => {
      test("THEN export still works", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            const dest = await setupExport({ engine, wsRoot, vaults });
            // Site still exported
            await verifyExport(dest);
            // Logo was not exported out
            expect(
              await fs.pathExists(
                path.join(dest, "public", "assets", "logo.png")
              )
            ).toBeFalsy();
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              const logoPath = path.join(
                opts.vaults[0].fsPath,
                "assets",
                "logo.png"
              );
              setupConfig({
                ...opts,
                siteConfig: {
                  logoPath,
                },
              });
            },
          }
        );
      });
    });
  });
  describe("WHEN execute", () => {
    test("THEN create expected data files", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const dest = await setupExport({ engine, wsRoot, vaults });
          await verifyExport(dest);
          await checkDir(
            { fpath: path.join(dest, "data", "notes") },
            "foo.md",
            "foo.html"
          );
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            setupConfig(opts);
          },
        }
      );
    });
    describe("WHEN private link", () => {
      test("THEN override private link with 403 page", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            const dest = await setupExport({ engine, wsRoot, vaults });
            const contents = fs.readFileSync(
              path.join(dest, "data", "notes", "foo.html"),
              { encoding: "utf8" }
            );
            await TestUnifiedUtils.verifyPrivateLink({
              contents,
              value: "bar",
            });
            await verifyExport(dest);
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
              await NoteTestUtilsV4.modifyNoteByPath(
                { ...opts, vault: opts.vaults[0], fname: "foo" },
                (note) => {
                  note.id = "foo";
                  note.body = "Link to private note: [[bar]]";
                  return note;
                }
              );
              TestConfigUtils.withConfig(
                (config) => {
                  const vaults = ConfigUtils.getVaults(config);
                  const vault2 = vaults.find((ent) => ent.fsPath === "vault2");
                  vault2!.visibility = DVaultVisibility.PRIVATE;
                  ConfigUtils.setPublishProp(
                    config,
                    "siteUrl",
                    "https://foo.com"
                  );
                  return config;
                },
                { wsRoot: opts.wsRoot }
              );
            },
          }
        );
      });
    });
  });
});

describe("GIVEN nextjs export", () => {
  test("THEN ok", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const dest = await setupExport({ engine, wsRoot, vaults });
        await verifyExport(dest);
        await checkFile(
          { fpath: path.join(dest, "data", "dendron.json") },
          `"siteUrl": "https://foo.com"`,
          `"enablePrettyLinks": true`
        );
        await checkFile(
          { fpath: path.join(dest, "data", "tree.json") },
          `"roots": [`,
          `"child2parent": {`
        );
        // check pretty url
        await checkFile(
          {
            fpath: path.join(dest, "data", "notes", "foo.html"),
            nomatch: [`href="/notes/foo.ch1.html"`],
          },
          `href="/notes/foo.ch1"`
        );
      },
      {
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setPublishProp(config, "siteUrl", "https://foo.com");
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      }
    );
  });

  describe("WHEN override siteUrl", () => {
    test("THEN ok", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const dest = await setupExport({
            engine,
            wsRoot,
            vaults,
            podConfig: { overrides: { siteUrl: "https://bar.com" } },
          });
          verifyExport(dest);

          await checkFile(
            { fpath: path.join(dest, "data", "dendron.json") },
            `"siteUrl": "https://bar.com"`
          );
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            TestConfigUtils.withConfig(
              (config) => {
                ConfigUtils.setPublishProp(
                  config,
                  "siteUrl",
                  "https://foo.com"
                );
                return config;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });
  });

  describe("WHEN assetPrefix is set", () => {
    test("THEN ok", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const dest = await setupExport({ engine, wsRoot, vaults });
          await verifyExport(dest);
          await checkFile(
            { fpath: path.join(dest, ".env.production") },
            "NEXT_PUBLIC_ASSET_PREFIX=/customPrefix"
          );
          await checkFile(
            {
              fpath: path.join(dest, "data", "notes", "foo.html"),
            },
            `href="/customPrefix/notes/foo.ch1"`
          );
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            TestConfigUtils.withConfig(
              (config) => {
                ConfigUtils.setPublishProp(
                  config,
                  "siteUrl",
                  "https://foo.com"
                );
                ConfigUtils.setPublishProp(
                  config,
                  "assetsPrefix",
                  "/customPrefix"
                );
                return config;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });
  });

  describe("WHEN override canonical", () => {
    test("THEN ok", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const dest = await setupExport({
            engine,
            wsRoot,
            vaults,
            podConfig: {
              overrides: {
                canonicalBaseUrl: "https://foobar.com",
              },
            },
          });
          await verifyExport(dest);
          await checkFile(
            { fpath: path.join(dest, "data", "dendron.json") },
            `"canonicalBaseUrl": "https://foobar.com"`
          );
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            TestConfigUtils.withConfig(
              (config) => {
                ConfigUtils.setPublishProp(
                  config,
                  "siteUrl",
                  "https://foo.com"
                );
                return config;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });
  });

  describe("WHEN github Cname", () => {
    test("THEN ok", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const dest = tmpDir().name;
          const pod = new NextjsExportPod();
          await pod.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              dest,
              overrides: {
                siteUrl: "https://bar.com",
              },
            },
          });
          await checkDir({ fpath: dest }, "data", "public");
          await checkDir({ fpath: path.join(dest, "public") }, "CNAME");
          await checkFile(
            { fpath: path.join(dest, "public", "CNAME") },
            `11ty.dendron.so`
          );
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            TestConfigUtils.withConfig(
              (config) => {
                ConfigUtils.setGithubProp(config, "cname", "11ty.dendron.so");
                return config;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });
  });

  describe("WHEN sidebarPath", () => {
    describe("AND is set to false", () => {
      test("THEN ok", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            const dest = await setupExport({ engine, wsRoot, vaults });
            await verifyExport(dest);
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              setupConfig({
                ...opts,
                siteConfig: {
                  sidebarPath: false,
                },
              });
            },
          }
        );
      });
    });
    describe("AND points to non-existend file", () => {
      test("THEN throw", async () => {
        await runEngineTestV5(
          async ({ engine, vaults, wsRoot }) => {
            await expect(async () => {
              await setupExport({ engine, wsRoot, vaults });
            }).rejects.toThrow();
          },
          {
            expect,
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              setupConfig({
                ...opts,
                siteConfig: {
                  sidebarPath: "./non-existend-file.js",
                },
              });
            },
          }
        );
      });
    });
  });
});
