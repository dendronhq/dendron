import { error2PlainObject, RespV2, StatusCodes } from "@dendronhq/common-all";
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
        .status(dendronResponse.error.code || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error2PlainObject(dendronResponse.error) });
      return true;
    }
    return false;
  }

  /**
   * Set a standard response format to express rest clients based on RespV2
   * @param expressResponse
   * @param dendronResponse
   */
  static setResponse(
    expressResponse: Response,
    dendronResponse: RespV2<any>
  ): void {
    if (dendronResponse.error) {
      expressResponse
        .status(dendronResponse.error.code || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error2PlainObject(dendronResponse.error) });
    } else {
      expressResponse.json(dendronResponse);
    }
  }
}
