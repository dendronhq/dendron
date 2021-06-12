import { SeedCommands, SeedConfig } from "@dendronhq/common-all";
import { SeedCLICommand, SeedCLICommandOpts } from "@dendronhq/dendron-cli";
import { runEngineTestV5 } from "../../../engine";

const runSeedCmd = ({
  cmd,
  id,
  ...opts
}: { cmd: SeedCommands; id: string } & Omit<SeedCLICommandOpts, "server">) => {
  const cli = new SeedCLICommand();
  return cli.execute({ cmd, id, ...opts, server: {} as any });
};

describe(SeedCommands.INFO, () => {
  const cmd = SeedCommands.INFO;
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot }) => {
        const id = "dendron.dendron-site";
        const resp = (await runSeedCmd({
          cmd,
          id,
          engine,
          wsRoot,
        })) as SeedConfig;
        expect(resp).toMatchSnapshot();
        expect(resp.name).toEqual("dendron-site");
      },
      {
        expect,
      }
    );
  });
});
