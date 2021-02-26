import {
  DNoteRefData,
  DNoteRefLink,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { DendronEngineV2 } from "../../../../enginev2";

export function createRefLink({
  fname,
  ...data
}: { fname: string } & DNoteRefData): DNoteRefLink {
  return {
    data: { ...data, type: "file" },
    from: {
      fname,
    },
    type: "ref",
  };
}

export const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV2.create({ vaults, wsRoot });
  return engine;
};
