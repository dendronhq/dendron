import {
  IReducedEngineAPIService,
  LookupQuickpickFactory,
} from "@dendronhq/plugin-common";

export async function WebNoteLookupCmd(engine: IReducedEngineAPIService) {
  console.log("WebNoteLookupCmd Entry Point");

  // const engine = await getWebEngine(wsRoot, vaults);

  // debugger;
  const factory = new LookupQuickpickFactory(engine);
  // const factory = new LookupQuickpickFactory(new MockEngineAPIService());
  factory.ShowLookup();
}
