import { BuildSiteV2CLICommandOpts } from "@dendronhq/dendron-cli";
import { execa } from "@dendronhq/engine-server";
import fs from "fs-extra";
import stream from "stream";
import { env, ProgressLocation, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { checkPreReq, getSiteRootDirPath } from "../utils/site";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = Partial<BuildSiteV2CLICommandOpts>;

type CommandOutput = void;

export class SitePreviewCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.SITE_PREVIEW.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  async sanityCheck() {
    const sitePath = getSiteRootDirPath();
    if (!fs.existsSync(sitePath)) {
      return "no site found";
    }
    return checkPreReq();
  }

  async execute(_opts?: CommandOpts) {
    const ctx = "SitePreviewCommand";
    this.L.info({ ctx, msg: "enter" });
    const wsRoot = DendronWorkspace.wsRoot();
    const port = DendronWorkspace.instance().port!;
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "creating preview",
        cancellable: true,
      },
      async (progress, token) => {
        const s = new stream.Writable();
        s.on("data", (chunk) => {
          console.log(chunk.toString());
        });
        const subprocess = execa(
          "npx",
          [
            "dendron-cli",
            "buildSiteV2",
            "--wsRoot",
            wsRoot,
            "--stage",
            "dev",
            "--enginePort",
            `${port}`,
            "--serve",
          ],
          { cwd: wsRoot, shell: true, windowsHide: false }
        );
        subprocess.stdout?.on("data", (chunk) => {
          const msg: string = chunk.toString();
          this.L.info({ ctx, msg });
          if (msg.indexOf("Serving files from") >= 0) {
            progress.report({ message: "preview is ready" });
            env.openExternal(Uri.parse("http://localhost:8080"));
          }
        });

        token.onCancellationRequested(() => {
          if (subprocess) {
            subprocess.kill("SIGTERM", {
              forceKillAfterTimeout: 200,
            });
          }
        });
        return new Promise(() => {});
      }
    );
    return;
  }
}
