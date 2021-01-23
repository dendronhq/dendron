
// export type StageEnv = {
//   ENGINE_ENDPOINT_PORT?: number;
// };

export enum CONFIG_KEY {
  ENGINE_ENDPOINT_PORT = "ENGINE_ENDPOINT_PORT",
  REMOTE_API_ENDPOINT = "REMOTE_API_ENDPOINT",
}

export type StageEnv = typeof CONFIG_KEY;