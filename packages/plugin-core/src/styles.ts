import path from "path";
import os from "os";
import fs from "fs-extra";
import { Uri } from "vscode";
import { VSCodeUtils } from "./utils";

// TODO: If you'd like to target a specific theme, pre-pend each class with either ".theme-dark" or ".theme-light"

const STYLES_TEMPLATE = `/*
Add Dendron graph styles below. The graph can be styled in two ways:

1. Cytoscape.js style: https://js.cytoscape.org/#cy.style
2. [WIP] Obsidian.md style: https://help.obsidian.md/Plugins/Graph+view#Custom+CSS

More detailed styling documentation can be found at:
[LINK HERE]
*/

/* Any graph node */
/* node {} */

/* Any graph edge */
/* edge {} */

/* Any selected node */
/* :selected {} */

/* Any parent nodes (local note graph only) */
/* .parent {} */

/* Any link connection edge */
/* .links {} */

/* Any hierarchy connection edge */
/* .hierarchy {} */
`
/*
Obsidian.md style
.graph-view.color-fill {}
.graph-view.color-fill-highlight {}
.graph-view.color-arrow {}
.graph-view.color-circle {}
.graph-view.color-line {}
.graph-view.color-text {}
*/
/* .graph-view.color-fill-tag {} */
/* .graph-view.color-fill-attachment {} */
/* .graph-view.color-line-highlight {} */
/* .graph-view.color-fill-unresolved {} */

export class GraphStyleService {
  static styleFilePath() {
    return path.join(os.homedir(), ".dendron", "styles.css");
  }

  static doesStyleFileExist() {
    return fs.pathExistsSync(this.styleFilePath())
  }

  static createStyleFile() {
    fs.ensureFileSync(this.styleFilePath());
    fs.writeFileSync(this.styleFilePath(), STYLES_TEMPLATE);
  }

  static async openStyleFile() {
    const uri = Uri.file(this.styleFilePath());
    await VSCodeUtils.openFileInEditor(uri);
  }

  static readStyleFile() {
    if (this.doesStyleFileExist()) {
      return fs.readFileSync(this.styleFilePath()).toString();
    }
    return undefined;
  }

  static getParsedStyles() {
    let css = this.readStyleFile();
    if (!css) return undefined;

    // Remove comments
    css = css.replace("/\\/\\*.+?\\*\\//",'');

    // Remove ".graph-view" class, as it is only kept for Obsidian compatibility
    css.replace(".graph-view", '')

    return css;
  }
}