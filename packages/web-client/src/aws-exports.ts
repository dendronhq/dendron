import { env } from "./common/env";

const awsmobile = {
  aws_project_region: "us-west-2",
  aws_cognito_region: "us-west-2",
  aws_user_pools_id: env("COGNITO_POOL_ID"),
  aws_user_pools_web_client_id: env("COGNITO_CLIENT_ID"),
};

export default awsmobile;
