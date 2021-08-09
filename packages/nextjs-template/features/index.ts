import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { configureStore } from "@dendronhq/common-frontend";
import { pageStateSlice } from "./pageState";
const store = configureStore({
  reducer: {
    pageState: pageStateSlice.reducer,
  },
});

export { store as combinedStore };
export type CombinedRootState = ReturnType<typeof store.getState>;
export type CombinedDispatch = typeof store.dispatch;
export const useCombinedDispatch = () => useDispatch<CombinedDispatch>();
export const useCombinedSelector: TypedUseSelectorHook<CombinedRootState> =
  useSelector;
