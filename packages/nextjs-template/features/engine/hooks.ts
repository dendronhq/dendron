import { AppDispatch, RootState } from "./store";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export const useEngineAppDispatch = () => useDispatch<AppDispatch>();
export const useEngineAppSelector: TypedUseSelectorHook<RootState> =
  useSelector;
