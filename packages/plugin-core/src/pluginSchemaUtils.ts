import { SchemaUtils } from "@dendronhq/common-all";
import { ExtensionProvider } from "./ExtensionProvider";

/**
 * Wrapper around SchemaUtils which can fills out values available in the
 * plugin (primarily the engine)
 */
export class PluginSchemaUtils {
  public static doesSchemaExist(id: string) {
    const { engine } = ExtensionProvider.getDWorkspace();
    return SchemaUtils.doesSchemaExist({
      id,
      engine,
    });
  }

  public static async getSchema(id: string) {
    return ExtensionProvider.getEngine().getSchema(id);
  }
}
