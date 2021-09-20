import { useEffect, useState } from "react";
import { initGA, logPageView } from "../utils/analytics";
import { getStage } from "@dendronhq/common-all";
import { useEngineAppSelector } from "../features/engine/hooks";
import _ from "lodash";
import { useRouter } from "next/router";

export const useDendronGATracking = () => {
  const [initialized, setInitialized] = useState(false);
  const engine = useEngineAppSelector((state) => state.engine);
  const router = useRouter();
  useEffect(() => {
    const { config } = engine;
    if (!_.isUndefined(config)) {
      const { ga_tracking: gaTracking } = config.site;
      if (gaTracking && !initialized && getStage() !== "dev") {
        initGA(gaTracking);
        setInitialized(true);
      }
    }
  }, [engine]);

  useEffect(() => {
    router.events.on("routeChangeComplete", () => logPageView());
    return () => {
      router.events.off("routeChangeComplete", () => logPageView());
    };
  }, [router.events]);
};

export default useDendronGATracking;
