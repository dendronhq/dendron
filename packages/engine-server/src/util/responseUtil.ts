import { RespV2 } from "@dendronhq/common-all";
import _ from "lodash";

/** Utility for {@link RespV2} */
export class ResponseUtil {
  /** true when response has an error; false otherwise. */
  static hasError<T>(resp: RespV2<T>) {
    return !_.isNull(resp.error);
  }
}
