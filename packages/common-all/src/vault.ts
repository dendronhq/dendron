import _ from "lodash";
import path from "path";
import { FOLDERS, normalizeUnixPath } from ".";
import { CONSTANTS } from "./constants";
import { DendronError } from "./error";
import { WorkspaceFolderRaw } from "./types";
import { DVault } from "./types/DVault";
import { NonOptional } from "./utils";

export type SelfContainedVault = Omit<DVault, "selfContained"> & {
  selfContained: true;
};

export type SeedVault = NonOptional<DVault, "seed">;

export class VaultUtils {
  static getName(vault: DVault): string {
    if (vault.seed) {
      return vault.seed;
    }
    return vault.name || path.basename(vault.fsPath);
  }

  static isEqual(
    vaultSrc: DVault | string,
    vaultCmp: DVault | string,
    wsRoot: string
  ) {
    if (_.isString(vaultSrc)) {
      vaultSrc = { fsPath: vaultSrc };
    }
    if (_.isString(vaultCmp)) {
      vaultCmp = { fsPath: vaultCmp };
    }
    return (
      this.normVaultPath({ vault: vaultSrc, wsRoot }) ===
      this.normVaultPath({ vault: vaultCmp, wsRoot })
    );
  }

  static isEqualV2(vaultSrc: DVault, vaultCmp: DVault) {
    return VaultUtils.getRelPath(vaultSrc) === VaultUtils.getRelPath(vaultCmp);
  }

  static isSelfContained(vault: DVault): vault is SelfContainedVault {
    return vault.selfContained === true;
  }

  static isSeed(vault: DVault): vault is SeedVault {
    return vault.seed !== undefined;
  }

  static isRemote(vault: DVault): boolean {
    return vault.remote !== undefined;
  }

  /**
   * Path for the location of notes in this vault, relative to the workspace
   * root.
   *
   * While for old vaults this is the same as
   * {@link VaultUtils.getRelVaultRootPath}, for self contained vaults the notes
   * are located inside the vault in the `notes` subdirectory.
   *
   * @param vault
   * @returns path for location of the notes in the vault, relative to the
   * workspace root
   */
  static getRelPath(vault: DVault) {
    if (VaultUtils.isSelfContained(vault)) {
      // Return the path to the notes folder inside the vault. This is for
      // compatibility with existing code.
      return normalizeUnixPath(path.join(vault.fsPath, FOLDERS.NOTES));
    }
    if (vault.workspace) {
      return path.join(vault.workspace, vault.fsPath);
    }
    if (vault.seed) {
      return path.join("seeds", vault.seed, vault.fsPath);
    }
    return vault.fsPath;
  }

  /**
   * Path for the location of vault root, relative to the workspace root.
   *
   * While for old vaults this is the same as {@link VaultUtils.getRelPath}, for
   * self contained vaults the notes are located inside the vault in the `notes`
   * subdirectory.
   *
   * @param vault
   * @returns path for root of the vault, relative to the workspace root. May be "." for the top level self contained vault.
   */
  static getRelVaultRootPath(vault: DVault) {
    if (VaultUtils.isSelfContained(vault)) return vault.fsPath;
    return VaultUtils.getRelPath(vault);
  }

  static getVaultByName({
    vaults,
    vname,
  }: {
    vname: string;
    vaults: DVault[];
  }): DVault | undefined {
    const vault = _.find(vaults, (vault) => {
      return vname === VaultUtils.getName(vault);
    });
    return vault;
  }

  /**
   * Like {@link getVaultByName} except throw error if undefined
   * @param param0
   * @returns
   */
  static getVaultByNameOrThrow({
    vaults,
    vname,
  }: {
    vname: string;
    vaults: DVault[];
  }) {
    const vault = this.getVaultByName({ vaults, vname });
    if (!vault) {
      throw new DendronError({ message: `vault with name ${vname} not found` });
    }
    return vault;
  }

