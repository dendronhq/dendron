export const global: GlobalConfig = {};
export const test: StageConfig = {
  COGNITO_POOL_ID: "TODO",
  COGNITO_CLIENT_ID: "TODO",
  DENDRON_FS_ROOT: "TODO"
};
export const dev: StageConfig = {
  COGNITO_POOL_ID: "us-west-2_X6icVFghe",
  COGNITO_CLIENT_ID: "19vkp969ss471e424pfh7trq33",
  // TODO
  DENDRON_FS_ROOT: "/Users/kevinlin/Dropbox/Apps/Noah/notes-folders"
};
export const prod: StageConfig = {
  COGNITO_POOL_ID: "us-west-2_X6icVFghe",
  COGNITO_CLIENT_ID: "19vkp969ss471e424pfh7trq33",
  // TODO
  DENDRON_FS_ROOT: "/Users/kevinlin/Dropbox/Apps/Noah/notes-folders"
  // COGNITO_POOL_ID: "TODO",
  // COGNITO_CLIENT_ID: "TODO"
};
export const config = { global, test, dev, prod };

type GlobalConfig = {
  LOG_LEVEL?: string;
  LOG_NAME?: string;
  LOG_DST?: string;
};

type StageConfig = {
  COGNITO_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  DENDRON_FS_ROOT: string;
};
export type ConfigKey = keyof GlobalConfig | keyof StageConfig;
