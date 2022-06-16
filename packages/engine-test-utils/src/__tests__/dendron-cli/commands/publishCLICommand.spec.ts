import {
  ConfigUtils,
  IntermediateDendronConfig,
  RespV3,
  URI,
} from "@dendronhq/common-all";
import {
  PublishCLICommand,
  PublishCLICommandCLIOpts,
  PublishCLICommandOpts,
  PublishCommands,
} from "@dendronhq/dendron-cli";
import { DConfig } from "@dendronhq/engine-server";
import { NextjsExportPodUtils, PublishTarget } from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import prompts from "prompts";
import sinon, { stub } from "sinon";
import { ENGINE_HOOKS, TestConfigUtils } from "../../..";
import { runEngineTestV5 } from "../../../engine";
import { checkString } from "../../../utils";

export const runPublishCmd = ({
  cmd,
  ...opts
}: {
  cmd: PublishCommands;
  cli?: PublishCLICommand;
} & PublishCLICommandOpts) => {
  const cli = opts.cli ? opts.cli : new PublishCLICommand();
  return cli.execute({ cmd, ...opts });
};

export const evalPublishCmd = ({
  cmd,
  ...opts
}: {
  cmd: PublishCommands;
  cli?: PublishCLICommand;
} & PublishCLICommandCLIOpts) => {
  const cli = opts.cli ? opts.cli : new PublishCLICommand();
  sinon.stub(cli, "validateConfig").resolves();
  return cli.eval({ cmd, ...opts });
};

describe("WHEN run `dendron publish init`", () => {
  const cmd = PublishCommands.INIT;
  afterEach(() => {
    sinon.restore();
  });

  const getData = (resp: RespV3<any>) => {
    if (!_.isUndefined(resp.error)) {
      throw Error("error is not undefined");
    }
    return resp.data;
  };

  describe("AND WHEN no templateVersion set", () => {
    test("THEN clone with latest version", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cli = new PublishCLICommand();
          const latestVersion = "0.97.0";
          const stubClone = stub(cli, "_cloneTemplate").returns(
            new Promise<void>((resolve) => {
              resolve();
            })
          );
          const stubSwitch = stub(
            NextjsExportPodUtils,
            "switchToBranch"
          ).resolves();
          const stubGetNextVersion = stub(
            NextjsExportPodUtils,
            "getNextVersion"
          ).returns({ data: latestVersion });
          const stubInstall = stub(cli, "_installDependencies").resolves();
          const resp = await runPublishCmd({ cli, cmd, wsRoot });

          // cloned
          expect(stubClone.calledOn).toBeTruthy();
          // switch to latest branch
          expect(
            stubSwitch.calledWith({
              version: "tags/vlatest",
              nextPath: path.join(wsRoot, ".next"),
            })
          ).toBeTruthy();
          // install dependencies
          expect(stubInstall.calledOn).toBeTruthy();
          // get next version checked
          expect(stubGetNextVersion.calledOn).toBeTruthy();
          // templateVersion set to latest
          expect(getData(resp).templateVersion).toEqual(latestVersion);
          // templateVersion written to config
          const newConfig = DConfig.getOrCreate(wsRoot);
          expect(NextjsExportPodUtils.templateVersion(newConfig)).toEqual(
            latestVersion
          );
        },
        {
          expect,
        }
      );
    });
  });

  describe("AND WHEN templateVersion set", () => {
    const templateVersion = "0.95.0";
    test("THEN clone with templateVersion", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cli = new PublishCLICommand();
          const latestVersion = templateVersion;
          const stubClone = stub(cli, "_cloneTemplate").resolves();
          const stubSwitch = stub(
            NextjsExportPodUtils,
            "switchToBranch"
          ).resolves();
          const stubInstall = stub(cli, "_installDependencies").resolves();
          const resp = await runPublishCmd({ cli, cmd, wsRoot });

          expect(stubClone.calledOn).toBeTruthy();
          expect(
            stubSwitch.calledWith({
              version: latestVersion,
              nextPath: path.join(wsRoot, ".next"),
            })
          ).toBeTruthy();
          expect(stubInstall.calledOn).toBeTruthy();
          expect(getData(resp).templateVersion).toEqual(latestVersion);
          // template version unchanged
          const newConfig = DConfig.getOrCreate(wsRoot);
          expect(NextjsExportPodUtils.templateVersion(newConfig)).toEqual(
            templateVersion
          );
        },
        {
          expect,
          modConfigCb: (config: IntermediateDendronConfig) => {
            config.publishing!.templateVersion = templateVersion;
            return config;
          },
        }
      );
    });
  });

  describe("AND WHEN template exists", () => {
    test("THEN do not clone", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cli = new PublishCLICommand();
          stub(cli, "_nextPathExists").resolves(true);
          const resp = await runPublishCmd({ cli, cmd, wsRoot });
          expect(resp.error.message).toEqual("template exists");
        },
        {
          expect,
        }
      );
    });
  });
});

