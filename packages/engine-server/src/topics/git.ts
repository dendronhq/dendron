import { findInParent } from "@dendronhq/common-server";
import { pathExists } from "fs-extra";
import _ from "lodash";
import path from "path";

var Git = require("nodegit");

console.log(Git);
console.log("done");

function findRepo() {
  const resp = findInParent(".", ".git");
  if (_.isUndefined(resp)) {
    throw Error("no repo found");
  }
  const pathToRepo = path.join(resp, ".git");
  Git.Repository.open(pathToRepo);
}
