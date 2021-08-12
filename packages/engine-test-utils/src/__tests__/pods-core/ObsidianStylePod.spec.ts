import _ from "lodash";
import path from "path";
import fs, { ensureDirSync } from "fs-extra";
import { runEngineTestV5, WorkspaceOpts } from "../../engine";
import { ObsidianStyleImportPod } from "@dendronhq/pods-core";
import css from "css";
import { assert } from "../../../../common-all/lib";

const obsidianCSS = `.graph-view.color-fill {
	color: red;
	opacity: 0.5;
}

/* .graph-view.color-fill-tag {
	color: red;
} */

/* .graph-view.color-fill-attachment {
	color: red;
} */

/* .graph-view.color-arrow {
	color: red;
} */

.graph-view.color-circle {
	color: maroon;
}

.graph-view.color-line {
	color: blue;
	opacity: 0.6;
}

.graph-view.color-text {
	color: aqua;
	opacity: 0.7;
}

.graph-view.color-fill-highlight {
	color: purple;
	opacity: 0.8;
}

.unrelated-class {
	color: blue;
}

/* .graph-view.color-line-highlight {
	color: red;
} */

/* .graph-view.color-fill-unresolved {
	color: red;
} */`;

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot } = opts;

  ensureDirSync(wsRoot);
  fs.writeFileSync(path.join(wsRoot, "obsidian.css"), obsidianCSS);
};

const checkForParsedRule = (
  styles: css.Stylesheet,
  selector: string,
  property: string
) => {
  return !!styles.stylesheet?.rules.find((rule: css.Rule) => {
    if (rule.type === "comment") return false;
    if (!rule.selectors || !rule.selectors.includes(selector)) return false;
    if (
      !rule.declarations ||
      rule.declarations.filter((declaration: css.Declaration) => {
        if (declaration.type === "comment") return false;
        if (declaration.property !== property) return false;
        return true;
      }).length === 0
    )
      return false;
    return true;
  });
};

describe("obsidian import pod", () => {
  test("all supported properties", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new ObsidianStyleImportPod();
        engine.config.useFMTitle = true;

        const src = path.join(wsRoot, "obsidian.css");

        // Couldn't figure out the best way to add "dest" to the pod return type, so this is a workaround
        // @ts-ignore
        const { errors, dest } = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src,
            vaultName: "vault1",
          },
        });

        assert(!errors || errors.length === 0, "Pod execution errors found");

        // check contents of graphviz file
        const dendronStyleFile = fs.readFileSync(dest, {
          encoding: "utf8",
        });

        const styles = css.parse(dendronStyleFile);
        assert(
          !!styles.stylesheet?.rules,
          "Stylesheet parsed incorrectly or has no rules"
        );

        const getParsedRuleError = (selector: string, property: string) =>
          `"${selector}" property "${property}" was not found in parsed stylesheet.`;

        // Check for all currently supported rules
        // .graph-view.color-fill
        assert(
          checkForParsedRule(styles, "node", "background-color"),
          getParsedRuleError(".graph-view.color-fill", "color")
        );
        assert(
          checkForParsedRule(styles, "node", "background-opacity"),
          getParsedRuleError(".graph-view.color-fill", "opacity")
        );

        // .graph-view.color-circle
        assert(
          checkForParsedRule(styles, "node", "border-color"),
          getParsedRuleError(".graph-view.color-circle", "color")
        );

        // .graph-view.color-line
        assert(
          checkForParsedRule(styles, "edge", "line-color"),
          getParsedRuleError(".graph-view.color-line", "color")
        );
        assert(
          checkForParsedRule(styles, "edge", "line-opacity"),
          getParsedRuleError(".graph-view.color-line", "opacity")
        );

        // .graph-view.color-text
        assert(
          checkForParsedRule(styles, "node", "color"),
          getParsedRuleError(".graph-view.color-text", "color")
        );
        assert(
          checkForParsedRule(styles, "node", "text-opacity"),
          getParsedRuleError(".graph-view.color-text", "opacity")
        );

        // .graph-view.color-fill-highlight
        assert(
          checkForParsedRule(styles, "node:selected", "background-color"),
          getParsedRuleError(".graph-view.color-fill-highlight", "color")
        );
        assert(
          checkForParsedRule(styles, "node:selected", "background-opacity"),
          getParsedRuleError(".graph-view.color-fill-highlight", "opacity")
        );

        // check that non-existent rule doesn't exist as test
        assert(
          !checkForParsedRule(styles, "node", "fake-declaration"),
          "Fake selector and declaration finding succeeded when it shouldn't have"
        );
      },
      { expect, preSetupHook: setupBasic }
    );
  });
});
