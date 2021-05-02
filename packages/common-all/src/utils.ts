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

/**
 * determine if given parameter is numeric
 * https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric/1830844#1830844
 * @param n
 * @returns boolean
 */
export const isNumeric = (n: any) => {
  return !isNaN(parseInt(n)) && isFinite(n);
};
