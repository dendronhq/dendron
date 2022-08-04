import { useContext } from "react";
import { dendronContext } from "./DendronProvider";

export function useDendronContext() {
  const context = useContext(dendronContext);

  return context;
}
