import { DendronConfig } from "@dendronhq/common-all";
import { api } from "./config";

export const configWrite = (config: DendronConfig) => {
  const body = JSON.stringify({ config });
  return fetch(api("writeConfig"), {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "post",
    body,
  });
};
