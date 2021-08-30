import _ from "lodash";
import { RespV2 } from "../types";
import { DendronError } from "../error";

/** Utility for {@link RespV2} */
export class ResponseUtil {
  /** true when response has an error; false otherwise. */
  static hasError<T>(resp: RespV2<T>) {
    return !_.isNull(resp.error);
  }

  static createHappyResponse<T>(input: { data: T }): RespV2<T> {
    return {
      error: null,
      data: input.data,
    };
  }

  static createUnhappyResponse<T>(input: { error: DendronError }): RespV2<T> {
    return {
      error: input.error,
      data: undefined,
    };
  }
}
