import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";

import { rootReducer } from "./reducers";

export function setupStore() {
  const middleware = [...getDefaultMiddleware()];
  // TODO
  //   if (getStage() === "dev") {
  //     middleware.push(loggerMiddleware);
  //   }
  const store = configureStore({
    reducer: rootReducer,
    middleware,
  });
  return store;
}
