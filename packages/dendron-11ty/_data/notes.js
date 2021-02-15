const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const { SiteUtils } = require("@dendronhq/engine-server");
const { env, getEngine, getDendronConfig } = require(path.join(
  __dirname,
  "..",
  "libs",
  "utils.js"
));

let NOTES_CACHE = {};

async function getNotes() {
  if (!_.isEmpty(NOTES_CACHE)) {
    return NOTES_CACHE;
  }
  if (env().proto) {
    const notes = fs.readJSONSync(path.join(__dirname, "notes-proto.json"));
    return notes;
  }
  const engine = await getEngine();
  const config = getDendronConfig();
  let { notes, domains } = await SiteUtils.filterByConfig({
    engine,
    config: config,
  });
  const siteNotes = SiteUtils.addSiteOnlyNotes({
    engine,
  });
  _.forEach(siteNotes, (ent) => {
    notes[ent.id] = ent;
  });

  // // TODO
  if (env().logLvl === "debug") {
    fs.writeJSONSync(path.join("/tmp/", "notes.log"), notes, { spaces: 4 });
  }
  const noteIndex = _.find(domains, ent => ent.custom.permalink === "/");
  if (!noteIndex) {
    throw Error("no site index found");
  }
  NOTES_CACHE = { notes, domains, noteIndex };
  return NOTES_CACHE;
}

module.exports = async function () {
  return getNotes();
};
