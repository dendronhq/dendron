import { MemoryStore } from "../memoryStore";

describe("memory store", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = MemoryStore.instance(true);
  });

  test("basic", async () => {
    await store.put("foo", 1);
    const resp = await store.list("foo");
    expect(resp).toMatchSnapshot();
  });
});
