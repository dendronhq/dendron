import { WorkspaceService } from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describeMultiWS } from "../testUtilsV3";
import { describe } from "mocha";
import { expect } from "../testUtilsv2";
import { trackTopLevelRepoFound } from "../../workspace/workspaceActivator";
import sinon from "sinon";
import _ from "lodash";

suite("workspaceActivator", function () {
  describe("trackTopLevelRepoFound", () => {
    describeMultiWS(
      "GIVEN a workspace tracked remotely",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        describe("WHEN https", () => {
          describe("AND GitHub", () => {
            test("THEN correctly track top level repo info", async () => {
              const { wsRoot } = ExtensionProvider.getDWorkspace();
              const wsService = new WorkspaceService({ wsRoot });
              const urlStub = sinon
                .stub(wsService, "getTopLevelRemoteUrl")
                .returns(Promise.resolve("https://github.com/foo/bar.git"));
              const out = await trackTopLevelRepoFound({ wsService });
              expect(out).toBeTruthy();
              expect(_.omit(out, "path")).toEqual({
                protocol: "https",
                provider: "github.com",
              });

              // hashed path is same every time
              const out2 = await trackTopLevelRepoFound({ wsService });
              expect(out2).toBeTruthy();
              expect(out).toEqual(out2);
              urlStub.restore();
            });
          });
          describe("AND GitLab", () => {
            test("THEN correctly track top level repo info", async () => {
              const { wsRoot } = ExtensionProvider.getDWorkspace();
              const wsService = new WorkspaceService({ wsRoot });
              const urlStub = sinon
                .stub(wsService, "getTopLevelRemoteUrl")
                .returns(Promise.resolve("https://gitlab.com/foo/bar.git"));
              const out = await trackTopLevelRepoFound({ wsService });
              expect(out).toBeTruthy();
              expect(_.omit(out, "path")).toEqual({
                protocol: "https",
                provider: "gitlab.com",
              });

              // hashed path is same every time
              const out2 = await trackTopLevelRepoFound({ wsService });
              expect(out2).toBeTruthy();
              expect(out).toEqual(out2);
              urlStub.restore();
            });
          });
          describe("AND arbitrary provider", () => {
            test("THEN correctly track top level repo info", async () => {
              const { wsRoot } = ExtensionProvider.getDWorkspace();
              const wsService = new WorkspaceService({ wsRoot });
              const urlStub = sinon
                .stub(wsService, "getTopLevelRemoteUrl")
                .returns(Promise.resolve("https://some.host/foo/bar.git"));
              const out = await trackTopLevelRepoFound({ wsService });
              expect(out).toBeTruthy();
              expect(_.omit(out, "path")).toEqual({
                protocol: "https",
                provider: "some.host",
              });

              // hashed path is same every time
              const out2 = await trackTopLevelRepoFound({ wsService });
              expect(out2).toBeTruthy();
              expect(out).toEqual(out2);
              urlStub.restore();
            });
          });
        });

        describe("WHEN git", () => {
          describe("AND GitHub", () => {
            test("THEN correctly track top level repo info", async () => {
              const { wsRoot } = ExtensionProvider.getDWorkspace();
              const wsService = new WorkspaceService({ wsRoot });
              const urlStub = sinon
                .stub(wsService, "getTopLevelRemoteUrl")
                .returns(Promise.resolve("git@github.com:foo/bar.git"));
              const out = await trackTopLevelRepoFound({ wsService });
              expect(out).toBeTruthy();
              expect(_.omit(out, "path")).toEqual({
                protocol: "git",
                provider: "github.com",
              });

              // hashed path is same every time
              const out2 = await trackTopLevelRepoFound({ wsService });
              expect(out2).toBeTruthy();
              expect(out).toEqual(out2);
              urlStub.restore();
            });
          });
          describe("AND GitLab", () => {
            test("THEN correctly track top level repo info", async () => {
              const { wsRoot } = ExtensionProvider.getDWorkspace();
              const wsService = new WorkspaceService({ wsRoot });
              const urlStub = sinon
                .stub(wsService, "getTopLevelRemoteUrl")
                .returns(Promise.resolve("git@gitlab.com:foo/bar.git"));
              const out = await trackTopLevelRepoFound({ wsService });
              expect(out).toBeTruthy();
              expect(_.omit(out, "path")).toEqual({
                protocol: "git",
                provider: "gitlab.com",
              });

              // hashed path is same every time
              const out2 = await trackTopLevelRepoFound({ wsService });
              expect(out2).toBeTruthy();
              expect(out).toEqual(out2);
              urlStub.restore();
            });
          });
          describe("AND arbitrary provider", () => {
            test("THEN correctly track top level repo info", async () => {
              const { wsRoot } = ExtensionProvider.getDWorkspace();
              const wsService = new WorkspaceService({ wsRoot });
              const urlStub = sinon
                .stub(wsService, "getTopLevelRemoteUrl")
                .returns(Promise.resolve("git@some.host:foo/bar.git"));
              const out = await trackTopLevelRepoFound({ wsService });
              expect(out).toBeTruthy();
              expect(_.omit(out, "path")).toEqual({
                protocol: "git",
                provider: "some.host",
              });

              // hashed path is same every time
              const out2 = await trackTopLevelRepoFound({ wsService });
              expect(out2).toBeTruthy();
              expect(out).toEqual(out2);
              urlStub.restore();
            });
          });
        });
      }
    );

    describeMultiWS(
      "GIVEN a workspace not tracked",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN top level repo info is not tracked", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const wsService = new WorkspaceService({ wsRoot });
          const urlStub = sinon
            .stub(wsService, "getTopLevelRemoteUrl")
            .returns(Promise.resolve(undefined));
          const out = await trackTopLevelRepoFound({ wsService });
          expect(out).toEqual(undefined);
          urlStub.restore();
        });
      }
    );
  });
});
