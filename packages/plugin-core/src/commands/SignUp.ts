import { env, Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class SignUpCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.SIGNUP.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    env.openExternal(
      Uri.parse(
        "https://auth.dendron.so/signup?client_id=7uamhg5vcchlrb149k1bs9k48i&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https://app.dendron.so"
      )
    );
  }
}
