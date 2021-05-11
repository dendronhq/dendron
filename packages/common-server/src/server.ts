import { error2PlainObject, RespV2 } from "@dendronhq/common-all";
import { Response } from "express";

export class ExpressUtils {
  /**
   * Utility to handle errors from Express
   * @param expressResponse : Response object form express
   * @param dendronResponse : Response from Dendron
   * @returns True if error was handled, false if no error
   */
  static handleError(expressResponse: Response, dendronResponse: RespV2<any>) {
    if (dendronResponse.error) {
      expressResponse
        .status(dendronResponse.error.code || 500)
        .json({ error: error2PlainObject(dendronResponse.error) });
      return true;
    }
    return false;
  }
}
