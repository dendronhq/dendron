import {
  SegmentClient,
  TelemetryStatus,
  tmpDir,
} from "@dendronhq/common-server";
import {
  BuildUtils,
  DevCLICommand,
  DevCLICommandOpts,
  DevCommands,
  LernaUtils,
  PublishEndpoint,
  SemverVersion,
} from "@dendronhq/dendron-cli";
import fs from "fs-extra";
import path from "path";
import Sinon, { stub } from "sinon";
import { TestEngineUtils } from "../../..";
import { runEngineTestV5 } from "../../../engine";

export const runDevCmd = ({
  cmd,
  ...opts
}: { cmd: DevCommands } & DevCLICommandOpts) => {
  const cli = new DevCLICommand();
  return cli.execute({ cmd, ...opts });
};

describe("build", () => {
  const cmd = DevCommands.BUILD;
  test("ok, build local", async () => {
    jest.setTimeout(1000000);
    await runEngineTestV5(
      async () => {
        // stub lerna.json
        const root = tmpDir().name;
        fs.writeJsonSync(path.join(root, "lerna.json"), { version: "1.0.0" });
        stub(process, "cwd").returns(root);

        const prepPublishLocalStub = stub(
          BuildUtils,
          "prepPublishLocal"
        ).returns(undefined);

        const typecheckStub = stub(BuildUtils, "runTypeCheck").returns();
        const bumpVersionStub = stub(LernaUtils, "bumpVersion").returns();
        const publishVersionStub = stub(LernaUtils, "publishVersion").returns(
          Promise.resolve()
        );
        const buildNextServerStub = stub(
          BuildUtils,
          "buildNextServer"
        ).returns();
        const buildPluginViewsStub = stub(
          BuildUtils,
          "buildPluginViews"
        ).returns();
        const syncStaticAssetsStub = stub(
          BuildUtils,
          "syncStaticAssets"
        ).returns(Promise.resolve({ staticPath: "" }));
        const syncStaticAssetsToNextjsTemplateStub = stub(
          BuildUtils,
          "syncStaticAssetsToNextjsTemplate"
        ).returns(Promise.resolve());
        const prepPluginPkgStub = stub(BuildUtils, "prepPluginPkg").returns(
          Promise.resolve()
        );
        const installPluginDependenciesStub = stub(
          BuildUtils,
          "installPluginDependencies"
        ).returns({} as any);
        const compilePluginStub = stub(BuildUtils, "compilePlugin").returns(
          {} as any
        );
        const packagePluginDependenciesStub = stub(
          BuildUtils,
          "packagePluginDependencies"
        ).returns({} as any);
        const setRegRemoteStub = stub(BuildUtils, "setRegRemote").returns();
        const restorePluginPkgJsonStub = stub(
          BuildUtils,
          "restorePluginPkgJson"
        ).returns();

        await runDevCmd({
          cmd,
          publishEndpoint: PublishEndpoint.LOCAL,
          upgradeType: SemverVersion.PATCH,
        });
        [
          prepPublishLocalStub,
          typecheckStub,
          bumpVersionStub,
          publishVersionStub,
          buildNextServerStub,
          buildPluginViewsStub,
          syncStaticAssetsStub,
          syncStaticAssetsToNextjsTemplateStub,
          prepPluginPkgStub,
          installPluginDependenciesStub,
          compilePluginStub,
          packagePluginDependenciesStub,
          setRegRemoteStub,
          restorePluginPkgJsonStub,
        ].map((_stub) => {
          // uncomment to figure out which stub is failing
          // console.log(_stub);
          expect(_stub.calledOnce).toBeTruthy();
        });
      },
      {
        expect,
      }
    );
  });
});

describe("GIVEN dendron dev enable_telemetry", () => {
  beforeEach(() => {
    TestEngineUtils.mockHomeDir();
  });

  afterEach(() => {
    Sinon.restore();
  });

  const cmd = DevCommands.ENABLE_TELEMETRY;
  test("THEN sets telemetry status to ENABLED_BY_CLI_COMMAND", async () => {
    await runDevCmd({ cmd });
    expect(SegmentClient.getStatus()).toEqual(
      TelemetryStatus.ENABLED_BY_CLI_COMMAND
    );
  });
});

describe("GIVEN dendron dev disable_telemetry", () => {
  beforeEach(() => {
    TestEngineUtils.mockHomeDir();
  });

  afterEach(() => {
    Sinon.restore();
  });

  const cmd = DevCommands.DISABLE_TELEMETRY;
  test("THEN sets telemetry status to DISABLED_BY_CLI_COMMAND", async () => {
    await runDevCmd({ cmd });
    expect(SegmentClient.getStatus()).toEqual(
      TelemetryStatus.DISABLED_BY_CLI_COMMAND
    );
  });
});
