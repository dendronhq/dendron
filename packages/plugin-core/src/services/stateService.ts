import { ExtensionContext } from "vscode";
import { GLOBAL_STATE, WORKSPACE_STATE } from "../constants";
import * as vscode from "vscode";
import { VSCodeUtils } from "../utils";

let _StateService: StateService | undefined;

type ExtensionGlobalState = ExtensionContext["globalState"];
type ExtensionWorkspaceState = ExtensionContext["workspaceState"];

/**
 * Keeps track of workspace state
 */
export class StateService {
  public globalState: ExtensionGlobalState;
  public workspaceState: ExtensionWorkspaceState;

  constructor(opts: {
    globalState: ExtensionGlobalState;
    workspaceState: ExtensionWorkspaceState;
  }) {
    this.globalState = opts.globalState;
    this.workspaceState = opts.workspaceState;
    _StateService = this;
  }

  static instance(): StateService {
    if (!_StateService) {
      throw Error("StateService not initialized");
    }
    return _StateService;
  }

  /**
   * Previous global version
   * @returns
   */
  getGlobalVersion(): string {
    return (
      this.globalState.get<string | undefined>(GLOBAL_STATE.VERSION) || "0.0.0"
    );
  }
  /**
   * Previous workspace version
   * @returns
   */
  getWorkspaceVersion(): string {
    return this.workspaceState.get<string>(WORKSPACE_STATE.VERSION) || "0.0.0";
  }

  setGlobalVersion(version: string) {
    return this.globalState.update(GLOBAL_STATE.VERSION, version);
  }

  setWorkspaceVersion(version: string) {
    return this.workspaceState.update(WORKSPACE_STATE.VERSION, version);
  }

  showTelemetryNotice() {
    vscode.window
      .showInformationMessage(
        `Dendron collects limited usage data to help improve the quality of our software`,
        "See Details",
        "Opt Out"
      )
      .then((resp) => {
        if (resp === "See Details") {
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html"
          );
        }
        if (resp === "Opt Out") {
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html#how-to-opt-out-of-data-collection"
          );
        }
      });
  }
}
