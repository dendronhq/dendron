import { SQLiteMetadataStore } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import sinon from "sinon";
import { ENGINE_HOOKS, runEngineTestV5 } from "../../..";

describe("GIVEN sqlite store", () => {
  test("WHEN initialize, THEN metadata has all notes", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const dirList = fs.readdirSync(wsRoot);
        expect(dirList).toMatchSnapshot();
        expect(dirList.includes("metadata.db")).toBeTruthy();
        const notes = await SQLiteMetadataStore.prisma().note.findMany();
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

  test("WHEN initialize mult times, THEN metadata has all notes", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const dirList = fs.readdirSync(wsRoot);
        expect(dirList).toMatchSnapshot();
        expect(dirList.includes("metadata.db")).toBeTruthy();
        const notes = await SQLiteMetadataStore.prisma().note.findMany();
        expect(_.size(engine.notes)).toEqual(notes.length);

        const { error } = await engine.init();
        expect(error).toBeFalsy();
        const createAllSpy = sinon.spy(SQLiteMetadataStore, "createAllTables");
        debugger;
        expect(createAllSpy.calledOnce).toBeFalsy();
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
