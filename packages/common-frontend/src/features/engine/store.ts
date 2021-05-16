import { configureStore } from "@reduxjs/toolkit";
import engineReducer from "./slice";
const store = configureStore({
  reducer: {
    engine: engineReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
