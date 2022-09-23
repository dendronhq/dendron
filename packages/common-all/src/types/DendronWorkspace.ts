import { DVault } from "./DVault";
import { RemoteEndpoint } from "./RemoteEndpoint";

export type DendronWorkspace = {
  name: string;
  vaults: DVault[];
  remote: RemoteEndpoint;
};
