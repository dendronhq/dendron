import "./App.css";
import React from "react";
declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    sampleReducer: import("./redux/reducers/sampleReducer").SampleState;
    nodeReducer: import("./redux/reducers/nodeReducer").NodeState;
    userReducer: import("./redux/reducers/userReducer").UserState;
    loadingReducer: import("./redux/reducers/loadingReducer").LoadingState;
}, import("redux").AnyAction, (import("redux").Middleware<{}, any, import("redux").Dispatch<import("redux").AnyAction>> | import("redux-thunk").ThunkMiddleware<any, import("redux").AnyAction, null> | import("redux-thunk").ThunkMiddleware<any, import("redux").AnyAction, undefined>)[]>;
export declare type AppDispatch = typeof store.dispatch;
declare const _default: React.FunctionComponent<{}>;
export default _default;
