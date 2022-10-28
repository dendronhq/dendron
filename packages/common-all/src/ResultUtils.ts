import { ResultAsync } from "neverthrow";
import { DendronError } from "./error";
import { RespV3 } from "./types";

export class ResultUtils {
  static PromiseRespV3ToResultAsync<T>(p: Promise<RespV3<T>>) {
    return ResultAsync.fromPromise(
      Promise.resolve(
        p.then((resp) => {
          if (resp.error) {
            throw resp.error;
          }
          return resp.data;
        })
      ),
      (err) => err as DendronError
    );
  }
}
