import { DENDRON_COMMANDS } from "../constants";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = {};

enum Scopes {
  Vault = "vault",
  Global = "global",
}

export class ConfigureLocalOverride extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONFIGURE_LOCAL_OVERRIDE.key;

  async execute() {
    const configScope = await getConfigScope();
    if (configScope === undefined) {
      VSCodeUtils.showMessage(
        MessageSeverity.ERROR,
        "Configuration scope needs to be selected to open dendronrc.yml file",
        {}
      );
      return {};
    }

    return {};
  }
}

const getConfigScope = async (): Promise<Scopes | undefined> => {
  const options = [
    {
      label: Scopes.Vault,
      detail: "Configure dendronrc.yml for current local vault",
    },
    {
      label: Scopes.Global,
      detail: "Configure dendronrc.yml for all local dendron workspaces",
    },
  ];

  const scope = await VSCodeUtils.showQuickPick(options, {
    title: "Select configuration scope",
    placeHolder: "vault",
    ignoreFocusOut: true,
  });

  return scope ? (scope.label as Scopes) : undefined;
};
