import React, { useEffect, useState } from "react";
import { initGA, logPageView } from "../utils/analytics";
import { NoteData } from "../utils/types";
import { getStage } from "@dendronhq/common-all";
import { useEngineAppSelector } from "../features/engine/hooks";
import _ from "lodash";
import { useRouter } from 'next/router'

export default function DendronGATracking(
  props: React.PropsWithChildren<Partial<NoteData>>
) {
  const [initialized, setInitialized] = useState(false);
  const engine = useEngineAppSelector((state) => state.engine);
  const router = useRouter()

  

  useEffect(() => {
    const { config } = engine;
    if(!_.isUndefined(config)){
      const { ga_tracking } = config.site
      if (ga_tracking && !initialized && getStage() !== "dev") {
        initGA(ga_tracking);
        setInitialized(true);
      }
    }  
  }, [engine]);

  useEffect(() => {
  
    router.events.on('routeChangeComplete', () => logPageView())
    return () => {
      router.events.off('routeChangeComplete', () => logPageView())
    }
  }, [router.events])

  return <div>{props.children}</div>;
}
