import {
  DendronError,
  DEngineClient,
  DVault,
  NoteProps,
  RespV3,
  SchemaTemplate,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { WSUtilsV2 } from "../WSUtilsV2";
import { parseRef } from "./md";

export class LookupUtils {
  /**
   * Find corresponding note for given schema template. Supports cross-vault lookup.
   *
   * @param schemaTemplate
   */
  static async getNoteForSchemaTemplate({
    engine,
    schemaTemplate,
  }: {
    engine: DEngineClient;
    schemaTemplate: SchemaTemplate;
  }): Promise<RespV3<NoteProps | undefined>> {
    let maybeVault: DVault | undefined;
    const { ref, vaultName } = parseRef(schemaTemplate.id);

    // If vault is specified, lookup by template id + vault
    if (!_.isUndefined(vaultName)) {
      maybeVault = VaultUtils.getVaultByName({
        vname: vaultName,
        vaults: engine.vaults,
      });
      // If vault is not found, skip lookup through rest of notes and return error
      if (_.isUndefined(maybeVault)) {
        return {
          error: new DendronError({
            message: `No vault found for ${vaultName}`,
          }),
        };
      }
    }

    if (!_.isUndefined(ref)) {
      return WSUtilsV2.instance().findNoteFromMultiVaultAsync({
        fname: ref,
        quickpickTitle:
          "Select which template to apply or press [ESC] to not apply a template",
        nonStubOnly: true,
        vault: maybeVault,
      });
    } else {
      return {
        data: undefined,
      };
    }
  }
}
