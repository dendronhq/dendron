import { DEngineClient, WorkspaceOpts } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NextjsExportConfig, NextjsExportPod } from "@dendronhq/pods-core";
import path from "path";
import { TestConfigUtils } from "../../config";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";
import { checkDir, checkFile } from "../../utils";

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
    "notes.json"
  );
}

describe("nextjs export", () => {
  test("ok", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const dest = await setupExport({ engine, wsRoot, vaults });
        await verifyExport(dest);
        await checkFile(
          { fpath: path.join(dest, "data", "dendron.json"), snapshot: true },
          `"siteUrl": "https://foo.com"`,
          `"usePrettyLinks": true`
        );
        // check pretty url
        await checkFile(
          {
            fpath: path.join(dest, "data", "notes", "foo.html"),
            snapshot: true,
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
              config.site.siteUrl = "https://foo.com";
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      }
    );
  });

  test("ok, override siteUrl", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const dest = await setupExport({
          engine,
          wsRoot,
          vaults,
          podConfig: { siteUrl: "https://bar.com" },
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
              config.site.siteUrl = "https://foo.com";
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      }
    );
  });

  test("ok, with assetPrefix", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const dest = await setupExport({ engine, wsRoot, vaults });
        await verifyExport(dest);
        await checkFile(
          { fpath: path.join(dest, ".env.production") },
          "NEXT_PUBLIC_ASSET_PREFIX=/customPrefix"
        );
      },
      {
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
          TestConfigUtils.withConfig(
            (config) => {
              config.site.siteUrl = "https://foo.com";
              config.site.assetsPrefix = "/customPrefix";
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      }
    );
  });

  test("ok, override canonical", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const dest = await setupExport({
          engine,
          wsRoot,
          vaults,
          podConfig: {
            canonicalBaseUrl: "https://foobar.com",
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
              config.site.siteUrl = "https://foo.com";
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      }
    );
  });
});
