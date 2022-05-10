import { DVault } from "@dendronhq/common-all";

export const VAULTS = {
  MULTI_VAULT_WITH_THREE_VAULTS: () => {
    return [
      { fsPath: "vault1" },
      { fsPath: "vault2" },
      { fsPath: "vault3", name: "vaultThree" },
    ] as DVault[];
  },
};
