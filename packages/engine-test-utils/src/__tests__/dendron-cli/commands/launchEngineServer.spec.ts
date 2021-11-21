import { LaunchEngineServerCommand } from "@dendronhq/dendron-cli";
import { EngineUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import { runEngineTestV5 } from "../../../engine";

describe("GIVEN LaunchEngineServer cmd", () => {
  describe("WHEN args enriched", () => {
    test("THEN port file created", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cmd = new LaunchEngineServerCommand();
          await cmd.enrichArgs({ wsRoot });
          const cliPortFile = EngineUtils.getPortFilePathForCLI({ wsRoot });
          const wsPortFile = EngineUtils.getPortFilePath({ wsRoot });
          expect(fs.existsSync(cliPortFile)).toBeTruthy();
          expect(fs.existsSync(wsPortFile)).toBeFalsy();
        },
        {
          expect,
        }
      );
    });

    describe("WHEN noWritePort = true", () => {
      test("no file", async () => {
        await runEngineTestV5(
          async ({ wsRoot }) => {
            const cmd = new LaunchEngineServerCommand();
            await cmd.enrichArgs({ wsRoot, noWritePort: true });
            const cliPortFile = EngineUtils.getPortFilePathForCLI({ wsRoot });
            expect(fs.existsSync(cliPortFile)).toBeFalsy();
          },
          {
            expect,
          }
        );
      });
    });
  });
});
