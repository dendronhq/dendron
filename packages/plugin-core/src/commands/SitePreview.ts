import { express } from "@dendronhq/api-server";
import { CONSTANTS } from "@dendronhq/common-all";
import { BuildSiteV2CLICommandOpts } from "@dendronhq/dendron-cli";
import { SiteUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import { env, ProgressLocation, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { buildSite, checkPreReq, getSiteRootDirPath } from "../utils/site";
import { DendronWorkspace, getEngine, getWS } from "../workspace";
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
        return new Promise(async (resolve, reject) => {
          try {
            await buildSite({
              wsRoot,
              stage: "dev",
              enginePort: port,
              serve: false,
            });
          } catch (err) {
            window.showErrorMessage(err);
          }
          const siteOutput = SiteUtils.getSiteOutputPath({
            config: getWS().config,
            wsRoot,
            stage: "dev",
          });
          const app = express();
          app.use(express.static(siteOutput));
          const serverPort =
            getEngine().config.site.previewPort ||
            CONSTANTS.DENDRON_LOCAL_SITE_PORT;
          const server = app.listen(serverPort);
          server.on("error", (err) => {
            window.showErrorMessage(JSON.stringify(err));
            reject(err);
          });
          server.on("listening", () => {
            progress.report({ message: "preview is ready" });
            env.openExternal(Uri.parse(`http://localhost:${serverPort}`));
          });
          token.onCancellationRequested(() => {
            server.close((err) => {
              if (err) {
                window.showErrorMessage(JSON.stringify(err));
                reject(err);
              } else {
                this.L.info("server closed");
                resolve(undefined);
              }
            });
          });
        });
      }
    );
    return;
  }
}
