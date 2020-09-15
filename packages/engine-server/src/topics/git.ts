import { findInParent } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import Git from "nodegit";

export function findRepo() {
  const resp = findInParent(".", ".git");
  if (_.isUndefined(resp)) {
    throw Error("no repo found");
  }
  const pathToRepo = path.join(resp, ".git");
  Git.Repository.open(pathToRepo);
}
