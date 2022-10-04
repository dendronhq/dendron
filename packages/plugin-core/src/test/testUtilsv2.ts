import {
  DNodeUtils,
  DVault,
  ErrorUtils,
  NoteProps,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import { SetupHookFunction } from "@dendronhq/common-test-utils";
import { MetadataService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import {
  ExtensionContext,
  Location,
  Position,
  Selection,
  Uri,
  window,
  workspace,
} from "vscode";
import { SetupWorkspaceOpts } from "../commands/SetupWorkspace";
import { CONFIG } from "../constants";
import { DendronExtension } from "../workspace";
import { createMockConfig } from "./testUtils";
import { _activate } from "../_extension";
import { ExtensionProvider } from "../ExtensionProvider";

export type SetupCodeConfigurationV2 = {
  configOverride?: { [key: string]: any };
};

export type SetupCodeWorkspaceMultiVaultV2Opts = SetupCodeConfigurationV2 & {
  ctx: ExtensionContext;
  preSetupHook?: SetupHookFunction;
  postSetupHook?: SetupHookFunction;
  setupWsOverride?: Partial<SetupWorkspaceOpts>;
};

export function genEmptyWSFiles() {
  return [".vscode", "root.md", "root.schema.yml"];
}

export function genDefaultSettings() {
  return {
    extensions: {
      recommendations: [
        "dendron.dendron",
        "dendron.dendron-paste-image",
        "dendron.dendron-markdown-shortcuts",
        "redhat.vscode-yaml",
      ],
      unwantedRecommendations: [
        "dendron.dendron-markdown-links",
        "dendron.dendron-markdown-notes",
        "dendron.dendron-markdown-preview-enhanced",
        "shd101wyy.markdown-preview-enhanced",
        "kortina.vscode-markdown-notes",
        "mushan.vscode-paste-image",
      ],
    },
    folders: [
      {
        path: "vault",
      },
    ],
    settings: {
      "dendron.rootDir": ".",
      "editor.snippetSuggestions": "inline",
      "editor.suggest.showSnippets": true,
      "editor.suggest.snippetsPreventQuickSuggestions": false,
      "editor.tabCompletion": "on",
      "files.autoSave": "onFocusChange",
      "markdown-preview-enhanced.enableWikiLinkSyntax": true,
      "markdown-preview-enhanced.wikiLinkFileExtension": ".md",
      "pasteImage.path": "${currentFileDir}/assets/images", // eslint-disable-line no-template-curly-in-string
      "pasteImage.prefix": "/",
    },
  };
}

/**
 * Setup DendronExtension config options
 * @param opts
 */
export function setupCodeConfiguration(opts: SetupCodeConfigurationV2) {
  const copts = _.defaults(opts, {
    configOverride: {},
  });
  DendronExtension.configuration = () => {
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

export async function resetCodeWorkspace() {
  // @ts-ignore
  DendronExtension.workspaceFile = () => {
    return undefined;
  };
  // @ts-ignore
  DendronExtension.workspaceFolders = () => {
    return undefined;
  };
  if (fs.pathExistsSync(MetadataService.metaFilePath())) {
    fs.removeSync(MetadataService.metaFilePath());
  }
}

export const getNoteFromTextEditor = (): NoteProps => {
  const txtPath = window.activeTextEditor?.document.uri.fsPath as string;
  const vault = { fsPath: path.dirname(txtPath) };
  const { wsRoot } = ExtensionProvider.getDWorkspace();
  const fullPath = DNodeUtils.getFullPath({
    wsRoot,
    vault,
    basename: path.basename(txtPath),
  });
  const resp = file2Note(fullPath, vault);
  if (ErrorUtils.isErrorResp(resp)) {
    throw resp.error;
  }
  return resp.data;
};

export class LocationTestUtils {
  /**
   * get default wiki link position
   */
  static getPresetWikiLinkPosition = (opts?: {
    line?: number;
    char?: number;
  }) => new Position(opts?.line || 7, opts?.char || 2);

  static getPresetWikiLinkSelection = (opts?: {
    line?: number;
    char?: number;
  }) =>
    new Selection(
      LocationTestUtils.getPresetWikiLinkPosition(opts),
      LocationTestUtils.getPresetWikiLinkPosition(opts)
    );

  static getBasenameFromLocation = (loc: Location) =>
    path.basename(loc.uri.fsPath);
}

export const stubWorkspaceFile = (wsRoot: string) => {
  const wsPath = path.join(wsRoot, "dendron.code-workspace");
  fs.writeJSONSync(wsPath, {});
  sinon.stub(workspace, "workspaceFile").value(Uri.file(wsPath));
  DendronExtension.workspaceFile = () => {
    return Uri.file(wsPath);
  };
};

export const stubWorkspaceFolders = (wsRoot: string, vaults: DVault[]) => {
  const folders = vaults
    .map((v) => ({
      name: VaultUtils.getName(v),
      index: 1,
      uri: Uri.file(path.join(wsRoot, VaultUtils.getRelPath(v))),
    }))
    .concat([
      {
        name: "root",
        index: 0,
        uri: Uri.parse(wsRoot),
      },
    ]);

  sinon.stub(workspace, "workspaceFolders").value(folders);
  DendronExtension.workspaceFolders = () => folders;
};

export const stubWorkspace = ({ wsRoot, vaults }: WorkspaceOpts) => {
  stubWorkspaceFile(wsRoot);
  stubWorkspaceFolders(wsRoot, vaults);
};

/**
 *  Releases all registered VS Code Extension resouces such as commands and
 *  providers
 * @param ctx
 */
export function cleanupVSCodeContextSubscriptions(ctx: ExtensionContext) {
  ctx.subscriptions.forEach((disposable) => {
    disposable?.dispose();
  });
}

export * from "./expect";
