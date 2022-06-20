/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import {
  NoteTrait,
  onCreateProps,
  onWillCreateProps,
} from "@dendronhq/common-all";
// import fs from "fs-extra";
// import path from "path";

/**
 * A Note Trait that will execute end-user defined javascript code.
 */
export class UserDefinedTraitV1 implements NoteTrait {
  id: string;
  getTemplateType: any;
  scriptPath: string;

  OnCreate?: onCreateProps;
  OnWillCreate?: onWillCreateProps;

  /**
   *
   * @param traitId ID for the note type
   * @param scriptPath - path to the .js file that will be dynamically run
   */
  constructor(traitId: string, scriptPath: string) {
    this.id = traitId;
    this.scriptPath = scriptPath;
  }

  /**
   * This method needs to be called before a user defined trait's defined
   * methods will be invoked.
   */
  async initialize() {
    // Copy the user's JS file to somewhere in the current node execution path.
    // This allows any module.requires (such as lodash, luxon) in the user's JS
    // file to properly resolve and gives the user full access to any node
    // modules Dendron is using.
    // const userTraitsPath = path.join(__dirname, "user-traits");
    // const destPath = path.join(userTraitsPath, path.basename(this.scriptPath));

    // fs.ensureDirSync(userTraitsPath);
    // fs.copyFileSync(this.scriptPath, destPath);

    const _ = require("lodash");
    const luxon = require("luxon");
    const hack = require(`./webpack-require-hack.js`);
    const trait = hack(this.scriptPath);
    // const pro = trait.OnCreate.prototype;

    const proto = Object.getPrototypeOf(trait);

    proto._ = _;
    proto.luxon = luxon;

    // const trait = hack(destPath);

    this.OnCreate = trait.OnCreate;
    this.OnWillCreate = trait.OnWillCreate;
  }
}
