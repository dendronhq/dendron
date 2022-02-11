import {
  assertUnreachable,
  ConfigUtils,
  DendronSiteConfig,
  getStage,
} from "@dendronhq/common-all";
import { execa } from "@dendronhq/engine-server";
import {
  NextjsExportConfig,
  NextjsExportPod,
  NextjsExportPodUtils,
  podClassEntryToPodItemV4,
  PodItemV4,
  PublishTarget,
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ProgressLocation, window } from "vscode";
import { ExportPodCommand } from "../commands/ExportPod";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace } from "../workspace";

const packageJson = {
  name: "dendron-site",
  version: "1.0.0",
  main: "index.js",
  license: "MIT",
  dependencies: {
    "@dendronhq/dendron-11ty-legacy": "^0.64.2",
  },
};

export const pkgCreate = (pkgPath: string) => {
  return fs.writeJSONSync(pkgPath, packageJson);
};

const pkgInstall = async () => {
  await execa("npm", ["install"], {
    cwd: getDWorkspace().wsRoot,
  });
};

const pkgUpgrade = async (pkg: string, version: string) => {
  const cmdInstall: string[] = `install --save ${pkg}@${version}`.split(" ");
  await execa("npm", cmdInstall, {
    cwd: getDWorkspace().wsRoot,
  });
};

export const checkPreReq = async () => {
  // check for package.json
  const pkgPath = path.join(getDWorkspace().wsRoot, "package.json");
  const nmPath = path.join(getDWorkspace().wsRoot, "node_modules");
  if (!fs.existsSync(pkgPath)) {
    const resp = await window.showInformationMessage(
      "install dependencies from package.json?",
      "Install",
      "Cancel"
    );
    if (resp === "Cancel") {
      return "cancel";
    }
    if (resp !== "Install") {
      return undefined;
    }
    pkgCreate(pkgPath);
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "installing dependencies...",
        cancellable: false,
      },
      async () => {
        return pkgInstall();
      }
    );
  } else {
    // check dependencies
    const pkgContents = fs.readJSONSync(pkgPath);
    const pkgDeps = pkgContents.dependencies as { [key: string]: string };

    const outOfDate = _.find(Object.keys(pkgDeps), (ent) =>
      ent.match(/@dendronhq\/dendron-11ty$/)
    );
    if (outOfDate) {
      const resp = await window.showInformationMessage(
        "Dependencies are out of date",
        "Update",
        "Cancel"
      );
      if (resp !== "Update") {
        return undefined;
      }
      delete pkgDeps["@dendronhq/dendron-11ty"];
      fs.writeJSONSync(pkgPath, pkgContents, { spaces: 4 });
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "upgrading dependencies",
          cancellable: false,
        },
        async (_progress, _token) => {
          return pkgUpgrade("@dendronhq/dendron-11ty-legacy", "0.59.1");
        }
      );
      window.showInformationMessage("finish updating dependencies");
    } else if (
      !fs.existsSync(nmPath) ||
      !fs.existsSync(path.join(nmPath, "@dendronhq"))
    ) {
      // user has package.json but never installed
      const resp = await window.showInformationMessage(
        "install dependencies from package.json?",
        "Install",
        "Cancel"
      );
      if (resp === "Cancel") {
        return "cancel";
      }
      if (resp !== "Install") {
        return undefined;
      }
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "installing dependencies...",
          cancellable: false,
        },
        async () => {
          return pkgInstall();
        }
      );
    } else {
      return undefined;
      // check NODE_MODULES TODO
    }
  }
  return undefined;
};

export const getSiteRootDirPath = () => {
  const ws = ExtensionProvider.getDWorkspace();
  const wsRoot = ws.wsRoot;
  const config = ws.config;
  const siteRootDir = ConfigUtils.getPublishingConfig(config).siteRootDir;
  const sitePath = path.join(wsRoot, siteRootDir);
  return sitePath;
};

