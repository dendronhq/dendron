import path from "path";
import os from "os";
import fs from "fs-extra";
import { Uri } from "vscode";
import { VSCodeUtils } from "./utils";
import { DConfig } from "@dendronhq/engine-server";
import { DendronWorkspace } from "./workspace";
import { DendronConfig } from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";

// TODO: If you'd like to target a specific theme, pre-pend each class with either ".theme-dark" or ".theme-light"

const STYLES_TEMPLATE = `/*
Add Dendron graph styles below. The graph can be styled with any valid Cytoscape.js selector: https://js.cytoscape.org/#cy.style
Full Dendron-specific styling documentation can be found here: [LINK HERE]

Note: Empty selectors may affect parsing of following selectors, so be sure to comment/remove them when not in use.
If style properties are not applying, make sure each property is followed with a semicolon.
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
`;
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
  private static singleton: GraphStyleService;
  private static dendronConfig: DendronConfig

  private constructor() {
    const configPath = DConfig.configPath(DendronWorkspace.wsRoot());
    GraphStyleService.dendronConfig = readYAML(configPath)
  }
  
  static getInstance() {
    if (!GraphStyleService.singleton) GraphStyleService.singleton = new GraphStyleService()
    return GraphStyleService.singleton
  }  

  styleFilePath() {
    const filePath = GraphStyleService.dendronConfig.graph?.stylePath || 'graph.css'

    return path.join(os.homedir(), ".dendron", "styles", filePath);
  }

  doesStyleFileExist() {
    return fs.pathExistsSync(this.styleFilePath());
  }

  createStyleFile() {
    fs.ensureFileSync(this.styleFilePath());
    fs.writeFileSync(this.styleFilePath(), STYLES_TEMPLATE);
  }

  async openStyleFile() {
    const uri = Uri.file(this.styleFilePath());
    await VSCodeUtils.openFileInEditor(uri);
  }

  readStyleFile() {
    if (this.doesStyleFileExist()) {
      return fs.readFileSync(this.styleFilePath()).toString();
    }
    return undefined;
  }

  getParsedStyles() {
    let css = this.readStyleFile();
    if (!css) return undefined;

    // Remove comments
    css = css.replace("/\\/\\*.+?\\*\\//", "");

    // Remove ".graph-view" class, as it is only kept for Obsidian compatibility
    css.replace(".graph-view", "");

    return css;
  }
}
