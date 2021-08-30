import { LruCache } from "@dendronhq/engine-server/lib/util/lruCache";

describe("lruCache.spec.ts", () => {
  describe("GIVEN lruCache configured for 5 elements", () => {
    let lruCache: LruCache<number, string>;

    beforeEach(() => {
      lruCache = new LruCache<number, string>({ maxItems: 5 });
    });

    describe("WHEN added 5 elements", () => {
      beforeEach(() => {
        for (let i = 0; i < 5; i++) {
          lruCache.set(i, `'${i}'`);
        }
      });

      it("THEN all 5 elements are present in the cache", () => {
        for (let i = 0; i < 5; i++) {
          expect(lruCache.get(i)).toEqual(`'${i}'`);
        }
      });

      describe("AND added 6th element", () => {
        beforeEach(() => {
          lruCache.set(5, `'5'`);
        });

        it("THEN last 5 elements are present in the cache", () => {
          for (let i = 1; i < 6; i++) {
            expect(lruCache.get(i)).toEqual(`'${i}'`);
          }
        });
        it("THEN first element added is NOT in the cache", () => {
          expect(lruCache.get(0)).toBeUndefined();
        });
      });

      describe("AND asked for element #1", () => {
        beforeEach(() => {
          lruCache.get(0);
        });

        describe("AND added 6th element", () => {
          beforeEach(() => {
            lruCache.set(5, `'5'`);
          });

          it("THEN element #1 is IN the cache", () => {
            expect(lruCache.get(0)).toEqual(`'0'`);
          });

          it("THEN element #2 is NOT in the cache", () => {
            expect(lruCache.get(1)).toBeUndefined();
          });

          it("THEN elements 3-6 are in the cache", () => {
            for (let i = 2; i < 6; i++) {
              expect(lruCache.get(i)).toEqual(`'${i}'`);
            }
          });
        });
      });
    });
  });

  describe("Creation error cases:", () => {
    it("WHEN trying to init cache with 0 max item THEN throw", () => {
      expect(() => new LruCache({ maxItems: 0 })).toThrow();
    });

    it("WHEN trying to init cache with negative max items THEN throw", () => {
      expect(() => new LruCache({ maxItems: -1 })).toThrow();
    });
  });
});