export class NextJSPublishUtils {
  static async prepareNextJSExportPod() {
    const ws = ExtensionProvider.getDWorkspace();
    const wsRoot = ws.wsRoot;
    const engine = ws.engine;
    const cmd = new ExportPodCommand();

    let nextPath = NextjsExportPodUtils.getNextRoot(wsRoot);
    const podConfig: NextjsExportConfig = {
      dest: nextPath,
    };
    const podChoice = podClassEntryToPodItemV4(NextjsExportPod);

    // ask if they want to use default config or fill out themselves.
    const configPromptOut = await VSCodeUtils.showQuickPick(
      ["Use default", "Use config"],
      {
        title:
          "Would you like to configure the export behavior or use the default behavior?",
        ignoreFocusOut: true,
      }
    );
    let enrichedOpts:
      | { podChoice: PodItemV4; config: NextjsExportConfig }
      | undefined;
    if (configPromptOut === "Use config") {
      enrichedOpts = await cmd.enrichInputs({ podChoice });
      if (enrichedOpts?.config.dest) {
        nextPath = enrichedOpts.config.dest;
      }
    } else {
      enrichedOpts = { podChoice, config: podConfig };
    }
    if (getStage() !== "prod") {
      const config = engine.config;
      const siteConfig = ConfigUtils.getPublishingConfig(config);
      if (enrichedOpts?.config && !siteConfig.siteUrl) {
        _.set(
          enrichedOpts.config.overrides as Partial<DendronSiteConfig>,
          "siteUrl",
          "localhost:3000"
        );
      }
    }

    return { enrichedOpts, wsRoot, cmd, nextPath };
  }

  static async isInitialized(wsRoot: string) {
    const out = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Checking if NextJS template is initialized",
        cancellable: false,
      },
      async () => {
        const out = await NextjsExportPodUtils.isInitialized({
          wsRoot,
        });
        return out;
      }
    );
    return out;
  }

  static async removeNextPath(nextPath: string) {
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "removing NextJS template directory...",
        cancellable: false,
      },
      async () => {
        const out = await NextjsExportPodUtils.removeNextPath({
          nextPath,
        });
        return out;
      }
    );
  }

  static async install(nextPath: string) {
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Installing dependencies... This may take a while.",
        cancellable: false,
      },
      async () => {
        const out = await NextjsExportPodUtils.installDependencies({
          nextPath,
        });
        return out;
      }
    );
  }

  static async clone(nextPath: string) {
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Cloning NextJS template...",
        cancellable: false,
      },
      async () => {
        const out = await NextjsExportPodUtils.cloneTemplate({
          nextPath,
        });
        return out;
      }
    );
  }

  static async initialize(nextPath: string) {
    await NextJSPublishUtils.clone(nextPath);
    await NextJSPublishUtils.install(nextPath);
  }

  static async build(
    cmd: ExportPodCommand,
    podChoice: PodItemV4,
    podConfig: NextjsExportConfig
  ) {
    // todo: handle override.
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Building...",
        cancellable: false,
      },
      async () => {
        const out = cmd.execute({ podChoice, config: podConfig, quiet: true });
        return out;
      }
    );
  }

  static async promptSkipBuild() {
    const skipBuildPromptOut = await VSCodeUtils.showQuickPick(
      ["Skip", "Don't skip"],
      {
        title: "Would you like to skip the build process?",
        ignoreFocusOut: true,
      }
    );
    return skipBuildPromptOut === "Skip";
  }

  static async export(nextPath: string) {
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Exporting... this may take a while.",
        cancellable: false,
      },
      async () => {
        const out = await NextjsExportPodUtils.startNextExport({
          nextPath,
          quiet: true,
        });
        return out;
      }
    );
  }

  static async dev(nextPath: string) {
    const out = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "starting server.",
        cancellable: true,
      },
      async () => {
        const out = await NextjsExportPodUtils.startNextDev({
          nextPath,
          quiet: true,
        });
        return out;
      }
    );
    return out;
  }

  static async handlePublishTarget(
    target: PublishTarget,
    nextPath: string,
    wsRoot: string
  ) {
    switch (target) {
      case PublishTarget.GITHUB: {
        const docsPath = path.join(wsRoot, "docs");
        const outPath = path.join(nextPath, "out");
        await window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: "Building Github target...",
            cancellable: false,
          },
          async () => {
            const docsExist = fs.pathExistsSync(docsPath);
            if (docsExist) {
              const docsRemovePromptOut = await VSCodeUtils.showQuickPick(
                ["Don't remove.", "Remove"],
                {
                  title: "Docs folder already exists. Remove and continue??",
                  ignoreFocusOut: true,
                }
              );
              if (docsRemovePromptOut === "Don't remove") {
                window.showInformationMessage("Exiting.");
                return;
              }
              window.showInformationMessage("Removing /docs");
              fs.removeSync(docsPath);
            }
            fs.moveSync(outPath, docsPath);
            fs.ensureFileSync(path.join(docsPath, ".nojekyll"));
          }
        );
        window.showInformationMessage(
          `Done exporting. files available at ${docsPath}`
        );
        return;
      }
      default:
        assertUnreachable(target);
    }
  }
}
