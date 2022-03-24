import { querystring } from "@dendronhq/common-frontend";
import _ from "lodash";
import { StageEnv } from "./types";

export function getStage() {
  return process.env.STAGE;
}

export function getEnv(key: keyof StageEnv): any {
  // NOTE: this only works server side, not client side
  const override = _.get(process.env, key);
  return override;
}

export const getWsAndUrl = () => {
  const { ws } = querystring.parse(window.location.search.slice(1)) as {
    ws: string;
  };
  return { url: `${window.location.protocol}//${window.location.host}`, ws };
};
