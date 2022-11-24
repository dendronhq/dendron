import { ConfigService, URI } from "@dendronhq/common-all";
import { LocalConfigScope } from "@dendronhq/common-server";
import fs from "fs-extra";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  configScope?: LocalConfigScope;
};

type CommandOutput = void;

export class ConfigureLocalOverride extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONFIGURE_LOCAL_OVERRIDE.key;
  public static requireActiveWorkspace: boolean = true;
  _ext: IDendronExtension;

  constructor(extension: IDendronExtension) {
    super();
    this._ext = extension;
  }

  async execute(opts?: CommandOpts) {
    /* In the test environemnt, configScope is passed as option for this command */
    const configScope = opts?.configScope || (await getConfigScope());

    if (configScope === undefined) {
      VSCodeUtils.showMessage(
        MessageSeverity.ERROR,
        "Configuration scope needs to be selected to open dendronrc.yml file",
        {}
      );
      return;
    }

    const dendronRoot = this._ext.getDWorkspace().wsRoot;

    const configOverridePath = ConfigService.instance().configOverridePath(
      URI.file(dendronRoot),
      configScope.toLowerCase() as "workspace" | "global"
    );

    if (!configOverridePath) {
      VSCodeUtils.showMessage(
        MessageSeverity.INFO,
        "Global scope is not supported in this environment.",
        {}
      );
      return;
    }

    /* If the config file doesn't exist, create one */
    await fs.ensureFile(configOverridePath.fsPath);

    const uri = Uri.file(configOverridePath.fsPath);
    // What happens if the file doesn't exist
    await VSCodeUtils.openFileInEditor(uri);

    return;
  }
}

const getConfigScope = async (): Promise<LocalConfigScope | undefined> => {
  const options = [
    {
      label: LocalConfigScope.WORKSPACE,
      detail: "Configure dendronrc.yml for current workspace",
    },
    {
      label: LocalConfigScope.GLOBAL,
      detail: "Configure dendronrc.yml for all dendron workspaces",
    },
  ];

  const scope = await VSCodeUtils.showQuickPick(options, {
    title: "Select configuration scope",
    placeHolder: "vault",
    ignoreFocusOut: true,
  });

  return scope ? (scope.label as LocalConfigScope) : undefined;
};
