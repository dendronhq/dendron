import { ExtensionContext } from "vscode";
import { GLOBAL_STATE, WORKSPACE_STATE } from "../constants";

let _StateService: StateService | undefined = undefined;

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
}
