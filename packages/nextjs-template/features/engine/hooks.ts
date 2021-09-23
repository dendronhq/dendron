import { AppDispatch, RootState } from "./store";
import { TypedUseSelectorHook, useDispatch, useSelector } from "@dendronhq/common-frontend";

export const useEngineAppDispatch = () => useDispatch<AppDispatch>();
export const useEngineAppSelector: TypedUseSelectorHook<RootState> =
  useSelector;
