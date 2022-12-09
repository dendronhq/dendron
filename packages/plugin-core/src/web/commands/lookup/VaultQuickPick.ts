import { DVault, type ReducedDEngine, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { VaultSelectionMode } from "../../../components/lookup/types";
import { VaultPickerItem } from "../../../components/lookup/utils";
import * as vscode from "vscode";

export class VaultQuickPick {
  private CONTEXT_DETAIL = "current note context";
  private HIERARCHY_MATCH_DETAIL = "hierarchy match";
  private FULL_MATCH_DETAIL = "hierarchy match and current note context";

  private _engine: ReducedDEngine;
  constructor(engine: ReducedDEngine) {
    this._engine = engine;
  }

  public async getOrPromptVaultForNewNote({
    vault,
    fname,
    vaults,
    vaultSelectionMode = VaultSelectionMode.smart,
  }: {
    vault: DVault;
    fname: string;
    vaults: DVault[];
    vaultSelectionMode?: VaultSelectionMode;
  }): Promise<DVault | undefined> {
    const vaultSuggestions = await this.getVaultRecommendations({
      vault,
      vaults,
      fname,
    });

    if (
      vaultSuggestions?.length === 1 ||
      vaultSelectionMode === VaultSelectionMode.auto
    ) {
      return vaultSuggestions[0].vault;
    }

    // Auto select for the user if either the hierarchy pattern matches in the
    // current vault context, or if there are no hierarchy matches
    if (vaultSelectionMode === VaultSelectionMode.smart) {
      if (
        vaultSuggestions[0].detail === this.FULL_MATCH_DETAIL ||
        vaultSuggestions[0].detail === this.CONTEXT_DETAIL
      ) {
        return vaultSuggestions[0].vault;
      }
    }

    return this.promptVault(vaultSuggestions);
  }

  /**
   * Determine which vault(s) are the most appropriate to create this note in.
   * Vaults determined as better matches appear earlier in the returned array
   * @param
   * @returns
   */
  async getVaultRecommendations({
    vault,
    vaults,
    fname,
  }: {
    vault: DVault;
    vaults: DVault[];
    fname: string;
  }): Promise<VaultPickerItem[]> {
    let vaultSuggestions: VaultPickerItem[] = [];

    // Only 1 vault, no other options to choose from:
    if (vaults.length <= 1) {
      return Array.of({ vault: vaults[0], label: VaultUtils.getName(vault) });
    }

    const domain = fname.split(".").slice(0, -1);
    const newQs = domain.join(".");
    const queryResponse = await this._engine.queryNotesMeta({
      qs: newQs,
      originalQS: newQs,
    });

    // Sort Alphabetically by the Path Name
    const sortByPathNameFn = (a: DVault, b: DVault) => {
      return a.fsPath <= b.fsPath ? -1 : 1;
    };
    let allVaults = vaults.sort(sortByPathNameFn);

    const vaultsWithMatchingHierarchy: VaultPickerItem[] | undefined =
      queryResponse
        .filter((value) => value.fname === newQs)
        .map((value) => value.vault)
        .sort(sortByPathNameFn)
        .map((value) => {
          return {
            vault: value,
            detail: this.HIERARCHY_MATCH_DETAIL,
            label: VaultUtils.getName(value),
          };
        });

    if (!vaultsWithMatchingHierarchy) {
      // Suggest current vault context as top suggestion
      vaultSuggestions.push({
        vault,
        detail: this.CONTEXT_DETAIL,
        label: VaultUtils.getName(vault),
      });

      allVaults.forEach((cmpVault) => {
        if (cmpVault !== vault) {
          vaultSuggestions.push({
            vault: cmpVault,
            label: VaultUtils.getName(vault),
          });
        }
      });
    }
    // One of the vaults with a matching hierarchy is also the current note context:
    else if (
      vaultsWithMatchingHierarchy.find(
        (value) => value.vault.fsPath === vault.fsPath
      ) !== undefined
    ) {
      // Prompt with matching hierarchies & current context, THEN other matching contexts; THEN any other vaults
      vaultSuggestions.push({
        vault,
        detail: this.FULL_MATCH_DETAIL,
        label: VaultUtils.getName(vault),
      });

      // remove from allVaults the one we already pushed.
      allVaults = _.filter(allVaults, (v) => {
        return !_.isEqual(v, vault);
      });
      vaultsWithMatchingHierarchy.forEach((ent) => {
        if (
          !vaultSuggestions.find(
            (suggestion) => suggestion.vault.fsPath === ent.vault.fsPath
          )
        ) {
          vaultSuggestions.push({
            vault: ent.vault,
            detail: this.HIERARCHY_MATCH_DETAIL,
            label: VaultUtils.getName(ent.vault),
          });
          // remove from allVaults the one we already pushed.
          allVaults = _.filter(allVaults, (v) => {
            return !_.isEqual(v, ent.vault);
          });
        }
      });

      // push the rest of the vaults
      allVaults.forEach((wsVault) => {
        vaultSuggestions.push({
          vault: wsVault,
          label: VaultUtils.getName(wsVault),
        });
      });
    } else {
      // Suggest vaults with matching hierarchy, THEN current note context, THEN any other vaults
      vaultSuggestions = vaultSuggestions.concat(vaultsWithMatchingHierarchy);
      vaultSuggestions.push({
        vault,
        detail: this.CONTEXT_DETAIL,
        label: VaultUtils.getName(vault),
      });

      allVaults = _.filter(allVaults, (v) => {
        return !_.isEqual(v, vault);
      });
      allVaults.forEach((wsVault) => {
        vaultSuggestions.push({
          vault: wsVault,
          label: VaultUtils.getName(wsVault),
        });
      });
    }
    // Filter out any vaults where a note with that fname already exists.
    const vaultsWithMatchingFile = new Set(
      (await this._engine.findNotesMeta({ fname })).map((n) => n.vault.fsPath)
    );
    if (vaultsWithMatchingFile.size > 0) {
      // Available vaults are vaults that do not have the desired file name.
      vaultSuggestions = vaultSuggestions.filter(
        (v) => !vaultsWithMatchingFile.has(v.vault.fsPath)
      );
    }

    return vaultSuggestions;
  }

  async promptVault(
    pickerItems: VaultPickerItem[]
  ): Promise<DVault | undefined> {
    const items = pickerItems.map((ent) => ({
      ...ent,
      label: ent.label ? ent.label : ent.vault.fsPath,
    }));
    const resp = await vscode.window.showQuickPick(items, {
      title: "Select Vault",
    });

    return resp ? resp.vault : undefined;
  }
}
