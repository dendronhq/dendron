import { DVault } from "./DVault";
import { RemoteEndpoint } from "./RemoteEndpoint";

export type DWorkspace = {
  name: string;
  vaults: DVault[];
  remote: RemoteEndpoint;
};

export type DWorkspaceEntry = Omit<DWorkspace, "name" | "vaults">;
