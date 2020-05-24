import { env } from "./common/env";
var AmplifyConfig = {
    Auth: {
        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        // identityPoolId: "XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab",
        // REQUIRED - Amazon Cognito Region
        region: "us-west-2",
        // OPTIONAL - Amazon Cognito Federated Identity Pool Region
        // Required only if it's different from Amazon Cognito Region
        // identityPoolRegion: "XX-XXXX-X",
        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: env("COGNITO_POOL_ID"),
        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: env("COGNITO_CLIENT_ID"),
    },
};
export default AmplifyConfig;
//# sourceMappingURL=aws-exports.js.map