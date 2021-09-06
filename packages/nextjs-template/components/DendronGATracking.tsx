import React, { useEffect, useState } from "react";
import { initGA, logPageView } from "../utils/analytics";
import { getGaTracking } from "../utils/build";
import { NoteData } from "../utils/types";
import { getStage } from "@dendronhq/common-all";

export default function DendronGATracking(
  props: React.PropsWithChildren<Partial<NoteData>>
) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initGATracking() {
      const id = await getGaTracking();
      if (id && !initialized && getStage() !== "dev") {
        initGA(id);
        setInitialized(true);
      }
    }
    initGATracking();
    logPageView();
  }, []);

  return <div>{props.children}</div>;
}
