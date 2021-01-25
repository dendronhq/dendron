import { execa } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ProgressLocation, window } from "vscode";
import { DendronWorkspace, getWS } from "../workspace";

const packageJson = {
  name: "dendron-site",
  version: "1.0.0",
  main: "index.js",
  license: "MIT",
  dependencies: {
    "@dendronhq/dendron-11ty": "^1.26",
    "@dendronhq/dendron-cli": "^0.26",
  },
};

type NPMDep = { pkg: string; version: string };

const pkgCreate = (pkgPath: string) => {
  return fs.writeJSONSync(pkgPath, packageJson);
};
const pkgInstall = async () => {
  await execa("npm", ["install"], {
    cwd: DendronWorkspace.wsRoot(),
  });
};

const pkgUpgrade = async (pkg: string, version: string) => {
  const cmdInstall: string[] = `install --save ${pkg}${_.replace(
    version,
    "^",
    "@"
  )}`.split(" ");
  await execa("npm", cmdInstall, {
    cwd: DendronWorkspace.wsRoot(),
  });
};

export const checkPreReq = async () => {
  // check for package.json
  const pkgPath = path.join(DendronWorkspace.wsRoot(), "package.json");
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
    const pkgDeps = pkgContents.dependencies;
    const outOfDate: NPMDep[] = _.filter<NPMDep | undefined>(
      _.map(packageJson.dependencies, (v, k) => {
        if (pkgDeps[k] !== v) {
          return { pkg: k, version: v };
        }
        return undefined;
      }),
      (ent) => !_.isUndefined(ent)
    ) as NPMDep[];
    if (!_.isEmpty(outOfDate)) {
      const resp = await window.showInformationMessage(
        "Dependencies are out of date",
        "Update",
        "Cancel"
      );
      if (resp !== "Update") {
        return undefined;
      }
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "upgrading dependencies",
          cancellable: false,
        },
        async (_progress, _token) => {
          await _.reduce(
            outOfDate,
            async (prev, opts) => {
              await prev;
              let { pkg, version } = opts;
              return pkgUpgrade(pkg, version);
            },
            Promise.resolve()
          );
        }
      );
      window.showInformationMessage("finish updating dependencies");
    } else {
      return undefined;
      // check NODE_MODULES TODO
    }
  }
  return undefined;
};

export const getSiteRootDirPath = () => {
  const wsRoot = DendronWorkspace.wsRoot();
  const sitePath = path.join(wsRoot, getWS().config.site.siteRootDir);
  return sitePath;
};
