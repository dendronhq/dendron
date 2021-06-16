import {
  CONSTANTS,
  DendronConfig,
  VaultUtils,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import { AssertUtils } from "@dendronhq/common-test-utils";
import { DConfig } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
export * from "./git";

export async function checkString(body: string, ...match: string[]) {
  expect(
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
  { fpath, snapshot }: { fpath: string; snapshot?: boolean },
  ...match: string[]
) {
  const body = fs.readFileSync(fpath, { encoding: "utf8" });
  if (snapshot) {
    expect(body).toMatchSnapshot();
  }
  return checkString(body, ...match);
}

export async function checkNotInString(body: string, ...nomatch: string[]) {
  expect(
    await AssertUtils.assertInString({
      body,
      nomatch,
    })
  ).toBeTruthy();
}

const getWorkspaceFolders = (wsRoot: string) => {
  const wsPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME);
  const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
  return _.toArray(settings.folders);
};

export function checkVaults(opts: WorkspaceOpts, expect: any) {
  const { wsRoot, vaults } = opts;
  const configPath = DConfig.configPath(opts.wsRoot);
  const config = readYAML(configPath) as DendronConfig;
  expect(_.sortBy(config.vaults, ["fsPath", "workspace"])).toEqual(
    _.sortBy(vaults, ["fsPath", "workspace"])
  );
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
