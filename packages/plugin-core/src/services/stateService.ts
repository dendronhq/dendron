import _ from "lodash";
import { ExtensionContext } from "vscode";
import {
  GLOBAL_STATE,
  WORKSPACE_ACTIVATION_CONTEXT,
  WORKSPACE_STATE,
} from "../constants";

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
   * Get from {@link ExtensionGlobalState} (VSCode specific state)
   */
  getGlobalVersion(): string {
    return (
      this.globalState.get<string | undefined>(GLOBAL_STATE.VERSION) || "0.0.0"
    );
  }
  /**
   * Previous workspace version
   * Get from {@link ExtensionWorkspaceState}  (VSCode specific store)
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

  getActivationContext(): WORKSPACE_ACTIVATION_CONTEXT {
    return (
      this.globalState.get<WORKSPACE_ACTIVATION_CONTEXT>(
        GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT
      ) ?? WORKSPACE_ACTIVATION_CONTEXT.NORMAL
    );
  }

  setActivationContext(context: WORKSPACE_ACTIVATION_CONTEXT) {
    return this.globalState.update(
      GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
      context
    );
  }

  getMRUGoogleDocs(): Promise<string[] | undefined> | undefined {
    return this.globalState.get(GLOBAL_STATE.MRUDocs);
  }

  updateMRUGoogleDocs(value: any) {
    return this.globalState.update(GLOBAL_STATE.MRUDocs, value);
  }

  /**
   * added generic method for cases when the keys and values both are dynamic
   * eg: hierarchy destination for imported google doc.
   */
  getGlobalState(key: string): Promise<string> | undefined {
    return this.globalState.get(key);
  }

  updateGlobalState(key: string, value: any) {
    return this.globalState.update(key, value);
  }

  resetGlobalState() {
    _.values(GLOBAL_STATE).map((k) => {
      return this.globalState.update(k, undefined);
    });
  }

  resetWorkspaceState() {
    _.keys(WORKSPACE_STATE).map((k) => {
      this.workspaceState.update(k, undefined);
    });
  }
}
