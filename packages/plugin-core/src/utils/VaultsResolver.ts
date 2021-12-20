import { IDendronExtension } from "../dendronExtensionInterface";
import { Uri } from "vscode";
import { VaultUtils } from "@dendronhq/common-all";
import { IVaultsResolver } from "./VaultsResolverInterface";

export class VaultsResolver implements IVaultsResolver {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  getVaultFromUri(fileUri: Uri) {
    const workspace = this.extension.getDWorkspace();
    const { vaults } = workspace;
    const vault = VaultUtils.getVaultByFilePath({
      fsPath: fileUri.fsPath,
      vaults,
      wsRoot: workspace.wsRoot,
    });

    return vault;
  }
}
