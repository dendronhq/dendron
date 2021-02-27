import { DVault, VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { WorkspaceOpts } from "./engine";

export enum SETUP_HOOK_KEYS {
  /**
   * alpha: link(beta)
   * beta: link(alpha)
   */
  WITH_LINKS = "WITH_LINKS",
}

const createLink = (fname: string, opts: { vaultPrefix?: DVault }) => {
  let cVaultPrefix = "";
  if (opts.vaultPrefix) {
    cVaultPrefix = VaultUtils.toURIPrefix(opts.vaultPrefix) + "/";
  }
  return `[[${cVaultPrefix}${fname}]]`;
};

export async function callSetupHook(
  key: SETUP_HOOK_KEYS,
  opts: {
    workspaceType: "single" | "multi";
    withVaultPrefix?: boolean;
  } & WorkspaceOpts
) {
  const { workspaceType, vaults, wsRoot, withVaultPrefix } = opts;
  const isMultiVault = workspaceType !== "single";
  let cVaults = isMultiVault ? vaults : [vaults[0], vaults[0]];

  // WITH LINKS
  if (key === SETUP_HOOK_KEYS.WITH_LINKS) {
    const link1 = createLink("beta", {
      vaultPrefix: withVaultPrefix ? cVaults[1] : undefined,
    });
    await NoteTestUtilsV4.createNote({
      fname: "alpha",
      wsRoot,
      vault: cVaults[0],
      body: link1,
    });
    const link2 = createLink("alpha", {
      vaultPrefix: withVaultPrefix ? cVaults[0] : undefined,
    });
    await NoteTestUtilsV4.createNote({
      fname: "beta",
      wsRoot,
      vault: cVaults[1],
      body: link2,
    });
    if (isMultiVault) {
      await NoteTestUtilsV4.createNote({
        fname: "beta",
        wsRoot,
        vault: cVaults[0],
        body: link2,
        genRandomId: true,
      });
    }
  } else {
    throw Error("not supported key");
  }

  // if (isMultiVault) {
  //   // replicate all notes in all vaults if multi-vault
  //   await Promise.all(notes.map(n => {
  //     return Promise.all(cVaults.map(v => {
  //       return NoteTestUtilsV4.createNote({
  //         wsRoot,
  //         ...n,
  //         vault: v
  //       });
  //     }));
  //   }))
  // }
}
