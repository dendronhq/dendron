import { LaunchEngineServerCommand } from "@dendronhq/dendron-cli";
import { getPortFilePath } from "@dendronhq/engine-server";
import fs from "fs-extra";
import { runEngineTestV5 } from "../../../engine";

describe("LaunchEngineServer", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const cmd = new LaunchEngineServerCommand();
        await cmd.enrichArgs({ wsRoot });
        const portFile = getPortFilePath({ wsRoot });
        expect(fs.existsSync(portFile)).toBeTruthy();
      },
      {
        expect,
      }
    );
  });

  test("no file", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const cmd = new LaunchEngineServerCommand();
        await cmd.enrichArgs({ wsRoot, noWritePort: true });
        const portFile = getPortFilePath({ wsRoot });
        expect(fs.existsSync(portFile)).toBeFalsy();
      },
      {
        expect,
      }
    );
  });
});
