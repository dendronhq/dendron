import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./store";

export const useIDEAppDispatch = () => useDispatch<AppDispatch>();
export const useIDEAppSelector: TypedUseSelectorHook<RootState> = useSelector;
