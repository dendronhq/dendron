import { beforeEach, describe, it } from "mocha";
import semver from "semver";
import * as vscode from "vscode";
import { expect } from "../testUtilsv2";

/**
 * This is for testing functionality that is only triggered when upgrading
 * a workspace
 */

suite(
  "temporary testing of Dendron version compatibility downgrade sequence",
  () => {
    describe(`GIVEN the activation sequence of Dendron`, () => {
      describe(`WHEN VS Code Version is up to date`, () => {
        let invokedWorkspaceTrustFn: boolean = false;

        beforeEach(() => {
          invokedWorkspaceTrustFn = semver.gte(vscode.version, "1.57.0");
        });

        it(`THEN onDidGrantWorkspaceTrust will get invoked.`, () => {
          expect(invokedWorkspaceTrustFn).toEqual(true);
        });

        it(`AND onDidGrantWorkspaceTrust can be found in the API.`, () => {
          vscode.workspace.onDidGrantWorkspaceTrust(() => {
            //no-op for testing
          });
        });
      });

      describe(`WHEN VS Code Version is on a version less than 1.57.0`, () => {
        let invokedWorkspaceTrustFn: boolean = false;
        const userVersion = "1.56.1";
        beforeEach(() => {
          invokedWorkspaceTrustFn = semver.gte(userVersion, "1.57.0");
        });

        it(`THEN onDidGrantWorkspaceTrust will not get invoked.`, () => {
          expect(invokedWorkspaceTrustFn).toEqual(false);
        });
      });
    });
  }
);
