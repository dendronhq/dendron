import {
  DendronConfig,
  DVault,
  DWorkspaceV2,
  WorkspaceType,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/engine-server";

export class DendronNativeWorkspace implements DWorkspaceV2 {
  public wsRoot: string;
  public type = WorkspaceType.NATIVE;
  public config: DendronConfig;
  public vaults: DVault[];

  constructor({ wsRoot }: { wsRoot: string }) {
    this.wsRoot = wsRoot;
    this.config = DConfig.getOrCreate(wsRoot);
    this.vaults = this.config.vaults;
  }
}
