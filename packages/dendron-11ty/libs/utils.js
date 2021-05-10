const path = require("path");
const { createLogger, resolvePath } = require("@dendronhq/common-server");
// const env = require(path.join(__dirname, "..", "_data", "processEnv.js"));
const {
  EngineConnector,
  DConfig,
  SiteUtils,
} = require("@dendronhq/engine-server");
const fs = require("fs-extra");
const _ = require("lodash");

function removeExtension(nodePath, ext) {
  const idx = nodePath.lastIndexOf(ext);
  if (idx > 0) {
    nodePath = nodePath.slice(0, idx);
  }
  return nodePath;
}

const env = () => {
  const out = {
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
  return out;
}

/**
 * 
 * @param force: force engine initialization
 * @returns 
 */
const getEngine = async (force) => {
  const engineConnector = EngineConnector.getOrCreate({
    wsRoot: env().wsRoot,
  });
  if (!engineConnector.initialized || force) {
    await engineConnector.init({ portOverride: env().enginePort });
    const siteNotes = SiteUtils.addSiteOnlyNotes({
      engine: engineConnector.engine,
    });
    _.forEach(siteNotes, (ent) => {
      engineConnector.engine.notes[ent.id] = ent;
    });
  }
  const engine = engineConnector.engine;
  return engine;
};

const getDendronConfig = () => {
  const wsRoot = env().wsRoot;
  const config = DConfig.getOrCreate(wsRoot);
  config.site = DConfig.cleanSiteConfig(config.site);
  return config;
};

const getSiteConfig = () => {
  return getDendronConfig().site;
};

const getSiteUrl = () => {
  const siteUrl = process.env["SITE_URL"] || getSiteConfig().siteUrl
  return siteUrl;
}

const logger = () => {
  const logger = createLogger();
  return logger;
};

const getSiteOutputPath = () => {
  const wsRoot = env().wsRoot;
  const config = getDendronConfig();
  // custom override
  if (env().output) {
    return resolvePath(env().output, wsRoot);
  }
  if (env().stage === "dev") {
    siteRootPath = path.join(wsRoot, "build", "site");
    fs.ensureDirSync(siteRootPath);
  } else {
    siteRootPath = resolvePath(config.site.siteRootDir, wsRoot);
  }
  return siteRootPath;
};

const getNavOutput = () => {
  return path.join(getSiteOutputPath(), "nav.html");
};

const getCustomHeaderOutput = () => {
  return path.join(getSiteOutputPath(), "header.html");
};

const getMetaPath = () => {
  return path.join(getSiteOutputPath(), ".meta");
};

class NOTE_UTILS {
  static getUrl(note) {
    return _.get(
      note,
      "custom.permalink",
      `${path.join(getSiteConfig().siteNotesDir, note.id)}.html`
    );
  }

  static getAbsUrl(suffix) {
    return NOTE_UTILS.getAbsUrlForAsset(suffix)
  }

  static getAbsUrlForAsset(suffix) {
    suffix = suffix || "";
    const {assetsPrefix} = getSiteConfig();
    const siteUrl = getSiteUrl();
    let sitePrefix = _.trimEnd(siteUrl, "/");
    if (assetsPrefix) {
      sitePrefix = _.join([_.trimEnd(siteUrl, "/"), _.trim(assetsPrefix, "/")], "/")
    }
    if (siteUrl && env().stage !== "dev") {
      const out = _.trimEnd(
        _.join([sitePrefix, _.trim(suffix, "/")], "/"),
        "/"
      );
      return out;
    } else {
      return "http://" + path.posix.join(`localhost:${getSiteConfig().previewPort || 8080}`, suffix);
    }
  }

  static notes2Id(url, notes) {
    const noteId = removeExtension(url.split("/").slice(-1)[0], ".html");
    const note = _.get(notes, noteId, "");
    return note;
  }
}

module.exports = {
  getEngine,
  getSiteUrl,
  env,
  getDendronConfig,
  getSiteConfig,
  logger,
  resolvePath,
  getSiteOutputPath,
  NOTE_UTILS,
  getCustomHeaderOutput,
  getNavOutput,
  getMetaPath,
};
