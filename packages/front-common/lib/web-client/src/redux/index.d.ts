export declare function setupStore(): import("@reduxjs/toolkit").EnhancedStore<{
    sampleReducer: import("./reducers/sampleReducer").SampleState;
    nodeReducer: import("./reducers/nodeReducer").NodeState;
    userReducer: import("./reducers/userReducer").UserState;
    loadingReducer: import("./reducers/loadingReducer").LoadingState;
}, import("redux").AnyAction, (import("redux").Middleware<{}, any, import("redux").Dispatch<import("redux").AnyAction>> | import("redux-thunk").ThunkMiddleware<any, import("redux").AnyAction, null> | import("redux-thunk").ThunkMiddleware<any, import("redux").AnyAction, undefined>)[]>;
