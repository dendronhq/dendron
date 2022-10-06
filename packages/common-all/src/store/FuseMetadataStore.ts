import _ from "lodash";
import { ResultAsync } from "neverthrow";
import { DendronError } from "../error";
import { FuseEngine } from "../FuseEngine";
import { NotePropsMeta, RespV3 } from "../types";
import { INoteQueryable, INoteQueryOpts } from "./IDataQuery";
import { INoteMetadataStore } from "./IMetadataStore";

export class FuseMetadataStore implements INoteQueryable, INoteMetadataStore {
  fuseEngine: FuseEngine;

  constructor(opts?: { fuzzThreshold: number }) {
    this.fuseEngine = new FuseEngine({
      fuzzThreshold: _.defaults(opts, { fuzzThreshold: 0.2 }).fuzzThreshold,
    });
  }

  get(key: string): Promise<RespV3<NotePropsMeta>> {
    throw new Error("Method not implemented.");
  }
  find(opts: any): Promise<RespV3<NotePropsMeta[]>> {
    throw new Error("Method not implemented.");
  }
  write(key: string, data: NotePropsMeta): Promise<RespV3<string>> {
    throw new Error("Method not implemented.");
  }
  delete(key: string): Promise<RespV3<string>> {
    throw new Error("Method not implemented.");
  }
  query(
    qs: string,
    opts: INoteQueryOpts
  ): ResultAsync<NotePropsMeta[], DendronError> {
    const items = this.fuseEngine.queryNote({
      qs,
      ...opts,
    }) as NotePropsMeta[];
    return ResultAsync.fromSafePromise(Promise.resolve(items));
  }
}
