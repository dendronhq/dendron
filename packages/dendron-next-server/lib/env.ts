import { querystring } from "@dendronhq/common-frontend";
import _ from "lodash";
import { StageEnv } from "./types";

export function getStage() {
  return process.env.STAGE
}

export function getEnv(key: keyof StageEnv): any {
    // NOTE: this only works server side, not client side
    const override = _.get(process.env, key)
    return override;
}


export const getWsAndPort = () => {
  const { port, ws } = querystring.parse(
      window.location.search.slice(1)
  ) as { port: string; ws: string };
  return {port: parseInt(port), ws}
}