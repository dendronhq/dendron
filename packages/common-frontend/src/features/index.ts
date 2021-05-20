import { engineSlice } from "./engine/slice";
import { configureStore } from "@reduxjs/toolkit";
import { ideSlice } from "./ide/slice";

export * from "./engine";
export * from "./ide";

const engine = engineSlice.reducer;
const ide = ideSlice.reducer;

const store = configureStore({
  reducer: {
    engine,
    ide,
  },
});

export { store as combinedStore };
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
export { RootState as CombinedRootState };
export { AppDispatch as CombinedDispatch };
