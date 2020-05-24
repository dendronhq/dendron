import { config } from "./config";
import _ from "lodash";
export function getStage() {
    // CRA overrides NODE_ENV to be dev by default
    var _a = process.env, stage = _a.stage, NODE_ENV = _a.NODE_ENV, STAGE = _a.STAGE, REACT_APP_STAGE = _a.REACT_APP_STAGE;
    var stageOut = REACT_APP_STAGE || stage || STAGE || NODE_ENV;
    // TODO
    if (stageOut === "development") {
        stageOut = "dev";
    }
    if (stageOut === "production") {
        stageOut = "prod";
    }
    return stageOut;
}
export function getOrThrow(obj, k) {
    var maybeValue = obj[k];
    if (_.isUndefined(maybeValue)) {
        throw "no " + k + " in " + obj;
    }
    return maybeValue;
}
export function env(name) {
    var stage = getStage();
    var val = getOrThrow(config[stage], name);
    var override = process.env[name];
    return override || val;
}
//# sourceMappingURL=env.js.map