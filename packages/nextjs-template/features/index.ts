import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
  configureStore,
  ideSlice,
} from "@dendronhq/common-frontend";
import { browserEngineSlice } from "./engine";

const store = configureStore({
  reducer: {
    engine: browserEngineSlice.reducer,
    ide: ideSlice.reducer,
  },
});

export { store as combinedStore };
export type CombinedRootState = ReturnType<typeof store.getState>;
export type CombinedDispatch = typeof store.dispatch;
export const useCombinedDispatch = () => useDispatch<CombinedDispatch>();
export const useCombinedSelector: TypedUseSelectorHook<CombinedRootState> =
  useSelector;
