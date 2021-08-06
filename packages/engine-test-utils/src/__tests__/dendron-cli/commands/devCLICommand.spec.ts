import {
  DevCLICommand,
  DevCLICommandOpts,
  DevCommands,
  BuildUtils,
  LernaUtils,
	PublishEndpoint,
	SemverVersion,
} from "@dendronhq/dendron-cli";
import { stub } from "sinon";
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
    await runEngineTestV5(
      async ({}) => {
        const prepPublishLocalStub = stub(
          BuildUtils,
          "prepPublishLocal"
        ).returns(Promise.resolve());
        const bump11tyStub = stub(BuildUtils, "bump11ty").returns();
        const typecheckStub = stub(BuildUtils, "runTypeCheck").returns();
        const bumpVersionStub = stub(LernaUtils, "bumpVersion").returns();
        const publishVersionStub = stub(LernaUtils, "publishVersion").returns();
        const buildNextServerStub = stub(
          BuildUtils,
          "buildNextServer"
        ).returns();
        const syncStaticAssetsStub = stub(
          BuildUtils,
          "syncStaticAssets"
        ).returns(Promise.resolve());
        const prepPluginPkgStub = stub(BuildUtils, "prepPluginPkg").returns();
        const installPluginDependenciesStub = stub(
          BuildUtils,
          "installPluginDependencies"
        ).returns({} as any);
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
					upgradeType: SemverVersion.PATCH
        });
        [
          prepPublishLocalStub,
          bump11tyStub,
          typecheckStub,
          bumpVersionStub,
          publishVersionStub,
          buildNextServerStub,
          syncStaticAssetsStub,
          prepPluginPkgStub,
          installPluginDependenciesStub,
          packagePluginDependenciesStub,
          setRegRemoteStub,
          restorePluginPkgJsonStub,
        ].map((_stub) => {
          expect(_stub.calledOnce).toBeTruthy();
        });
      },
      {
        expect,
      }
    );
  });
});
