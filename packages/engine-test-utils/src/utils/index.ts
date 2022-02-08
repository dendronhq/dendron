import {
  ConfigUtils,
  CONSTANTS,
  IntermediateDendronConfig,
  VaultUtils,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import { AssertUtils } from "@dendronhq/common-test-utils";
import { DConfig, WorkspaceUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export * from "./git";
export * from "./seed";
export * from "./unified";
export * from "./doctor";

export async function checkString(body: string, ...match: string[]) {
  return expect(
    await AssertUtils.assertInString({
      body,
      match,
    })
  ).toBeTruthy();
}

export async function checkDir(
  { fpath, snapshot }: { fpath: string; snapshot?: boolean; msg?: string },
  ...match: string[]
) {
  const body = fs.readdirSync(fpath).join(" ");
  if (snapshot) {
    expect(body).toMatchSnapshot();
  }
  return checkString(body, ...match);
}

export async function checkNotInDir(
  { fpath, snapshot }: { fpath: string; snapshot?: boolean; msg?: string },
  ...match: string[]
) {
  const body = fs.readdirSync(fpath).join(" ");
  if (snapshot) {
    expect(body).toMatchSnapshot();
  }
  return checkNotInString(body, ...match);
}

export async function checkFile(
  {
    fpath,
    snapshot,
    nomatch,
  }: { fpath: string; snapshot?: boolean; nomatch?: string[] },
  ...match: string[]
) {
  const body = fs.readFileSync(fpath, { encoding: "utf8" });
  if (snapshot) {
    expect(body).toMatchSnapshot();
  }
  await checkString(body, ...match);
  return !nomatch || checkNotInString(body, ...nomatch);
}

export async function checkNotInString(body: string, ...nomatch: string[]) {
  expect(
    await AssertUtils.assertInString({
      body,
      nomatch,
    })
  ).toBeTruthy();
}

/** The regular version of this only works in engine tests. If the test has to run in the plugin too, use this version. Make sure to check the return value! */
export async function checkFileNoExpect({
  fpath,
  nomatch,
  match,
}: {
  fpath: string;
  nomatch?: string[];
  match?: string[];
}) {
  const body = await fs.readFile(fpath, { encoding: "utf8" });
  return AssertUtils.assertInString({ body, match, nomatch });
}

const getWorkspaceFolders = (wsRoot: string) => {
  const wsPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME);
  const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
  return _.toArray(settings.folders);
};

export async function checkVaults(opts: WorkspaceOpts, expect: any) {
  const { wsRoot, vaults } = opts;
  const configPath = DConfig.configPath(opts.wsRoot);
  const config = readYAML(configPath) as IntermediateDendronConfig;
  const vaultsConfig = ConfigUtils.getVaults(config);
  expect(_.sortBy(vaultsConfig, ["fsPath", "workspace"])).toEqual(
    _.sortBy(vaults, ["fsPath", "workspace"])
  );
  if (
    (await WorkspaceUtils.getWorkspaceTypeFromDir(wsRoot)) ===
    WorkspaceType.CODE
  ) {
    const wsFolders = getWorkspaceFolders(wsRoot);
    expect(wsFolders).toEqual(
      vaults.map((ent) => {
        const out: WorkspaceFolderRaw = { path: VaultUtils.getRelPath(ent) };
        if (ent.name) {
          out.name = ent.name;
        }
        return out;
      })
    );
  }
}
