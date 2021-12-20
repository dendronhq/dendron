import { Uri } from "vscode";
import { DVault } from "@dendronhq/common-all";

export interface IVaultsResolver {
  getVaultFromUri(fileUri: Uri): DVault;
}
