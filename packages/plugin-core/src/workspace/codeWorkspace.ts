import { DWorkspaceV2, WorkspaceType } from "@dendronhq/common-all";
import { DendronBaseWorkspace } from "./baseWorkspace";

export class DendronCodeWorkspace
  extends DendronBaseWorkspace
  implements DWorkspaceV2
{
  public type = WorkspaceType.CODE;
}
