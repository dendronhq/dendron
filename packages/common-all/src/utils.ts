import minimatch from "minimatch";
import semver from "semver";
import GithubSlugger from "github-slugger";

export class DUtils {
  static minimatch = minimatch;
  static semver = semver;
}

export const getSlugger = () => {
  return new GithubSlugger();
};
