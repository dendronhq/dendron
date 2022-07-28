import { StateValidator } from "@dendronhq/common-server";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { BasicCommand } from "./base";

const L = Logger;

type ValidateEngineCommandOpts = {};

export class ValidateEngineCommand extends BasicCommand<
  ValidateEngineCommandOpts,
  void
> {
  key = DENDRON_COMMANDS.VALIDATE_ENGINE.key;
  async execute(opts?: ValidateEngineCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const logPath = Logger.logPath;
    if (!logPath) {
      throw Error("logPath not defined");
    }
    const engine = ExtensionProvider.getEngine();
    const responses = await StateValidator.validateEngineState(engine);
    responses.map((resp) => {
      if (resp.error) {
        window.showErrorMessage(resp.error.message);
      }
    });
  }

  async showResponse() {
    window.showInformationMessage("Finished validating engine");
  }
}
