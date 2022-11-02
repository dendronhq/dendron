import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { other, DendronError } from "./error";
import { RespV3 } from "./types";

export class ResultUtils {
  static PromiseRespV3ToResultAsync<T>(p: Promise<RespV3<T>>) {
    return ResultAsync.fromPromise(p, (innerError) =>
      other(
        "PromiseRespV3ToResultAsync",
        new DendronError({
          message: "PromiseRespV3ToResultAsync",
          ...(innerError instanceof Error ? { innerError } : undefined),
        })
      )
    ).andThen((resp) => {
      if (resp.error) {
        return errAsync(other("PromiseRespV3ToResultAsync", resp.error));
      }
      return okAsync(resp.data);
    });
  }
}