  /**
   * See if a dir path matches that of an existing vault
   * @param param0
   * @returns
   */
  static getVaultByDirPath({
    vaults,
    wsRoot,
    fsPath,
  }: {
    /**
     * Absolute or relative path to note
     */
    fsPath: string;
    wsRoot: string;
    vaults: DVault[];
  }) {
    const normPath = this.normPathByWsRoot({
      wsRoot,
      fsPath,
    }).trim();
    const unixPath = normalizeUnixPath(normPath);
    const vault = _.find(vaults, (ent) => {
      return unixPath === normalizeUnixPath(VaultUtils.getRelPath(ent).trim());
    });
    if (!vault) {
      throw new DendronError({
        message: "no vault found",
        payload: { wsRoot, fsPath, vaults, normPath, msg: "no vault found" },
      });
    }
    return vault;
  }

  static getVaultByFilePath({
    vaults,
    wsRoot,
    fsPath,
  }: {
    /**
     * Absolute or relative path to note
     */
    fsPath: string;
    wsRoot: string;
    vaults: DVault[];
  }) {
    return this.getVaultByDirPath({
      vaults,
      wsRoot,
      fsPath: path.dirname(fsPath),
    });
  }

  /**
   * Match vault to vaults
   */
  static matchVault = (opts: {
    vault: DVault;
    vaults: DVault[];
    wsRoot: string;
  }) => {
    const { vault, vaults, wsRoot } = opts;
    const maybeMatch = _.filter(vaults, (v) => {
      return VaultUtils.isEqual(v, vault, wsRoot);
    });
    if (maybeMatch.length === 1) {
      return maybeMatch[0];
    } else {
      return false;
    }
  };

  /**
   * Match vault without using wsRoot
   * @param opts
   * @returns
   */
  static matchVaultV2 = (opts: { vault: DVault; vaults: DVault[] }) => {
    const { vault, vaults } = opts;
    const maybeMatch = _.filter(vaults, (v) => {
      return VaultUtils.isEqualV2(v, vault);
    });
    if (maybeMatch.length === 1) {
      return maybeMatch[0];
    } else {
      return false;
    }
  };

  /**
   * Vault path relative to root
   */
  static normVaultPath = (opts: { vault: DVault; wsRoot: string }) => {
    return path.isAbsolute(opts.vault.fsPath)
      ? path.relative(opts.wsRoot, VaultUtils.getRelPath(opts.vault))
      : VaultUtils.getRelPath(opts.vault);
  };

  /**
   * Get relative path to vault
   * @param opts
   * @returns
   */
  static normPathByWsRoot = (opts: { fsPath: string; wsRoot: string }) => {
    return path.relative(opts.wsRoot, opts.fsPath);
  };

  static toURIPrefix(vault: DVault) {
    return CONSTANTS.DENDRON_DELIMETER + VaultUtils.getName(vault);
  }

  static toWorkspaceFolder(vault: DVault): WorkspaceFolderRaw {
    const name = VaultUtils.getName(vault);
    const vaultPath = VaultUtils.getRelPath(vault);
    return {
      path: normalizeUnixPath(vaultPath),
      name:
        name === vaultPath || path.basename(vaultPath) === name
          ? undefined
          : name,
    };
  }

  static FILE_VAULT_PREFIX = "dir-";

  /** Creates a dummy vault for files that are not in Dendron workspace, for example a markdown file that's not in any vault. Do not use for notes. */
  static createForFile({
    filePath,
    wsRoot,
  }: {
    filePath: string;
    wsRoot: string;
  }): DVault {
    const normalizedPath = normalizeUnixPath(
      path.dirname(path.relative(wsRoot, filePath))
    );
    return {
      fsPath: normalizedPath,
      name: `${this.FILE_VAULT_PREFIX}${normalizeUnixPath}`,
    };
  }

  /** Returns true if the vault was created with {@link VaultUtils.createForFile} */
  static isFileVault(vault: DVault): boolean {
    return vault.name?.startsWith(this.FILE_VAULT_PREFIX) || false;
  }
}
