const fs = require('fs-extra');
const path = require("path");
const { NOTE_UTILS, getSiteOutputPath, getSiteConfig } = require("../libs/utils");

async function buildSearch() {
  // Inside the function for async/await functionality.
  const {notes} = await require("../_data/notes.js")();

  const search_data = Object.values(notes).map((note, idx) => {
    const noteUrl = NOTE_UTILS.getUrl(note);
    const absUrl = NOTE_UTILS.getAbsUrl(noteUrl);

    return {
      doc: note.title,
      title: note.title,
      hpath: note.fname,
      content: note.body,
      url: absUrl,
      relUrl: noteUrl
    }
  })
  const searchDataPath = path.join(getSiteOutputPath(), "assets", "js", "search-data.json")
  fs.ensureDirSync(path.dirname(searchDataPath));
  fs.writeJSONSync(searchDataPath, search_data);
}

module.exports = { buildSearch }
