import { DendronConfig, URI } from "@dendronhq/common-all";
import {
  PublishCLICommand,
  PublishCLICommandCLIOpts,
  PublishCLICommandOpts,
  PublishCommands,
} from "@dendronhq/dendron-cli";
import { NextjsExportPodUtils } from "@dendronhq/pods-core";
import fs from "fs-extra";
import path from "path";
import sinon, { stub } from "sinon";
import { ENGINE_HOOKS } from "../../..";
import { runEngineTestV5 } from "../../../engine";

export const runPublishCmd = ({
  cmd,
  ...opts
}: {
  cmd: PublishCommands;
  cli?: PublishCLICommand;
} & PublishCLICommandOpts) => {
  const cli = opts.cli ? opts.cli : new PublishCLICommand();
  return cli.execute({ cmd, ...opts });
};

export const evalPublishCmd = ({
  cmd,
  ...opts
}: {
  cmd: PublishCommands;
  cli?: PublishCLICommand;
} & PublishCLICommandCLIOpts) => {
  const cli = opts.cli ? opts.cli : new PublishCLICommand();
  return cli.eval({ cmd, ...opts });
};

describe("WHEN run `dendron publish init`", () => {
  const cmd = PublishCommands.INIT;
  afterEach(() => {
    sinon.restore();
  });
  test("THEN succeed", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const cli = new PublishCLICommand();
        const initStub = stub(cli, "init").returns({ error: null });
        await runPublishCmd({ cli, cmd, wsRoot });
        expect(initStub.calledOnce).toBeTruthy();
      },
      {
        expect,
      }
    );
  });
});

describe("AND with custom template", () => {
  const cmd = PublishCommands.INIT;
  afterEach(() => {
    sinon.restore();
  });

  test("THEN clone custom template", async () => {
    jest.setTimeout(15000);

    await runEngineTestV5(
      async ({ wsRoot }) => {
        // TODO: use a fork of nextjs-template under the dendronhq org.
        const template = "https://github.com/dendronhq/handbook.git";
        const dendronConfig = path.join(wsRoot, ".next", "dendron.yml");
        const cli = new PublishCLICommand();
        await runPublishCmd({ cli, cmd, wsRoot, template });
        expect(fs.existsSync(dendronConfig)).toBeTruthy();
      },
      {
        expect,
      }
    );
  });

  //test("AND with invalid template URL")
});

describe("WHEN run `dendron publish build`", () => {
  const cmd = PublishCommands.BUILD;
  afterEach(() => {
    sinon.restore();
  });

  test("THEN succeed", async () => {
    jest.setTimeout(15000);
    await runEngineTestV5(
      async ({ wsRoot }) => {
        await runPublishCmd({ cmd, wsRoot });
        const dataDir = path.join(wsRoot, ".next", "data");
        expect(fs.existsSync(dataDir)).toBeTruthy();
      },
      {
        expect,
      }
    );
  });

  describe("AND with invalid override key", () => {
    test("THEN show error", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const out = await evalPublishCmd({
            cmd,
            wsRoot,
            overrides: "foo=bar",
          });
          expect(out?.error?.message).toEqual(
            "bad key for override. foo is not a valid key"
          );
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND with siteUrl override", () => {
    test("THEN update siteUrl", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const siteUrlOverride = "http://foo.com";
          await evalPublishCmd({
            cmd,
            wsRoot,
            overrides: `siteUrl=${siteUrlOverride}`,
          });
          const dest = URI.file(path.join(wsRoot, ".next"));
          const dataDir = path.join(wsRoot, ".next", "data");
          expect(fs.existsSync(dataDir)).toBeTruthy();

          const cpath = NextjsExportPodUtils.getDendronConfigPath(dest);
          const config = fs.readJSONSync(cpath) as DendronConfig;
          expect(config.site.siteUrl).toEqual(siteUrlOverride);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});
