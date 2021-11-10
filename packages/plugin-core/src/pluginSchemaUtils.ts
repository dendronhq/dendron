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

  public static getSchema(id: string) {
    return SchemaUtils.getSchema({
      id,
      engine: getDWorkspace().engine,
    });
  }
}
