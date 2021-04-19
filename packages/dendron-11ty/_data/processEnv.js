module.exports = {
  wsRoot: process.env.WS_ROOT,
  enginePort: process.env.ENGINE_PORT,
  proto: process.env.PROTO,
  stage: process.env.BUILD_STAGE || process.env.STAGE || "dev",
  /**
   * Override output of config.yml
   */
  output: process.env.OUTPUT,
  logLvl: process.env.LOG_LEVEL
};
