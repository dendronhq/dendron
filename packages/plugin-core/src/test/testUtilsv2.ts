import { EngineTestUtilsV2, SetupWSOpts } from "@dendronhq/common-test-utils";
import _ from "lodash";
import path from "path";
import { ExtensionContext, Uri } from "vscode";
import { CONFIG } from "../constants";
import { DendronWorkspace } from "../workspace";
import { createMockConfig } from "./testUtils";

type SetupCodeConfigurationV2 = {
  configOverride?: Partial<typeof CONFIG>;
};

type SetupCodeWorkspaceV2 = SetupWSOpts &
  SetupCodeConfigurationV2 & {
    ctx: ExtensionContext;
    activateWorkspace: boolean;
  };

export function setupCodeConfiguration(opts: SetupCodeConfigurationV2) {
  const copts = _.defaults(opts, { configOverride: {} });
  DendronWorkspace.configuration = () => {
    const config: any = {
      dendron: {
        rootDir: ".",
      },
    };
    _.forEach(CONFIG, (ent) => {
      if (ent.default) {
        _.set(config, ent.key, ent.default);
      }
    });
    _.forEach(copts.configOverride, (v, k) => {
      _.set(config, k, v);
    });
    return createMockConfig(config);
  };
}

export async function setupCodeWorkspaceV2(opts: SetupCodeWorkspaceV2) {
  const { wsRoot, vaults } = await EngineTestUtilsV2.setupWS(opts);
  setupCodeConfiguration(opts);
  // setup workspace file
  DendronWorkspace.workspaceFile = () => {
    return Uri.file(path.join(wsRoot, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = Uri.file(path.join(wsRoot, "vault"));
    return [{ uri, name: "vault", index: 0 }];
  };
  const workspaceFile = DendronWorkspace.workspaceFile();
  const workspaceFolders = DendronWorkspace.workspaceFolders();
  return { wsRoot, vaults, workspaceFile, workspaceFolders };
}
