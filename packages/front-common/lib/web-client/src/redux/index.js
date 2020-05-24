var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { rootReducer } from "./reducers";
export function setupStore() {
    var middleware = __spreadArrays(getDefaultMiddleware());
    // TODO
    //   if (getStage() === "dev") {
    //     middleware.push(loggerMiddleware);
    //   }
    var store = configureStore({
        reducer: rootReducer,
        middleware: middleware,
    });
    return store;
}
//# sourceMappingURL=index.js.map