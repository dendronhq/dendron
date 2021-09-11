import {
  PublishCLICommand,
  PublishCLICommandOpts,
  PublishCommands,
} from "@dendronhq/dendron-cli";
import path from "path";
import sinon, { stub } from "sinon";
import { runEngineTestV5 } from "../../../engine";
import fs from "fs-extra";

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

describe("init", () => {
  const cmd = PublishCommands.INIT;
  afterEach(() => {
    sinon.restore();
  });
  test("ok", async () => {
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

describe("build", () => {
  const cmd = PublishCommands.BUILD;
  afterEach(() => {
    sinon.restore();
  });

  test("ok", async () => {
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
});
