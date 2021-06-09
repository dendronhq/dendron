const sass = require('sass');
const fs = require('fs-extra');
const util = require('util');
const {getSiteOutputPath} = require("../libs/utils");
const path = require("path");


const buildSass = async function () {
  const inputFile = path.join(getSiteOutputPath(), "raw-assets", "sass", "just-the-docs-default.scss")
  const outputFile = path.join(getSiteOutputPath(), "assets", "css", "just-the-docs-default.css")
  const isProduction = process.env.ELEVENTY_ENV;
  const {css} = sass.renderSync({
    file: inputFile,
    includePaths: [
      'node_modules/foundation-sites/scss/',
      'node_modules/slick-carousel/slick/',
      'node_modules/hamburgers/_sass/hamburgers',
      'node_modules/prismjs/themes',
    ],
    outputStyle: isProduction ? 'compressed' : 'expanded',
  })
  // This is a hint to know if this is a first run, in which case
  // we don't need to tell browserSync to update.
  const fileExisted = await fs.pathExists(outputFile);

  try {
    console.log("build style...", outputFile);
    await fs.ensureFile(outputFile);
    await fs.writeFile(outputFile, css);
    const inputBase = path.join(getSiteOutputPath(), "raw-assets", "css");
    const outputBase = path.join(getSiteOutputPath(), "assets", "css");
    ["jquery.feedback_me", "jquery.thumbs"].forEach( ent => {
      console.log("copy ", ent);
      fs.copyFileSync(path.join(inputBase, `${ent}.css.txt`), path.join(outputBase, `${ent}.css`));
    });
  } catch (error) {
    console.error(`Error writing generated CSS: ${error}`);
  }
};

module.exports = { buildStyles: buildSass }
