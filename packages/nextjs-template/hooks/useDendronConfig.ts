import { useEngineAppSelector } from "../features/engine/hooks";

export const useDendronConfig = () => {
  const { config } = useEngineAppSelector((state) => state.engine);
  return config;
};
