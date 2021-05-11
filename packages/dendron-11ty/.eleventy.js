const _ = require("lodash");
const { GitUtils } = require("@dendronhq/common-server");
const path = require("path");
const shortcodes = require("./libs/shortcodes");
const markdown = require("./libs/remark");
const {
  getSiteOutputPath,
  getSiteConfig,
  NOTE_UTILS,
  getSiteUrl,
  getDendronConfig
} = require("./libs/utils");
const pluginSEO = require("@dendronhq/eleventy-plugin-seo");

module.exports = function (eleventyConfig) {
  const sconfig = getSiteConfig();

  // --- libraries
  eleventyConfig.addPlugin(markdown);
  eleventyConfig.addPlugin(pluginSEO, {
    ...sconfig,
    image: sconfig.logo ? `/` + path.basename(sconfig.logo) : undefined,
    url: getSiteUrl(),
    options: {
      imageWithBaseUrl: true,
    },
  });

  // --- tempaltes
  eleventyConfig.setTemplateFormats(["css", "liquid", "md"]);
  eleventyConfig.setLiquidOptions({
    dynamicPartials: false,
    strict_filters: true,
    root: ["_includes"],
    extname: ".liquid",
  });

  // --- filters
  eleventyConfig.addLiquidFilter("absolute_url", function (variable) {
    return NOTE_UTILS.getAbsUrlForAsset(variable);
  });

  eleventyConfig.addLiquidFilter("group_by", function (collection, groupByKey) {
    const gp = _.groupBy(collection, groupByKey);
    return _.map(gp, (v, k) => ({ name: k, items: v }));
  });
  eleventyConfig.addLiquidFilter("jsonfy", function (obj) {
    return JSON.stringify(obj, null, 4);
  });
  eleventyConfig.addLiquidFilter("sort", function (array, field) {
    return _.sortBy(array, field);
  });

  eleventyConfig.addLiquidFilter("gitShowLink", function (note) {
      const config = getDendronConfig();
      if (note) {
        return GitUtils.canShowGitLink({note, config})
      } else {
        return false;
      }
  });

  eleventyConfig.addLiquidFilter("where_exp", function (collection, expr) {
    // TODO
    //{%- assign ordered_pages_list = group.items |
    //where_exp:"item", "item.nav_order != nil" -%}
    //return _.groupBy(collection, groupByKey)
    return collection;
  });
  // dendron specific
  eleventyConfig.addLiquidFilter("noteURL", function (note) {
    return NOTE_UTILS.getUrl(note);
  });
  eleventyConfig.addLiquidFilter("noteIdsToNotes", function (noteIds, notes) {
    return noteIds.map((id) => notes[id]);
  });
  eleventyConfig.addLiquidFilter("urlToNote", function (url, notes) {
    const noteId = removeExtension(url.split("/").slice(-1)[0], ".html");
    if (url === "/") {
      const note = _.find(
        notes,
        (ent) => _.get(ent, "custom.permalink", "") === "/"
      );
      return note;
    }
    const note = _.get(notes, noteId, "");
    return note;
  });

  eleventyConfig.addLiquidFilter("noteParent", function (note, notes) {
    if (_.isNull(note.parent) || _.isUndefined(note.parent)) {
      return;
    } else {
      return notes[note.parent];
    }
  });

  eleventyConfig.addLiquidFilter("basename", function (url) {
    return path.basename(url);
  });
  eleventyConfig.addLiquidFilter("noteParents", function (note, notes) {
    const out = [];
    if (!note || _.isUndefined(note)) {
      return [];
    }
    while (note.parent !== null) {
      out.push(note);
      try {
        tmp = notes[note.parent];
        if (_.isUndefined(tmp)) {
          throw "note is undefined";
        }
        note = tmp;
      } catch (err) {
        console.log("issue with note", note.fname, note.id, note.parent);
        process.exit(1);
      }
    }
    out.push(note);
    let res = _.reverse(out)
      .map((ent) => ent.id)
      .join(",");
    return res;
  });

  // --- plugins
  eleventyConfig.addPlugin(shortcodes);
  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: getSiteOutputPath(),
    },
  };
};

function removeExtension(nodePath, ext) {
  const idx = nodePath.lastIndexOf(ext);
  if (idx > 0) {
    nodePath = nodePath.slice(0, idx);
  }
  return nodePath;
}
