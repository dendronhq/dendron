const gulp = require("gulp");
const gulpless = require("gulp-less");
const postcss = require("gulp-postcss");
const debug = require("gulp-debug");
const csso = require("gulp-csso");
const autoprefixer = require("autoprefixer");
const NpmImportPlugin = require("less-plugin-npm-import");

export const convertLessFile = (
  lessFilePath: string,
  destinationPath: string
) => {
  return new Promise((resolve, reject) => {
    gulp.series(() => {
      const plugins = [autoprefixer()];
      gulp
        .src(lessFilePath)
        .pipe(debug({ title: "Less files:" }))
        .pipe(
          gulpless({
            javascriptEnabled: true,
            plugins: [new NpmImportPlugin({ prefix: "~" })],
          })
        )
        .pipe(postcss(plugins))
        .pipe(
          csso({
            debug: true,
          })
        )
        .pipe(gulp.dest(destinationPath))
        .on("end", resolve)
        .on("error", reject);
    })();
  });
};
