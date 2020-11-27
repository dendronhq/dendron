import {
  DNodeUtilsV2,
  DVault,
  SchemaModulePropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import { CreateSchemaOptsV4, NoteTestUtilsV4 } from "../noteUtils";

type CreateSchemaFactoryOpts = Omit<CreateSchemaOptsV4, "vault" | "wsRoot">;
type CreateSchemaPresetOptsV4 = {
  wsRoot: string;
  vault: DVault;
  genRandomId?: boolean;
  fname?: string;
  noWrite?: boolean;
  modifier?: (schema: SchemaModulePropsV2) => SchemaModulePropsV2;
};
const CreateSchemaFactory = (opts: CreateSchemaFactoryOpts) => {
  const func = ({ vault, wsRoot, noWrite }: CreateSchemaPresetOptsV4) => {
    const _opts: CreateSchemaOptsV4 = {
      ...opts,
      vault,
      wsRoot,
      noWrite,
    };
    return NoteTestUtilsV4.createSchema(_opts);
  };
  return { create: func, fname: opts.fname };
};

export const SCHEMA_PRESETS_V4 = {
  SCHEMA_SIMPLE: CreateSchemaFactory({
    fname: "foo",
    modifier: (schema) => {
      const vault = schema.root.vault;
      const child = SchemaUtilsV2.create({ id: "ch1", vault });
      schema.schemas["ch1"] = child;
      DNodeUtilsV2.addChild(schema.root, child);
      return schema;
    },
  }),
  SCHEMA_SIMPLE_OTHER: CreateSchemaFactory({
    fname: "bar",
    modifier: (schema) => {
      const vault = schema.root.vault;
      const child = SchemaUtilsV2.create({ id: "ch1", vault });
      schema.schemas["ch1"] = child;
      DNodeUtilsV2.addChild(schema.root, child);
      return schema;
    },
  }),
  SCHEMA_SIMPLE_OTHER_NO_CHILD: CreateSchemaFactory({
    fname: "bar",
  }),
  BAD_SCHEMA: {
    create: ({ vault, wsRoot }: CreateSchemaPresetOptsV4) => {
      const vpath = vault2Path({ vault, wsRoot });
      fs.writeFileSync(
        path.join(vpath, "hello.schema.yml"),
        `
schemas:
- id: hello
  title: hello`,
        { encoding: "utf8" }
      );
    },
    fname: "hello",
  },
};
