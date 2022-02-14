import { useEffect, useState } from "react";
import { initGA, logPageView } from "../utils/analytics";
import { ConfigUtils, getStage } from "@dendronhq/common-all";
import { useEngineAppSelector } from "../features/engine/hooks";
import _ from "lodash";
import { useRouter } from "next/router";
import { createLogger } from "@dendronhq/common-frontend";

export enum GAType {
  UNIVERSAL_ANALYTICS = "UNIVERSAL_ANALYTICS",
  G4A = "G4A",
  NONE = "NONE",
}

const getGAType = (id: string) => {
  if (id.startsWith("UA")) {
    return GAType.UNIVERSAL_ANALYTICS;
  }
  return GAType.G4A;
};

export const useDendronGATracking = () => {
  const [gaType, setGAType] = useState<GAType>(GAType.NONE);
  const engine = useEngineAppSelector((state) => state.engine);
  const router = useRouter();
  useEffect(() => {
    const { config } = engine;
    const logger = createLogger("gaTracking");
    if (!_.isUndefined(config)) {
      const gaTracking = ConfigUtils.getGATracking(config);
      if (gaTracking && gaType === GAType.NONE && getStage() !== "dev") {
        const newGaType = getGAType(gaTracking);
        initGA(gaTracking, newGaType);
        setGAType(newGaType);
        logger.info({ msg: "initialize ga", newGaType });
      }
    }
  }, [engine]);

  useEffect(() => {
    router.events.on("routeChangeComplete", () => logPageView(gaType));
    return () => {
      router.events.off("routeChangeComplete", () => logPageView(gaType));
    };
  }, [router.events]);
};

export default useDendronGATracking;
