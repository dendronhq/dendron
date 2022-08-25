import { DConfig } from "@dendronhq/common-server";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class ConfigureCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.CONFIGURE_RAW.key;
  public static requireActiveWorkspace: boolean = true;
  private _ext: IDendronExtension;

  constructor(extension: IDendronExtension) {
    super();
    this._ext = extension;
  }

  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const dendronRoot = this._ext.getDWorkspace().wsRoot;
    const configPath = DConfig.configPath(dendronRoot);
    const uri = Uri.file(configPath);
    await VSCodeUtils.openFileInEditor(uri);
    return;
  }
}
