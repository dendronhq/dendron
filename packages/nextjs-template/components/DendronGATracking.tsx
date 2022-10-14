import { ConfigUtils, getStage } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-frontend";
import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import { GAType, initGA, logPageView } from "../utils/analytics";

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
