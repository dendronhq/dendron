import { ResultAsync } from "neverthrow";
import { DendronError } from "../error";
import { NotePropsMeta, RespV3 } from "../types";
import { INoteQueryable } from "./IDataQuery";
import { INoteMetadataStore } from "./IMetadataStore";

export class FuseMetadataStore implements INoteQueryable, INoteMetadataStore {
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
  query(key: string): ResultAsync<NotePropsMeta[], DendronError> {
    throw new Error("Method not implemented.");
  }
}
