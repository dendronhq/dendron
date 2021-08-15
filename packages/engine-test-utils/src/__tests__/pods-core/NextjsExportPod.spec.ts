import { tmpDir } from "@dendronhq/common-server";
import { NextjsExportPod } from "@dendronhq/pods-core";
import fs from "fs-extra";
import path from "path";
import { TestConfigUtils } from "../../config";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";
import { checkDir, checkFile } from "../../utils";

describe("nextjs export", () => {
  test("ok", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const dest = tmpDir().name;
        const pod = new NextjsExportPod();
        debugger;
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest,
          },
        });
        await checkDir({ fpath: dest }, "data", "public");
        await checkDir(
          { fpath: path.join(dest, "data") },
          "dendron.json",
          "meta",
          "notes",
          "notes.json"
        ),
          await checkFile(
            { fpath: path.join(dest, "data", "dendron.json") },
            `"siteUrl": "https://foo.com"`
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
        const dest = tmpDir().name;
        const pod = new NextjsExportPod();
        debugger;
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest,
            siteUrl: "https://bar.com",
          },
        });
        await checkDir({ fpath: dest }, "data", "public");
        await checkDir(
          { fpath: path.join(dest, "data") },
          "dendron.json",
          "meta",
          "notes",
          "notes.json"
        ),
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

  test("ok, override canonical", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const dest = tmpDir().name;
        const pod = new NextjsExportPod();
        debugger;
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest,
            canonicalBaseUrl: "https://foobar.com",
          },
        });
        await checkDir({ fpath: dest }, "data", "public");
        await checkDir(
          { fpath: path.join(dest, "data") },
          "dendron.json",
          "meta",
          "notes",
          "notes.json"
        ),
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
