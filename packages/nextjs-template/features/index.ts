import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { configureStore } from "@dendronhq/common-frontend";
import { browserEngineSlice } from "./engine";

const store = configureStore({
  reducer: {
    engine: browserEngineSlice.reducer,
  },
});

export { store as combinedStore };
export type CombinedRootState = ReturnType<typeof store.getState>;
export type CombinedDispatch = typeof store.dispatch;
export const useCombinedDispatch = () => useDispatch<CombinedDispatch>();
export const useCombinedSelector: TypedUseSelectorHook<CombinedRootState> =
  useSelector;
