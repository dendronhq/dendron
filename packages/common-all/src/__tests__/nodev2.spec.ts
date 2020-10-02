import { DNodeUtilsV2 } from "../nodev2";

describe("DNodeUtilsV2", () => {
  describe("getDomain", () => {
    it("basic", () => {
      const root = DNodeUtilsV2.create({
        fname: "root",
        id: "root",
        parent: null,
        type: "note",
      });
      const bar = DNodeUtilsV2.create({
        fname: "bar",
        id: "bar",
        parent: root.id,
        type: "note",
      });
      const barChild = DNodeUtilsV2.create({
        fname: "bar.ch1",
        id: "bar.ch1",
        parent: bar.id,
        type: "note",
      });
      const nodeDict = { bar, barChild };
      expect(DNodeUtilsV2.getDomain(barChild, { nodeDict })).toEqual(bar);
      expect(DNodeUtilsV2.getDomain(bar, { nodeDict })).toEqual(bar);
    });
  });
});

describe("SchemaUtilsV2", () => {
  describe("matchDomain", () => {
    it("basic", async () => {
      //   const schemaModules = await NodeTestUtilsV2.createSchemas({});
      //   const notes = await NodeTestUtilsV2.createNotes({});
      //   const noteDict: NotePropsDictV2 = {};
      //   const schemaDict: SchemaModuleDictV2= {};
      //   notes.forEach((n: NotePropsV2) => {
      //     noteDict[n.id] = n
      //   })
      //   schemaModules.forEach(n => {
      //     schemaDict[n.id] = n
      //   })
      //   const rootNote = _.find(notes, { id: "root" }) as NotePropsV2;
      //   const domains = rootNote.children.map((ent) =>
      //     _.find(notes, { id: ent })
      //   ) as NotePropsV2[];
      //   SchemaUtilsV2.matchDomain(domains[0]);
    });
  });
});