describe("WHEN run `dendron publish build`", () => {
  const cmd = PublishCommands.BUILD;
  afterEach(() => {
    sinon.restore();
  });

  test("THEN succeed", async () => {
    jest.setTimeout(15000);
    await runEngineTestV5(
      async ({ wsRoot }) => {
        await runPublishCmd({ cmd, wsRoot });
        const dataDir = path.join(wsRoot, ".next", "data");
        expect(fs.existsSync(dataDir)).toBeTruthy();
      },
      {
        expect,
      }
    );
  });

  describe("AND WHEN sitemap is used", () => {
    test("THEN sitemap is called", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cli = new PublishCLICommand();
          const buildNext = stub(cli, "_buildNextData").resolves({
            error: undefined,
            data: {} as any,
          });
          const buildSiteMapstub = stub(
            NextjsExportPodUtils,
            "buildSiteMap"
          ).resolves(0);
          await runPublishCmd({
            cli,
            cmd,
            wsRoot,
            sitemap: true,
          });
          expect(
            _.every(
              [buildNext, buildSiteMapstub].map((ent) => {
                return ent.calledOnce;
              })
            )
          ).toBeTruthy();
        },
        {
          expect,
        }
      );
    });
  });

  describe("AND with invalid override key", () => {
    test("THEN show error", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const out = await evalPublishCmd({
            cmd,
            wsRoot,
            overrides: "foo=bar",
          });
          expect(out?.error?.message).toEqual(
            "bad key for override. foo is not a valid key"
          );
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND with asset prefix without forward slash", () => {
    test("THEN show error", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setPublishProp(config, "assetsPrefix", "foo");
              return config;
            },
            { wsRoot }
          );
          await evalPublishCmd({
            cmd,
            wsRoot,
          });
          const out = await evalPublishCmd({
            cmd,
            wsRoot,
          });
          await checkString(out.error!.message, "assetsPrefix requires a '/");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND with siteUrl override", () => {
    test("THEN update siteUrl", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const siteUrlOverride = "http://foo.com";
          await evalPublishCmd({
            cmd,
            wsRoot,
            overrides: `siteUrl=${siteUrlOverride}`,
          });
          const dest = URI.file(path.join(wsRoot, ".next"));
          const dataDir = path.join(wsRoot, ".next", "data");
          expect(fs.existsSync(dataDir)).toBeTruthy();

          const cpath = NextjsExportPodUtils.getDendronConfigPath(dest);
          const config = fs.readJSONSync(cpath) as IntermediateDendronConfig;
          expect(config.publishing!.siteUrl).toEqual(siteUrlOverride);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});

describe("WHEN run `dendron publish dev`", () => {
  const cmd = PublishCommands.DEV;
  afterEach(() => {
    sinon.restore();
  });
  test("THEN run build ", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const cli = new PublishCLICommand();
        const initStub = stub(cli, "init").resolves({
          data: { templateVersion: "" },
        });
        const buildStub = stub(cli, "build").resolves({ error: null });
        const devStub = stub(cli, "dev").resolves({ error: null });
        await runPublishCmd({ cli, cmd, wsRoot });
        expect(initStub.calledOnce).toBeTruthy();
        expect(buildStub.calledOnce).toBeTruthy();
        expect(devStub.calledOnce).toBeTruthy();
      },
      {
        expect,
      }
    );
  });
});

describe("WHEN run `dendron publish export`", () => {
  const cmd = PublishCommands.EXPORT;
  afterEach(() => {
    sinon.restore();
  });

  describe("AND WHEN github target", () => {
    describe("AND docs folder exists", () => {
      test("THEN delete when confirm", async () => {
        await runEngineTestV5(
          async ({ wsRoot }) => {
            const cli = new PublishCLICommand();
            const docsPath = path.join(wsRoot, "docs");
            fs.ensureDirSync(docsPath);
            fs.ensureFileSync(path.join(docsPath, "canary-fail"));
            fs.ensureFileSync(
              path.join(wsRoot, ".next", "out", "canary-success")
            );
            const initStub = stub(cli, "init").resolves({
              data: { templateVersion: "" },
            });
            const buildStub = stub(cli, "build").resolves({ error: null });
            const exportStub = stub(cli, "export").resolves({} as any);
            prompts.inject([true]);
            await runPublishCmd({
              cli,
              cmd,
              wsRoot,
              target: PublishTarget.GITHUB,
            });
            // build and export called
            expect(initStub.calledOnce).toBeTruthy();
            expect(buildStub.calledOnce).toBeTruthy();
            expect(exportStub.calledOnce).toBeTruthy();
            // old docs removed
            expect(
              fs.pathExistsSync(path.join(docsPath, "canary-fail"))
            ).toBeFalsy();
            // contents of out moved over
            expect(
              fs.pathExistsSync(path.join(docsPath, "canary-success"))
            ).toBeTruthy();
            // no jekyll file generated
            expect(
              fs.pathExistsSync(path.join(docsPath, ".nojekyll"))
            ).toBeTruthy();
          },
          {
            expect,
          }
        );
      });

      test("THEN cancel when no confirm", async () => {
        await runEngineTestV5(
          async ({ wsRoot }) => {
            const cli = new PublishCLICommand();
            const docsPath = path.join(wsRoot, "docs");
            fs.ensureDirSync(docsPath);
            fs.ensureFileSync(path.join(docsPath, "canary-fail"));
            fs.ensureFileSync(
              path.join(wsRoot, ".next", "out", "canary-success")
            );
            const initStub = stub(cli, "init").resolves({
              data: { templateVersion: "" },
            });
            const buildStub = stub(cli, "build").resolves({ error: null });
            const exportStub = stub(cli, "export").resolves({} as any);
            prompts.inject([false]);
            await runPublishCmd({
              cli,
              cmd,
              wsRoot,
              target: PublishTarget.GITHUB,
            });
            // build and export called
            expect(initStub.calledOnce).toBeTruthy();
            expect(buildStub.callCount).toBeTruthy();
            expect(exportStub.calledOnce).toBeTruthy();
            // old docs removed
            expect(
              fs.pathExistsSync(path.join(docsPath, "canary-fail"))
            ).toBeTruthy();
            // contents of out moved over
            expect(
              fs.pathExistsSync(path.join(docsPath, "canary-success"))
            ).toBeFalsy();
            // no jekyll file generated
            expect(
              fs.pathExistsSync(path.join(docsPath, ".nojekyll"))
            ).toBeFalsy();
          },
          {
            expect,
          }
        );
      });
    });
  });
});
