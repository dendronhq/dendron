const AmazonCognitoIdentity = require("amazon-cognito-identity-js");

function getCurrentUser(UserPoolId, ClientId, domain) {
  domain = domain.replace(/^http[s]?:\/\//, "");
  const poolData = {
    UserPoolId,
    ClientId,
    Storage: new AmazonCognitoIdentity.CookieStorage({
      domain: `.${domain}`,
    }),
  };
  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  const cognitoUser = userPool.getCurrentUser();
  window.userPool = userPool;
  window.cognitoUser = cognitoUser;
  return cognitoUser;
}

function identifyUser(user) {
  if (!window.analytics.identify) {
    throw Error("no identify function found");
  }
  const analytics = window.analytics;
  const userId = user.username;
  analytics.identify(userId);
}

window.getCurrentUser = getCurrentUser;
window.identifyUser = identifyUser;

export { getCurrentUser, identifyUser };