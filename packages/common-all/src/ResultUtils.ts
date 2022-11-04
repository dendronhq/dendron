import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { DendronError } from ".";
import { RespV3 } from "./types";

export class ResultUtils {
  static PromiseRespV3ToResultAsync<T>(p: Promise<RespV3<T>>) {
    return ResultAsync.fromPromise(p, (err) => err as DendronError).andThen(
      (resp) => {
        if (resp.error) {
          return errAsync(resp.error as DendronError);
        }
        return okAsync(resp.data);
      }
    );
  }
}
