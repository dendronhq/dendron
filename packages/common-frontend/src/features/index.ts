import { getStage } from "@dendronhq/common-all";
import { engineSlice } from "./engine/slice";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { ideSlice } from "./ide/slice";

export * from "./engine";
export * from "./ide";

const middleware = [...getDefaultMiddleware()];

if (getStage() === `dev`) {
  const { createLogger } = require(`redux-logger`);

  const logger = createLogger({
    collapsed: true,
  });

  middleware.push(logger);
}

const engine = engineSlice.reducer;
const ide = ideSlice.reducer;

const store = configureStore({
  reducer: {
    engine,
    ide,
  },
  middleware,
});

export { store as combinedStore };
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
export { RootState as CombinedRootState };
export { AppDispatch as CombinedDispatch };
