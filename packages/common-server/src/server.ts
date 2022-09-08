import {
  error2PlainObject,
  RespV2,
  RespV3,
  RespWithOptError,
  StatusCodes,
} from "@dendronhq/common-all";
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
    dendronResponse: RespV3<any> | RespWithOptError<any>
  ): void {
    if (dendronResponse.error) {
      // TODO: Don't set a status code of 500 by default.  The default for
      // expected error (as is the case for all handled errors here) should be
      // 400 BAD_REQUEST. All 500 Internal Errors are handled by default express
      // error handler (see appModule in Server.ts)
      expressResponse
        .status(dendronResponse.error.code || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error2PlainObject(dendronResponse.error) });
    } else {
      expressResponse.json(dendronResponse);
    }
  }
}
