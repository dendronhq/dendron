import { assertUnreachable } from "@dendronhq/common-all";
import { useEngineAppSelector } from "../features/engine/hooks";

export const useDendronConfig = () => {
  const { config } = useEngineAppSelector((state) => state.engine);
  if (!config) {
    assertUnreachable(undefined as never);
  }
  return config;
};
