import _ from "lodash";
import { RespV2 } from "../types";

/** Utility for {@link RespV2} */
export class ResponseUtil {
  /** true when response has an error; false otherwise. */
  static hasError<T>(resp: RespV2<T>) {
    return !_.isNull(resp.error);
  }
}
