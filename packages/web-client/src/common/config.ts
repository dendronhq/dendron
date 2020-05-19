export const global = {};
export const dev = {
  COGNITO_POOL_ID: "us-west-2_X6icVFghe",
  COGNITO_CLIENT_ID: "19vkp969ss471e424pfh7trq33",
};
export const prod = { COGNITO_POOL_ID: "TODO", COGNITO_CLIENT_ID: "TODO" };
export const config = { global, dev, prod };
export type ConfigKey = keyof typeof dev;
