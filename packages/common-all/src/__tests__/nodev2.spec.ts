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
