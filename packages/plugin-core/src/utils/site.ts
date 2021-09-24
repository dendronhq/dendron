import {
  BuildSiteV2CLICommand,
  BuildSiteV2CLICommandCliOpts,
} from "@dendronhq/dendron-cli";
import { execa } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ProgressLocation, window } from "vscode";
import { Logger } from "../logger";
import { getDWorkspace } from "../workspace";

const packageJson = {
  name: "dendron-site",
  version: "1.0.0",
  main: "index.js",
  license: "MIT",
  dependencies: {
    "@dendronhq/dendron-11ty-legacy": "^0.59.1",
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

export const buildSite = async (opts: BuildSiteV2CLICommandCliOpts) => {
  const eleventyPath = path.join(
    getDWorkspace().wsRoot,
    "node_modules",
    "@dendronhq",
    "dendron-11ty-legacy"
  );
  let importEleventy: any;
  try {
    importEleventy = require(`./webpack-require-hack.js`); // eslint-disable-line global-require
  } catch (error) {
    importEleventy = require;
  }
  const eleventy = importEleventy(eleventyPath);
  Logger.info({ ctx: "buildSite", eleventyPath });
  const cmd = new BuildSiteV2CLICommand();
  const cOpts = await cmd.enrichArgs(opts);
  await cmd.execute({
    ...cOpts,
    eleventy,
    cwd: eleventyPath,
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
  const wsRoot = getDWorkspace().wsRoot;
  const sitePath = path.join(wsRoot, getDWorkspace().config.site.siteRootDir);
  return sitePath;
};
