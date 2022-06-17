import {
  VisualizeCLICommand,
  VisualizeCLICommandOpts,
} from "@dendronhq/dendron-cli";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import * as fs from "fs";
import { tmpDir } from "@dendronhq/common-server";
import * as path from "path";

const runCmd = (opts: Omit<VisualizeCLICommandOpts, "port" | "server">) => {
  const cmd = new VisualizeCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({
    ...opts,
    port: 0,
    server: {} as any,
  });
};

jest.setTimeout(12000);
describe("WHEN run 'visualize'", () => {
  describe("AND WHEN one director argument is not provided", () => {
    test("THEN visualization should be generated inside workspace root", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          await runCmd({
            wsRoot,
            engine,
          });

          vaults.forEach((vault) => {
            expect(
              fs.existsSync(
                path.join(wsRoot, getDiagramName(vault.name || vault.fsPath))
              )
            ).toEqual(true);
          });
        },
        {
          expect,
        }
      );
    });
  });

  describe("AND WHEN out directory option is provided", () => {
    test("THEN visualization should be generated inside the provided directory", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const outDir = tmpDir().name;

          await runCmd({
            wsRoot,
            engine,
            out: outDir,
          });

          vaults.forEach((vault) => {
            expect(
              fs.existsSync(
                path.join(outDir, getDiagramName(vault.name || vault.fsPath))
              )
            ).toEqual(true);
          });
        },
        {
          expect,
        }
      );
    });
  });
});

const getDiagramName = (vaultName: string): string =>
  `diagram-${vaultName}.svg`;
