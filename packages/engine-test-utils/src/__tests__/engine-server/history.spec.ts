import { HistoryService } from "@dendronhq/engine-server";

describe("history", () => {
  test("subscribev2", (done) => {
    const data = { secret: 42 };
    const hist = HistoryService.instance();
    hist.subscribev2("lookupProvider", {
      id: "foo",
      listener: async (_data) => {
        expect(_data.data).toEqual(data);
        done();
      },
    });
    hist.add({
      id: "notfoo",
      action: "activate",
      source: "lookupProvider",
      data: { secret: 12 },
    });
    hist.add({ id: "foo", action: "activate", source: "lookupProvider", data });
  });
});
