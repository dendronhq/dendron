import _ from "lodash";
import { EngineState } from "./slice";

export class EngineSliceUtils {
  static hasInitialized(engine: EngineState) {
    return (
      engine.loading === "idle" &&
      !_.isUndefined(engine.notes) &&
      !_.isUndefined(engine.vaults)
    );
  }
}
