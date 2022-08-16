import { ENGINE_HOOKS, runEngineTestV5 } from "../../..";
import fs from "fs-extra";
import { SQLiteMetadataStore } from "@dendronhq/engine-server";
import _ from "lodash";

describe("GIVEN sqlite store", () => {
  test("WHEN initialize, THEN metadata has all notes", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const dirList = fs.readdirSync(wsRoot);
        expect(dirList).toMatchSnapshot();
        expect(dirList.includes("metadata.db")).toBeTruthy();
        const notes = await SQLiteMetadataStore.prisma().notes.findMany();
        expect(_.size(engine.notes)).toEqual(notes.length);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        modConfigCb: (config) => {
          config.workspace.metadataStore = "sqlite";
          return config;
        },
      }
    );
  });
});
