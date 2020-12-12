import { removeMDExtension } from "@dendronhq/common-server";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { parseDendronRef } from "../../utils";

const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

const plugin: Plugin = function (this: Unified.Processor) {
  attachParser(this);
};

function attachParser(proc: Unified.Processor) {
  const permalinks: any[] = [];
  const aliasDivider = "|";

  function isAlias(pageTitle: string) {
    return pageTitle.indexOf(aliasDivider) !== -1;
  }
  const pageResolver = (name: string) => [name.replace(/ /g, "").toLowerCase()];

  function locator(value: string, fromIndex: number) {
    return value.indexOf("((", fromIndex);
  }

  function parsePageTitle(pageTitle: string) {
    if (isAlias(pageTitle)) {
      return parseAliasLink(pageTitle);
    }
    return {
      name: pageTitle,
      displayName: pageTitle,
    };
  }
  function parseAliasLink(pageTitle: string) {
    const [displayName, name] = pageTitle.split(aliasDivider);
    return { name, displayName };
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);

    if (match) {
      const pageName = match[1].trim();
      const { link } = parseDendronRef(pageName);
      const { name, displayName } = parsePageTitle(pageName);

      const pagePermalinks = pageResolver(name);
      let permalink = pagePermalinks.find((p) => permalinks.indexOf(p) !== -1);
      const exists = permalink !== undefined;

      if (!exists) {
        permalink = pagePermalinks[0];
      }

      let classNames = "internal";
      if (!exists) {
        classNames += " " + "new";
      }
      // normalize
      if (permalink) {
        permalink = removeMDExtension(permalink);
      }

      return eat(match[0])({
        type: "refLink",
        value: name,
        data: {
          alias: displayName,
          link,
          permalink,
          exists,
          hName: "a",
          hProperties: {
            className: classNames,
            href: permalink,
          },
          hChildren: [
            {
              type: "text",
              value: displayName,
            },
          ],
        },
      });
    }
    return;
  }

  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.refLink = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLink");
  return Parser;
}

export { plugin as noteRefs };
