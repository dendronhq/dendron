/* eslint-disable react/no-danger */
import { ConfigUtils, IntermediateDendronConfig } from "@dendronhq/common-all";
import React from "react";
import { createLogger } from "../utils/logger";

type Props = {
  noteContent: string;
  config: IntermediateDendronConfig;
};

export const useMermaid = ({
  config,
  noteRenderedBody,
}: {
  config?: IntermediateDendronConfig;
  noteRenderedBody?: string;
}) => {
  React.useEffect(() => {
    const logger = createLogger("useMermaid");
    if (config && ConfigUtils.getProp(config, "mermaid")) {
      // @ts-ignore
      const mermaid = (window as any)._mermaid;
      logger.info("mermaid created");
      if (mermaid) {
        logger.info("mermaid initialized");
        mermaid.init();
      }
    } else {
      logger.info("mermaid not initialized");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, noteRenderedBody]);
};

export function DendronNote({ noteContent, config, ...rest }: Props) {
  useMermaid({ config, noteRenderedBody: noteContent });
  const logger = createLogger("DendronNote");
  logger.info({ ctx: "DendronNote", config });
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: noteContent }} {...rest} />
    </>
  );
}
