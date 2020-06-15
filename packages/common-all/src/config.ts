export const global: GlobalConfig = {};
export const test: StageConfig = {
  COGNITO_POOL_ID: "TODO",
  COGNITO_CLIENT_ID: "TODO"
};
export const dev: StageConfig = {
  COGNITO_POOL_ID: "us-west-2_X6icVFghe",
  COGNITO_CLIENT_ID: "19vkp969ss471e424pfh7trq33"
};
export const prod: StageConfig = {
  COGNITO_POOL_ID: "us-west-2_X6icVFghe",
  COGNITO_CLIENT_ID: "19vkp969ss471e424pfh7trq33"
  // COGNITO_POOL_ID: "TODO",
  // COGNITO_CLIENT_ID: "TODO"
};
export const config = { global, test, dev, prod };

type GlobalConfig = {
  LOG_LEVEL?: string;
  LOG_NAME?: string;
};

type StageConfig = {
  COGNITO_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
};
export type ConfigKey = keyof GlobalConfig | keyof StageConfig;
