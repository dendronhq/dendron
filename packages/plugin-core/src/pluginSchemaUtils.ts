import { SchemaUtils } from "@dendronhq/common-all";
import { getDWorkspace } from "./workspace";

/**
 * Wrapper around SchemaUtils which can fills out values available in the
 * plugin (primarily the engine)
 */
export class PluginSchemaUtils {
  public static doesSchemaExist(id: string) {
    return SchemaUtils.doesSchemaExist({
      id,
      engine: getDWorkspace().engine,
    });
  }

  public static async getSchema(id: string) {
    return getDWorkspace().engine.getSchema(id);
  }
}
